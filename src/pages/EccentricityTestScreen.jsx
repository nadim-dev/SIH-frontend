import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { submitEccentricityObservationsApi } from '../api/instrumentApi';

const positions = [
  ['1', 'Center', '50.000', '50.000', '0.025', '50.0000', '0.0000'],
  ['2', 'Front-Left', '50.000', '50.000', '0.020', '50.0050', '+0.0050'],
  ['3', 'Rear-Left', '50.000', '50.000', '0.030', '49.9950', '-0.0050'],
  ['4', 'Rear-Right', '50.000', '50.000', '0.015', '50.0100', '+0.0100'],
  ['5', 'Front-Right', '50.000', '50.000', '0.035', '49.9900', '-0.0100'],
];

export const EccentricityTestScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [filled, setFilled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      await submitEccentricityObservationsApi(id, {
        testLoad: 50,
        positions: positions.map((row, index) => ({ step: index + 1, indicated: Number(row[3]), deltaL: Number(row[4]) })),
      });
      navigate(`/testing/${id}/repeatability`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save eccentricity results.');
    } finally { setSubmitting(false); }
  };

  return (
    <main className="eccentricity-page"><section className="eccentricity-shell">
      <div className="eccentricity-heading">
        <div>
          <h1>Eccentricity (Corner Load) Test</h1>
          <p>Scale: Altamash Steel (IX-202) | Class: III | Test Load: 50.000 kg (1/3 Max) | e: 0.050 kg</p>
        </div>
      </div>

      <div className="eccentricity-content">
        <div className="platform-panel">
          <h2>Weight Placement Guide</h2>
          <p className="placement-help">Place the test weight at each marked position in order, then record the indication in the table.</p>
          <div className="platform-wrap">
            <div className="platform-grid" aria-label="Weighing platform sensor positions">
              {positions.map(([number, label], index) => (
                <div key={number} className={`sensor sensor-${index + 1}`}>
                  <span>{number}</span><i>✓</i><small>{label}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="platform-caption"><span className="legend-dot" /> All positions checked</div>
          <div className="placement-guide"><span>1</span> Center <span>2</span> Front-Left <span>3</span> Rear-Left <span>4</span> Rear-Right <span>5</span> Front-Right</div>
        </div>

        <div className="eccentricity-table-wrap"><table className="eccentricity-table">
          <thead><tr>{['Pos', 'Location', 'Load L (kg)', 'Indication I (kg)', 'Added ΔL (kg)', 'True P', 'Error Ec', 'MPE Limit', 'Status'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{positions.map((row) => <tr key={row[0]}>
            {row.slice(0, 2).map((value) => <td key={value}>{value}</td>)}
            {[...row.slice(2), '±0.050'].map((value, index) => <td key={`${row[0]}-${index}`}><span className={index < 2 && filled ? 'table-input filled' : 'table-input'}>{value}</span></td>)}
            <td><span className="status pass">PASS</span></td>
          </tr>)}</tbody>
        </table></div>
      </div>

      <div className="eccentricity-footer">
        <div className="conformance"><strong>✓</strong> Eccentricity Conformance: PASS <span>(All 5 Positions Within ±0.050 kg)</span></div>
        <button className="proceed-button" disabled={submitting} onClick={handleSubmit}>{submitting ? 'Saving...' : 'Save & Proceed to Repeatability Test →'}</button>
      </div>
      {error && <div className="testing-error-banner">{error}</div>}
    </section></main>
  );
};
