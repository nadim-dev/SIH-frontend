import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Decimal from 'decimal.js';
import { getInstrumentForTestingApi, submitInstrumentObservationsApi } from '../api/instrumentApi';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const TestingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [instrument, setInstrument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const getTestPoints = (points = []) => [
    ...points,
    ...points.slice(0, 4).reverse().map((tp, index) => ({
      ...tp,
      step: points.length + index,
      description: `Unload to ${tp.description.replace(/\s*\([^)]*\)/, '')}`,
    })),
  ];

  // Demo readings match the applied load and add no extra load, so every row
  // stays within the configured MPE limit. They remain editable by the tester.
  const getDemoReadings = (points = []) => {
    const demo = {};
    getTestPoints(points).forEach((tp) => {
      demo[tp.step] = {
        indicated: Number(tp.load).toFixed(3),
        deltaL: '0.000',
      };
    });
    return demo;
  };

  // 1. Fetch Instrument & Generated Test Points from Backend
  useEffect(() => {
    const fetchInstrument = async () => {
      try {
        const res = await getInstrumentForTestingApi(id);
        setInstrument(res.data);

        // Initialize state for inputs
        setReadings(getDemoReadings(res.data.testPoints));
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

  const handleAutoFill = () => setReadings(getDemoReadings(instrument?.testPoints));

  // 2. Metrological Live Calculations (OIML R 76-1 Clause A.4.4.3)
  
 const calculatedGrid = useMemo(() => {
  if (!instrument || !instrument.testPoints) return [];

  try {
    const eDec = new Decimal(instrument.e);
    const halfE = eDec.times(0.5);

    // 1. Step 0: Calculate Zero Error E0 Baseline
    let E0 = null;
    const zeroReading = readings[0];
    
    if (
      zeroReading &&
      zeroReading.indicated !== '' &&
      zeroReading.deltaL !== '' &&
      !isNaN(zeroReading.indicated) &&
      !isNaN(zeroReading.deltaL)
    ) {
      try {
        const I0 = new Decimal(zeroReading.indicated);
        const dL0 = new Decimal(zeroReading.deltaL);
        const P0 = I0.plus(halfE).minus(dL0);
        E0 = P0; // E0 = P0 - L0 (where L0 = 0)
      } catch {
        E0 = null;
      }
    }

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

        // If Step 0 has not been filled yet, do not evaluate Ec for higher steps
        if (E0 === null && tp.step !== 0) {
          return {
            ...tp,
            indicated: row.indicated,
            deltaL: row.deltaL,
            P: P.toFixed(4),
            E: E.toFixed(4),
            Ec: 'Waiting for Step 0',
            passed: null,
          };
        }

        // Ec = E - E0 (For Step 0, Ec is simply E0)
        const currentE0 = E0 !== null ? E0 : E;
        const Ec = E.minus(currentE0);

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

  // 3. Final Submission to Backend
  const handleSubmitTest = async () => {
    setSubmitting(true);
    setServerError('');
    try {
      await submitInstrumentObservationsApi(id, {
        readings: calculatedGrid,
        overallResult: allPassed ? 'PASS' : 'FAIL',
      });
      alert('Test observations submitted successfully!');
      navigate(`/testing/${id}/eccentricity`);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to submit test results.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="testing-state">Loading Metrology Test Grid...</div>;
  if (!instrument) return <div className="testing-state testing-error">{serverError || 'Instrument not found'}</div>;

  return (
    <main className="testing-page"><section className="testing-shell">
      <div className="testing-heading-row">
        <h1 className="testing-title">Weighing Performance Test (OIML R 76-1)</h1>
        <button type="button" className="auto-fill-button" onClick={handleAutoFill}>⚡ Auto-Fill Demo Data</button>
      </div>
      <p className="testing-meta">
        <strong>Scale:</strong> {instrument.manufacturer} ({instrument.modelNumber}) | <strong>Class:</strong> {instrument.accuracyClass} | <strong>Max:</strong> {instrument.max} {instrument.unit} | <strong>e:</strong> {instrument.e} {instrument.unit}
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
            <th style={{ padding: '10px' }}>Added ΔL ({instrument.unit})</th>
            <th style={{ padding: '10px' }}>True P</th>
            <th style={{ padding: '10px' }}>Corrected Error Ec</th>
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

      <div className="testing-footer">
        <div>
          <strong className="overall-label">✓</strong><strong> Overall Test Result: </strong>
          {allPassed ? (
            <span style={{ color: '#16A34A', fontWeight: 'bold' }}>CONFORMS TO OIML R 76</span>
          ) : (
            <span style={{ color: '#DC2626', fontWeight: 'bold' }}>DOES NOT CONFORM / PENDING</span>
          )}
        </div>
        <button
          onClick={handleSubmitTest}
          disabled={submitting || !allPassed}
          className="submit-test-button"
        >
          {submitting ? 'Submitting...' : 'Submit Test for Verification'}
        </button>
      </div>
    </section></main>
  );
};
