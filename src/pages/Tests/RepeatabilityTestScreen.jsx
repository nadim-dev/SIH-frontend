import React from "react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { getRepeatabilityTestConfigApi, submitRepeatabilityObservationsApi, createNonComplianceReportApi, uploadWeighingEvidenceApi, deleteWeighingEvidenceApi} from "../../api/instrumentApi";
import NonComplianceReportModal from "../../components/NonComplianceReportModal";
import EvidenceUpload from "../../components/EvidenceUpload";
import { OfflineTestDraftControl, useOfflineTestDraft } from "../../components/OfflineTestDraftSync";

export const RepeatabilityTestScreen = () => {
  const { setHeaderContent } = useOutletContext();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const applicationNumber = searchParams.get("applicationNumber");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showNcrForm, setShowNcrForm] = React.useState(false);

  React.useEffect(() => {
    setHeaderContent?.({
      title: "Repeatability Test",
      subtitle: "Verify repeatability at approximately 80% of maximum capacity.",
    });
  }, [setHeaderContent]);
  const [config, setConfig] = React.useState(null);
  const draftSync = useOfflineTestDraft(`repeatability-${id}`, [
    { indicated: "" },
    { indicated: "" },
    { indicated: "" },
  ]);
  const runs = draftSync.draft;
  const setRuns = draftSync.setDraft;

  React.useEffect(() => {
    getRepeatabilityTestConfigApi(id)
      .then((response) => setConfig(response.data?.data || response.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load repeatability test."));
  }, [id]);

  const updateRun = (index, field, value) => {
    setRuns((current) => current.map((run, runIndex) => runIndex === index ? { ...run, [field]: value } : run));
  };

  React.useEffect(() => {
    if (config?.numberOfRuns && config.numberOfRuns !== runs.length) {
      setRuns((current) => Array.from({ length: config.numberOfRuns }, (_, index) => current[index] || ({ indicated: "" })));
    }
  }, [config?.numberOfRuns]);

  const calculatedRuns = runs.map((run, index) => {
    const indicated = Number(run.indicated);
    const valid = run.indicated !== "" && Number.isFinite(indicated);
    return { ...run, index, indication: valid ? indicated : null, valid };
  });
  const validRuns = calculatedRuns.filter((run) => run.valid);
  const pValues = validRuns.map((run) => run.indication);
  const variationRange = pValues.length === runs.length ? Math.max(...pValues) - Math.min(...pValues) : null;
  const passed = variationRange !== null && config?.mpe != null && variationRange <= Number(config.mpe);
  const canSubmit = validRuns.length === runs.length;
  const canGenerateNcr = canSubmit && !passed;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitRepeatabilityObservationsApi(id, {
        testLoad: config.testLoad,
        runs: runs.map((run) => ({ indication: Number(run.indicated) })),
      });
      await draftSync.clearDraft();
      navigate(applicationNumber ? `/testing/${applicationNumber}/test-execution` : `/testing/${id}/test-execution`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to submit inspection.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  if (!config) return <main className="repeatability-page"><section className="repeatability-shell">{error || "Loading repeatability test..."}</section></main>;

  return (
    <main className="repeatability-page">
      <section className="repeatability-shell">
        <div className="repeatability-heading">
          <div>
            <h1>Repeatability Test </h1>
            <p>Scale: {config.instrument.instrumentType} | {config.instrument.manufacturer} ({config.instrument.modelNumber}) | Class: {config.instrument.accuracyClass} | Test Load: {config.testLoad} {config.instrument.unit} (80% Max) | e: {config.instrument.e} {config.instrument.unit}</p>
            <OfflineTestDraftControl enabled={draftSync.enabled} online={draftSync.online} status={draftSync.status} onEnable={draftSync.enableSync} onSync={draftSync.syncNow} />
          </div>
         
        </div>
        
        <div className="repeatability-table-wrap">
          <table className="repeatability-table">
            <thead className="repeatability-table-head">
              <tr>
                {[ 
                  "Run #",
                  "Load Applied (kg)",
                  "Indication I (kg)",
                  "Added ΔL (kg)",
                  "Status",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calculatedRuns.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "repeatability-row-even" : "repeatability-row-odd"}>
                  <td>{index + 1}</td>
                  <td>{config.testLoad}</td>
                  <td><input className="grid-input" type="number" step="any" value={row.indicated} onChange={(event) => updateRun(index, "indicated", event.target.value)} /></td>
                  <td>{row.indication === null ? "—" : row.indication.toFixed(4)}</td>
                  <td>
                    <span className={`status ${row.valid ? "pass" : "pending"}`}>{row.valid ? "RECORDED" : "PENDING"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <h2 className="text-sm font-bold text-slate-900">Repeatability Summary</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-white p-3"><span className="block text-xs font-semibold text-slate-500">Variation</span><strong className="mt-1 block text-lg text-slate-900">{variationRange === null ? "—" : variationRange.toFixed(4)} {config.instrument.unit}</strong></div>
            <div className="rounded-md border border-slate-200 bg-white p-3"><span className="block text-xs font-semibold text-slate-500">Applicable MPE</span><strong className="mt-1 block text-lg text-slate-900">±{config.mpe} {config.instrument.unit}</strong></div>
            <div className="rounded-md border border-slate-200 bg-white p-3"><span className="block text-xs font-semibold text-slate-500">Overall Result</span><strong className={`mt-1 block text-lg ${passed ? "text-green-700" : canSubmit ? "text-red-600" : "text-slate-400"}`}>{passed ? "PASS" : canSubmit ? "FAIL" : "PENDING"}</strong></div>
          </div>
        </div>
        <EvidenceUpload uploadImage={async (file, metadata) => { const response = await uploadWeighingEvidenceApi(id, file, { ...metadata, testType: "repeatabilityTest" }); return response.evidence?.at(-1); }} deleteImage={(item) => deleteWeighingEvidenceApi(id, { testType: "repeatabilityTest", url: item.url })} />
        <div className="repeatability-footer">
          <div>
            <strong>Variation: </strong>{variationRange === null ? "—" : variationRange.toFixed(4)} {config.instrument.unit}
            <strong className="ml-4">MPE: </strong>±{config.mpeLimit} {config.instrument.unit}
            <strong className={`ml-4 ${passed ? "text-green-700" : "text-slate-500"}`}>{passed ? "PASS" : canSubmit ? "FAIL" : "PENDING"}</strong>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            disabled={!canGenerateNcr}
            onClick={() => setShowNcrForm(true)}
          >
            Generate Non-Compliance
          </button>
          <button
            className="proceed-button"
            disabled={submitting || !canSubmit || !passed}
            onClick={handleSubmit}
          >
            {submitting
              ? "Submitting..."
              : "Submit Repeatability Test →"}
          </button>
        </div>
        {error && <div className="testing-error-banner">{error}</div>}
        <NonComplianceReportModal
          open={showNcrForm}
          instrumentId={id}
          failedItems={[{ key: "repeatability", label: `Repeatability variation exceeded the MPE limit (variation ${variationRange?.toFixed(4)}, MPE ±${config.mpe})` }]}
          onClose={() => setShowNcrForm(false)}
          onSubmit={async (payload) => {
            await submitRepeatabilityObservationsApi(id, { testLoad: config.testLoad, runs: runs.map((run) => ({ indication: Number(run.indicated) })) });
            await draftSync.clearDraft();
            return createNonComplianceReportApi({ ...payload, testType: "REPEATABILITY" });
          }}
          onSubmitted={() => navigate("/testing-person/dashboard")}
        />
      </section>
    </main>
  );
};
