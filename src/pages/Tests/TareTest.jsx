import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getTareTestConfigApi, submitTareTestApi } from "../../api/instrumentApi";

export const TareTest = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationNumber = searchParams.get("applicationNumber");
  const [config, setConfig] = React.useState(null);
  const [error, setError] = React.useState("");
  const [indications, setIndications] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const decimalText = (value) =>
    value && typeof value === "object"
      ? (value.$numberDecimal ?? String(value))
      : (value ?? "");
  const decimalNumber = (value) => Number(decimalText(value));
  const hasReading = (point) => indications[point.step] !== undefined && indications[point.step] !== "";
  const pointError = (point) => {
    const indication = Number(indications[point.step]);
    const netLoad = decimalNumber(point.netLoad);
    if (!Number.isFinite(indication) || indications[point.step] === "")
      return null;
    return indication - netLoad;
  };
  const pointPassed = (point) => {
    const errorValue = pointError(point);
    const mpe = decimalNumber(point.mpeLimit);
    return (
      errorValue !== null && Number.isFinite(mpe) && Math.abs(errorValue) <= mpe
    );
  };
  const enteredPoints =
    config?.points?.filter(hasReading) || [];
  const passedPoints = config?.points?.filter(pointPassed) || [];
  const allPointsPassed = Boolean(
    config?.points?.length && passedPoints.length === config.points.length,
  );
  const submit = async () => { setSubmitting(true); try { await submitTareTestApi(id, { readings: config.points.map((point) => ({ indication: Number(indications[point.step]) })) }); const targetApplication = applicationNumber || config.applicationNumber; navigate(targetApplication ? `/testing/${targetApplication}/test-execution` : `/testing/${id}/test-execution`); } catch (err) { setError(err.response?.data?.message || "Failed to submit tare test."); } finally { setSubmitting(false); } };

  React.useEffect(() => {
    getTareTestConfigApi(id)
      .then((response) => setConfig(response.data?.data || response.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load tare test."),
      );
  }, [id]);

  if (error) return <main className="testing-state">{error}</main>;
  if (!config)
    return <main className="testing-state">Loading tare test...</main>;

  return (
    <main className="testing-page">
      <section className="testing-shell">
        <h1 className="testing-title">TARE TEST</h1>
        <p className="testing-meta">
          Tare Device: {config.instrument?.tareDevice} | Type: {config.tareType}{" "}
          | Maximum Tare: {decimalText(config.maximumTare)}{" "}
          {config.instrument?.unit}
        </p>
        <div className="testing-table-wrap">
          <table className="testing-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Tare Value</th>
                <th>Net Load</th>
                <th>Indication</th>
                <th>MPE Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {config.points.map((point) => (
                <tr key={point.step}>
                  <td>{point.step}</td>
                  <td>{decimalText(point.tareValue)}</td>
                  <td>{decimalText(point.netLoad)}</td>
                  <td>
                    <input
                      className="grid-input"
                      type="number"
                      step="any"
                      value={indications[point.step] || ""}
                      onChange={(event) =>
                        setIndications((current) => ({
                          ...current,
                          [point.step]: event.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>±{decimalText(point.mpeLimit)}</td>
                  <td>
                    <span
                      className={`status ${!hasReading(point) ? "pending" : pointPassed(point) ? "pass" : "fail"}`}
                    >
                      {!hasReading(point)
                        ? "PENDING"
                        : pointPassed(point)
                          ? "PASS"
                          : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="testing-footer">
          <div>
            <strong>Tare Conformance: </strong>
            <span
              className={`status ${allPointsPassed ? "pass" : enteredPoints.some((point) => !pointPassed(point)) ? "fail" : "pending"}`}
            >
              {allPointsPassed
                ? "PASS"
                : enteredPoints.some((point) => !pointPassed(point))
                  ? "FAIL"
                  : "PENDING"}
            </span>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            disabled={!enteredPoints.some((point) => !pointPassed(point))}
          >
            Generate NCR Report
          </button>
          <button
            type="button"
            className="proceed-button"
            style={{ padding: "8px 12px", fontSize: "12px", ...(allPointsPassed ? {} : { background: "#9ca3af", cursor: "not-allowed", opacity: 0.7 }) }}
            disabled={!allPointsPassed || submitting}
            onClick={submit}
          >
            Submit Tare Test →
          </button>
        </div>
      </section>
    </main>
  );
};
