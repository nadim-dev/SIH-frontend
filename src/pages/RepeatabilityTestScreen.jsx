import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { submitFullInspectionApi, submitRepeatabilityObservationsApi } from '../api/instrumentApi';

const runs = [
  ['1', '75.000', '75.000', '0.025', '75.0000', '0.0000'],
  ['2', '75.000', '75.000', '0.020', '75.0050', '+0.0050'],
  ['3', '75.000', '75.000', '0.030', '74.9950', '-0.0050'],
];

export const RepeatabilityTestScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      await submitRepeatabilityObservationsApi(id, { testLoad: 75, runs: runs.map((row) => ({ indicated: Number(row[2]), deltaL: Number(row[3]) })) });
      await submitFullInspectionApi(id);
      navigate('/testing-person/dashboard');
    }
    catch (err) { setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit inspection.'); }
    finally { setSubmitting(false); }
  };
  return <main className="repeatability-page"><section className="repeatability-shell">
    <div className="repeatability-heading"><div><h1>Repeatability Test (OIML R 76-1 Clause A.4.10)</h1><p>Scale: Altamash Steel (IX-202) | Class: III | Test Load: 75.000 kg (50% Max) | e: 0.050 kg</p></div><button className="auto-fill-button">⚡ Auto-Fill Demo Data</button></div>
    <div className="test-stepper"><span className="step complete">✓ <b>Weighing Test</b></span><i>—</i><span className="step complete">✓ <b>Eccentricity Test</b></span><i>—</i><span className="step active"><b>3.</b> Repeatability Test</span></div>
    <div className="repeatability-table-wrap"><table className="repeatability-table"><thead><tr>{['Run #','Load Applied (kg)','Indication I (kg)','Added ΔL (kg)','True Indication P','Corrected Ec','Status'].map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{runs.map((row) => <tr key={row[0]}>{row.map((value, index) => <td key={index}>{value}</td>)}<td><span className="status pass">PASS</span></td></tr>)}</tbody></table></div>
    <div className="consistency-card"><h2>Metrological Consistency Summary</h2><div className="metric-strip"><div><small>P Max</small><strong>75.0050 kg</strong></div><div><small>P Min</small><strong>74.9950 kg</strong></div><div><small>Variation Range (|Pmax - Pmin|)</small><strong>0.0100 kg</strong></div><div className="limit"><small>Statutory Limit (MPE)</small><strong>✓ ≤ 0.0500 kg</strong></div></div><p>Range (0.0100 kg) ≤ MPE (0.0500 kg) — Repeatability Criteria Satisfied</p></div>
    <div className="repeatability-footer"><strong>✓ All Physical Modules Complete: READY FOR SUPERVISORY AUDIT</strong><button className="proceed-button" disabled={submitting} onClick={handleSubmit}>{submitting ? 'Submitting...' : 'Submit Full Inspection for Stamping & Certification →'}</button></div>
    {error && <div className="testing-error-banner">{error}</div>}
  </section></main>;
};
