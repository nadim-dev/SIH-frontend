import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createNonComplianceReportApi, getEccentricityTestConfigApi, submitEccentricityObservationsApi } from "../../api/instrumentApi";
import NonComplianceReportModal from "../../components/NonComplianceReportModal";
import EvidenceUpload from "../../components/EvidenceUpload";
import { uploadWeighingEvidenceApi } from "../../api/instrumentApi";


export const EccentricityTestScreen = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const applicationNumber = searchParams.get("applicationNumber");
  const navigate = useNavigate();
  const [filled, setFilled] = useState(true);
  const [positions, setPositions] = useState([]);
  const [testConfig, setTestConfig] = useState(null);
  const [indications, setIndications] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNcrForm, setShowNcrForm] = useState(false);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await getEccentricityTestConfigApi(id);
        const config = response.data?.data || response.data;
        setTestConfig(config);
        const decimalText = (value) => value && typeof value === "object" ? value.$numberDecimal ?? String(value) : value ?? "";
        setPositions((config.points || []).map((point) => [String(point.step), point.label, decimalText(point.loadApplied), decimalText(point.indication), "", "", ""]));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load eccentricity test points.");
      }
    };
    loadConfig();
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitEccentricityObservationsApi(id, {
        testLoad: testConfig.testLoad,
        positions: positions.map((row, index) => ({
          step: index + 1,
          indicated: Number(row[3]),
          deltaL: Number(row[4]),
        })),
      });
      navigate(applicationNumber ? `/testing/${applicationNumber}/test-execution` : `/testing/${id}/test-execution`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to save eccentricity results.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateIndication = (step, value) => {
    setIndications((current) => ({ ...current, [step]: value }));
    setPositions((current) => current.map((row) => {
      if (row[0] !== String(step)) return row;
      const nextRow = [...row];
      nextRow[3] = value;
      return nextRow;
    }));
  };

  const positionPassed = (row, index) => {
    if (row?.[3] === "" || row?.[3] == null) return false;
    const indication = Number(row[3]);
    const e = Number(testConfig?.instrument?.e);
    const testLoad = Number(testConfig?.testLoad);
    const mpe = Number(testConfig?.mpe);
    if (!Number.isFinite(indication) || !Number.isFinite(e) || !Number.isFinite(testLoad) || !Number.isFinite(mpe)) return false;
    const corrected = indication + e / 2 - Number(row[4] || 0);
    return Math.abs(corrected - testLoad) <= mpe;
  };

  const positionHasReading = (row) => row?.[3] !== "" && row?.[3] != null;

  const positionStatus = (row, index) => {
    if (!positionHasReading(row)) return "PENDING";
    return positionPassed(row, index) ? "PASS" : "FAIL";
  };

  const positionError = (row) => {
    if (row?.[3] === "" || row?.[3] == null) return "";
    const e = Number(testConfig?.instrument?.e);
    const testLoad = Number(testConfig?.testLoad);
    const corrected = Number(row[3]) + e / 2 - Number(row[4] || 0);
    if (!Number.isFinite(corrected) || !Number.isFinite(testLoad)) return "";
    return (corrected - testLoad).toFixed(4);
  };

  const passedCount = positions.filter((row, index) => positionPassed(row, index)).length;
  const allPositionsPassed = positions.length === 5 && passedCount === 5;
  const failedPositions = positions
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) => positionHasReading(row) && !positionPassed(row, index));

  return (
    <main className="eccentricity-page">
      <section className="eccentricity-shell">
        <div className="eccentricity-heading">
          <div>
            <h1>Eccentricity (Corner Load) Test</h1>
            <p>
              Scale: {testConfig?.instrument?.instrumentType} | {testConfig?.instrument?.manufacturer} ({testConfig?.instrument?.modelNumber}) | Class: {testConfig?.instrument?.accuracyClass} | Test Load: {testConfig?.testLoad} {testConfig?.instrument?.unit} (1/3 Max) | e: {testConfig?.instrument?.e} {testConfig?.instrument?.unit}
            </p>
          </div>
        </div>

        <div className="eccentricity-content">
          <div className="platform-panel">
            <h2>Weight Placement Guide</h2>
            <p className="placement-help">
              Place the test weight at each marked position in order, then
              record the indication in the table.
            </p>
            <div className="platform-wrap">
              <div
                className="platform-grid"
                aria-label="Weighing platform sensor positions"
              >
                {positions.map(([number, label], index) => (
                  <div key={number} className={`sensor sensor-${index + 1}`}>
                    <span>{number}</span>
                    {positionPassed(positions[index], index) && <i>✓</i>}
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className="platform-caption">
              <span className="legend-dot" /> All positions checked
            </div>
          </div>

          <div className="eccentricity-table-wrap">
            <table className="eccentricity-table">
              <thead>
                <tr>
                  {[
                    "Test Position",
                    "Location",
                    "Load L (kg)",
                    "Indication I (kg)",
                    "Added ΔL (kg)",
                    "Error Ec",
                    "MPE Limit",
                    "Status",
                ].filter((heading) => !heading.toLowerCase().includes("added")).map((heading) => (
                    <th key={heading}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((row, index) => (
                  <tr key={row[0]}>
                    {row.slice(0, 2).map((value) => (
                      <td key={value}>{value}</td>
                    ))}
                    {[row[2], row[3], positionError(row), `±${Number(testConfig?.mpe || 0).toFixed(4)}`].map((value, index) => (
                      <td key={`${row[0]}-${index}`}>
                        <span
                          className={
                            index < 2 && filled
                              ? "table-input filled"
                              : "table-input"
                          }
                        >
                          {index === 1 ? <input className="grid-input" type="number" step="any" value={indications[row[0]] || ""} onChange={(event) => updateIndication(row[0], event.target.value)} /> : value}
                        </span>
                      </td>
                    ))}
                    <td>
                      <span className={`status ${positionStatus(row, index).toLowerCase()}`}>
                        {positionStatus(row, index)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <EvidenceUpload uploadImage={async (file, metadata) => { const response = await uploadWeighingEvidenceApi(id, file, { ...metadata, testType: "eccentricityTest" }); return response.evidence?.at(-1); }} />

        <div className="eccentricity-footer">
          <div className="conformance">
            {allPositionsPassed && <strong>✓</strong>} Eccentricity Conformance: {allPositionsPassed ? "PASS" : failedPositions.length ? "FAIL" : "PENDING"}{" "}
            <span>({passedCount}/5 Positions Within ±{Number(testConfig?.mpe || 0).toFixed(4)} kg)</span>
          </div>
          <button
            type="button"
            className="proceed-button"
            style={failedPositions.length ? { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" } : { background: "#9ca3af", cursor: "not-allowed", opacity: 0.7 }}
            disabled={failedPositions.length === 0}
            onClick={() => setShowNcrForm(true)}
          >
            Generate NCR Report
          </button>
          <button
            className="proceed-button"
            style={!allPositionsPassed || submitting ? { background: "#9ca3af", cursor: "not-allowed", opacity: 0.7 } : undefined}
            disabled={submitting || !allPositionsPassed}
            onClick={handleSubmit}
          >
            {submitting
              ? "Saving..."
              : "Submit Eccentricity Test →"}
          </button>
        </div>
        {error && <div className="testing-error-banner">{error}</div>}
        <NonComplianceReportModal
          open={showNcrForm}
          instrumentId={id}
          failedItems={failedPositions.map(({ row, index }) => ({
            key: `eccentricity-${row[0]}`,
            label: `${row[1]} eccentricity reading failed (indication ${row[3]} kg, Ec ${positionError(row)} kg, MPE ±${Number(testConfig?.mpe || 0).toFixed(4)} kg)`,
          }))}
          onClose={() => setShowNcrForm(false)}
          onSubmit={createNonComplianceReportApi}
          onSubmitted={() => setShowNcrForm(false)}
        />
      </section>
    </main>
  );
};
