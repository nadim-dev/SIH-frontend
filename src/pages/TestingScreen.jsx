import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import Decimal from 'decimal.js';
import { getWeighingTestConfigApi, uploadWeighingEvidenceApi, submitInstrumentObservationsApi, createNonComplianceReportApi } from '../api/instrumentApi';
import NonComplianceReportModal from '../components/NonComplianceReportModal';
import EvidenceUpload from '../components/EvidenceUpload';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const TestingScreen = () => {
  const { setHeaderContent } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationNumber = searchParams.get('applicationNumber');

  const [instrument, setInstrument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showNcrForm, setShowNcrForm] = useState(false);

  useEffect(() => {
    setHeaderContent?.({ title: 'Weighing Performance Test', subtitle: 'Perform and record weighing observations for the specified test loads.' });
  }, [setHeaderContent]);

  const getTestPoints = (points = []) => [
    ...points,
    ...points.slice(0, 4).reverse().map((tp, index) => ({
      ...tp,
      step: points.length + index,
      description: `Unload to ${tp.description.replace(/\s*\([^)]*\)/, '')}`,
    })),
  ];

  // 1. Fetch Instrument & Generated Test Points from Backend
  useEffect(() => {
    const fetchInstrument = async () => {
      try {
        const res = await getWeighingTestConfigApi(id);
        const config = res.data;
        setInstrument({ ...config.instrument, testPoints: config.testPoints });

        // Initialize state for inputs
        setReadings({});
      } catch (err) {
        setServerError(err.response?.data?.error || 'Failed to load test configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchInstrument();
  }, [id]);

  const handleInputChange = (step, field, value) => {
    setReadings((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value,
      },
    }));
  };

  const isRowUnlocked = (index) => {
    if (index === 0) return true;
    const previous = calculatedGrid[index - 1];
    return previous?.indicated !== '' && previous?.deltaL !== '';
  };

  // 2. Metrological Live Calculations (OIML R 76-1 Clause A.4.4.3)
  
 const calculatedGrid = useMemo(() => {
  if (!instrument || !instrument.testPoints) return [];

  try {
    const eDec = new Decimal(instrument.e);
    const halfE = eDec.times(0.5);

    // The generated sequence starts at minimum load, not a separate zero-load
    // observation. Therefore do not use the first minimum-load row as E0;
    // doing so would force its corrected error to 0.0000. The backend stores
    // the same zero baseline until a dedicated zero-load observation is added.
    const E0 = new Decimal(0);

    // 2. Map over all test points
    return getTestPoints(instrument.testPoints).map((tp) => {
      const row = readings[tp.step] || { indicated: '', deltaL: '' };
      const hasValues =
        row.indicated !== '' &&
        row.deltaL !== '' &&
        !isNaN(row.indicated) &&
        !isNaN(row.deltaL);

      // If fields are empty or invalid
      if (!hasValues) {
        return {
          ...tp,
          indicated: row.indicated,
          deltaL: row.deltaL,
          P: '-',
          E: '-',
          Ec: '-',
          passed: null,
        };
      }

      try {
        const L = new Decimal(tp.load);
        const I = new Decimal(row.indicated);
        const dL = new Decimal(row.deltaL);
        const mpe = new Decimal(tp.mpe);

        // P = I + 0.5e - ΔL
        const P = I.plus(halfE).minus(dL);

        // E = P - L
        const E = P.minus(L);

        // Corrected error is the actual error relative to the zero baseline.
        const Ec = E.minus(E0);

        // Pass / Fail Check: |Ec| <= MPE
        const passed = Ec.abs().lessThanOrEqualTo(mpe);

        return {
          ...tp,
          indicated: row.indicated,
          deltaL: row.deltaL,
          P: P.toFixed(4),
          E: E.toFixed(4),
          Ec: Ec.toFixed(4),
          passed,
        };
      } catch {
        return {
          ...tp,
          indicated: row.indicated,
          deltaL: row.deltaL,
          P: '-',
          E: '-',
          Ec: '-',
          passed: null,
        };
      }
    });
  } catch {
    return [];
  }
}, [instrument, readings]);

  const allPassed =
    calculatedGrid.length > 0 &&
    calculatedGrid.every((row) => row.passed === true);

  const failedItems = calculatedGrid
    .filter((row) => row.passed === false)
    .map((row) => ({
      key: `weighing-${row.step}`,
      label: `${row.description} exceeded the MPE limit (Ec ${row.Ec}, MPE ±${row.mpe})`,
    }));

  const canGenerateNCR = failedItems.length > 0 && calculatedGrid.every((row) => row.indicated !== "" && row.deltaL !== "");


  // 3. Final Submission to Backend
  const handleSubmitTest = async () => {
    setSubmitting(true);
    setServerError('');
    try {
      await submitInstrumentObservationsApi(id, {
        readings: calculatedGrid,
        overallResult: allPassed ? 'PASS' : 'FAIL',
      });
      navigate(`/testing/${applicationNumber || id}/test-execution`);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to submit test results.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="testing-state">Loading Metrology Test Grid...</div>;
  if (!instrument) return <div className="testing-state testing-error">{serverError || 'Instrument not found'}</div>;

  return (
    <>
    <main className="testing-page"><section className="testing-shell">
      <div className="testing-heading-row">
        <h1 className="testing-title text-[1rem]">Weighing Performance Test</h1>  
      </div>
      <p className="testing-meta">
        <strong>Scale:</strong> {instrument.instrumentType} | <strong>Manufacturer:</strong> {instrument.manufacturer} | <strong>Model:</strong> {instrument.modelNumber} | <strong>Class:</strong> {instrument.accuracyClass} | <strong>Max:</strong> {instrument.max} {instrument.unit} | <strong>e:</strong> {instrument.e} {instrument.unit}
      </p>

      {serverError && (
        <div className="testing-error-banner">
          {serverError}
        </div>
      )}

      <div className="testing-table-wrap"><table className="testing-table">
        <thead>
          <tr style={{ background: '#F3F4F6', borderBottom: '2px solid #D1D5DB' }}>
            <th style={{ padding: '10px' }}>Step</th>
            <th style={{ padding: '10px' }}>Description</th>
            <th style={{ padding: '10px' }}>Load L ({instrument.unit})</th>
            <th style={{ padding: '10px' }}>Indication I ({instrument.unit})</th>
            <th style={{ padding: '10px' }}> ΔL ({instrument.unit})</th>
            <th style={{ padding: '10px' }}>True P</th>
            <th style={{ padding: '10px' }}>Corrected Error (Ec)</th>
            <th style={{ padding: '10px' }}>MPE Limit</th>
            <th style={{ padding: '10px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="phase-row phase-increasing"><td colSpan="9">▲ PHASE 1: INCREASING LOAD (Loading &amp; Linearity)</td></tr>
          {calculatedGrid.map((row, index) => (
            <React.Fragment key={row.step}>
            {index === instrument.testPoints.length && <tr className="phase-row"><td colSpan="9">▼ PHASE: DECREASING LOAD (Unloading &amp; Hysteresis Recovery)</td></tr>}
            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '10px' }}>{index + 1}</td>
              <td style={{ padding: '10px' }}>{row.description}</td>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>{Number(row.load).toFixed(3)}</td>
              <td style={{ padding: '10px' }}>
                <input
                  type="number"
                  step="any"
                  placeholder={Number(row.load).toFixed(3)}
                  value={row.indicated}
                  onChange={(e) => handleInputChange(row.step, 'indicated', e.target.value)}
                  className="grid-input"
                  disabled={!isRowUnlocked(index)}
                />
              </td>
              <td style={{ padding: '10px' }}>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 0.025"
                  value={row.deltaL}
                  onChange={(e) => handleInputChange(row.step, 'deltaL', e.target.value)}
                  className="grid-input"
                  disabled={!isRowUnlocked(index)}
                />
              </td>
              <td style={{ padding: '10px', fontFamily: 'monospace' }}>{row.P}</td>
              <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>{row.Ec}</td>
              <td style={{ padding: '10px', color: '#6B7280' }}>±{row.mpe}</td>
              <td style={{ padding: '10px' }}>
                {row.passed === null ? (
                    <span className="status pending">PENDING</span>
                ) : row.passed ? (
                    <span className="status pass">● PASS</span>
                ) : (
                    <span className="status fail">FAIL</span>
                )}
              </td>
            </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table></div>

      <EvidenceUpload uploadImage={async (file, metadata) => { const response = await uploadWeighingEvidenceApi(id, file, { ...metadata, testType: "weighingTest" }); return response.evidence?.at(-1); }} />

      <div className="testing-footer">
        <div>
          <strong className="overall-label">✓</strong><strong> Overall Test Result: </strong>
          {allPassed ? (
            <span style={{ color: '#16A34A', fontWeight: 'bold' }}>CONFORMS TO OIML R 76</span>
          ) : (
            <span style={{ color: '#DC2626', fontWeight: 'bold' }}>DOES NOT CONFORM / PENDING</span>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowNcrForm(true)}
            disabled={!canGenerateNCR}
            className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            Generate Non-Compliance
          </button>
          <button
            onClick={handleSubmitTest}
            disabled={submitting || !allPassed}
            className="submit-test-button"
          >
            {submitting ? 'Submitting...' : 'Submit Test Results'}
          </button>
        </div>
      </div>
    </section></main>

    <NonComplianceReportModal
      open={showNcrForm}
      instrumentId={id}
      failedItems={failedItems}
      onClose={() => setShowNcrForm(false)}
      onSubmit={async (payload) => {
        await submitInstrumentObservationsApi(id, { readings: calculatedGrid, overallResult: "FAIL" });
        return createNonComplianceReportApi({ ...payload, testType: "WEIGHING_PERFORMANCE" });
      }}
      onSubmitted={() => navigate("/testing-person/dashboard")}
    />
    </>
  );
};
