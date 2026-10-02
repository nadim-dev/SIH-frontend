import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Save, X } from "lucide-react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { createNonComplianceReportApi, deleteWeighingEvidenceApi, getSensitivityTestConfigApi, submitSensitivityTestApi, uploadWeighingEvidenceApi } from "../../api/instrumentApi";
import { OfflineTestDraftControl, useOfflineTestDraft } from "../../components/OfflineTestDraftSync";
import NonComplianceReportModal from "../../components/NonComplianceReportModal";
import EvidenceUpload from "../../components/EvidenceUpload";

const asNumber = (value) => Number(value && typeof value === "object" ? value.$numberDecimal ?? value : value);

export const SensitivityTest = () => {
  const { setHeaderContent } = useOutletContext();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const applicationNumber = searchParams.get("applicationNumber");
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNcrForm, setShowNcrForm] = useState(false);
  const draftSync = useOfflineTestDraft(`sensitivity-${id}`, []);
  const rows = draftSync.draft;
  const setRows = draftSync.setDraft;

  useEffect(() => {
    setHeaderContent?.({ title: "Discrimination Test", subtitle: "Check the instrument’s ability to respond to a small change in load." });
  }, [setHeaderContent]);

  useEffect(() => {
    let active = true;
    getSensitivityTestConfigApi(id)
      .then((response) => {
        const loaded = response?.data?.data || response?.data;
        if (!active) return;
        setConfig(loaded);
        setRows((current) => current.length === 3 ? current : (loaded.points || []).map((point) => ({ step: point.step, initialIndication: "", finalIndication: "" })));
      })
      .catch((requestError) => setError(requestError.data?.message || requestError.message || "Unable to load the discrimination test."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const results = useMemo(() => (config?.points || []).map((point, index) => {
    const row = rows[index] || {};
    const initial = Number(row.initialIndication);
    const final = Number(row.finalIndication);
    const hasReadings = row.initialIndication !== "" && row.finalIndication !== "" && Number.isFinite(initial) && Number.isFinite(final);
    const interval = asNumber(config.scaleInterval);
    const change = final - initial;
    // OIML R 76-1 A.4.8.2 requires the indication after adding 1.4 d to be
    // one actual scale interval above I. Allow half an interval around d to
    // account for rounding/resolution in the manually entered observations.
    const responseValid = hasReadings && interval > 0 && Math.abs(change - interval) <= interval / 2 + 1e-9;
    return { ...point, ...row, hasReadings, detected: Boolean(responseValid), passed: Boolean(responseValid) };
  }), [config, rows]);

  const updateReading = (index, field, value) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };
  const canSubmit = results.length === 3 && results.every((result) => result.hasReadings);
  const allPassed = results.length === 3 && results.every((result) => result.passed);
  const failedItems = results.filter((result) => result.hasReadings && !result.passed).map((result) => ({
    key: `sensitivity-${result.step}`,
    label: `Test ${result.step} response was not one scale interval (initial ${result.initialIndication}, final ${result.finalIndication}, required change ${config.scaleInterval} ${config.instrument.unit}).`,
  }));

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      await submitSensitivityTestApi(id, { readings: rows.map(({ step, initialIndication, finalIndication }) => ({ step, initialIndication, finalIndication })) });
      await draftSync.clearDraft();
      navigate(applicationNumber ? `/testing/${applicationNumber}/test-execution` : `/testing/${id}/test-execution`);
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || "Unable to submit the discrimination test.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="p-6 text-center text-sm text-slate-500">Loading discrimination test…</main>;
  if (error && !config) return <main role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</main>;

  return (
    <main className="min-h-full bg-[#f3f6fb] p-3 font-sans sm:p-5">
      <section className="mx-auto max-w-[1180px] space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-xl font-bold text-slate-900">Discrimination Test</h1>
            <p className="mb-0 mt-1 text-xs leading-5 text-slate-600">
              {config.instrument.instrumentType} · {config.instrument.manufacturer} {config.instrument.modelNumber} · Min {config.instrument.min} {config.instrument.unit} · Max {config.instrument.max} {config.instrument.unit} · d {config.scaleInterval} {config.instrument.unit}
            </p>
          </div>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">OIML R 76-1:2006 · 3.8.2.2 / A.4.8.2</span>
        </header>

        <OfflineTestDraftControl enabled={draftSync.enabled} online={draftSync.online} status={draftSync.status} onEnable={draftSync.enableSync} onSync={draftSync.syncNow} />

        {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-900 text-white"><tr>{["Test", `Load (${config.instrument.unit})`, "Initial", `Added Load (${config.instrument.unit})`, "Final", "Response", "Result"].map((label) => <th key={label} className="px-3 py-2.5 font-semibold">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((result, index) => (
                <tr key={result.step} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-semibold text-slate-700">{result.step}</td>
                  <td className="px-3 py-2.5 font-medium">{result.load}</td>
                  <td className="px-3 py-2"><input aria-label={`Test ${result.step} initial indication`} type="number" step="any" value={rows[index]?.initialIndication ?? ""} onChange={(event) => updateReading(index, "initialIndication", event.target.value)} className="!m-0 !h-9 !w-28 !rounded-md !border-slate-300 !px-2 !text-sm" /></td>
                  <td className="px-3 py-2.5">{result.additionalLoad}</td>
                  <td className="px-3 py-2"><input aria-label={`Test ${result.step} final indication`} type="number" step="any" placeholder={["1.051", "75.07", "150.07"][index]} value={rows[index]?.finalIndication ?? ""} onChange={(event) => updateReading(index, "finalIndication", event.target.value)} className="!m-0 !h-9 !w-28 !rounded-md !border-slate-300 !px-2 !text-sm" /></td>
                  <td className="px-3 py-2.5">{result.hasReadings ? result.detected ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check size={15} />One interval detected</span> : <span className="inline-flex items-center gap-1 text-rose-700"><X size={15} />Incorrect change</span> : <span className="text-slate-400">Pending</span>}</td>
                  <td className="px-3 py-2.5"><span className={`rounded px-2 py-1 text-xs font-bold ${!result.hasReadings ? "bg-slate-100 text-slate-500" : result.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{!result.hasReadings ? "PENDING" : result.passed ? "PASS" : "FAIL"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <EvidenceUpload
          uploadImage={async (file, metadata) => {
            const response = await uploadWeighingEvidenceApi(id, file, { ...metadata, testType: "sensitivityTest" });
            return response.evidence?.at(-1);
          }}
          deleteImage={(item) => deleteWeighingEvidenceApi(id, { testType: "sensitivityTest", url: item.url })}
        />

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <p className="m-0 text-xs text-slate-600">Overall result: <strong className={allPassed ? "text-emerald-700" : failedItems.length ? "text-rose-700" : "text-slate-500"}>{allPassed ? "PASS" : failedItems.length ? "FAIL" : "PENDING"}</strong></p>
          <div className="flex flex-wrap justify-end gap-2">
            {failedItems.length > 0 && <button type="button" onClick={() => setShowNcrForm(true)} className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100">Generate NCR Report</button>}
            <button type="button" onClick={submit} disabled={!allPassed || submitting} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">{submitting && <LoaderCircle size={14} className="animate-spin" />}{submitting ? "Submitting…" : <><Save size={14} />Submit Discrimination Test</>}</button>
          </div>
        </footer>
      </section>
      <NonComplianceReportModal
        open={showNcrForm}
        instrumentId={id}
        testType="SENSITIVITY"
        failedItems={failedItems}
        onClose={() => setShowNcrForm(false)}
        onSubmit={(payload) => createNonComplianceReportApi({ ...payload, testType: "SENSITIVITY" })}
        onSubmitted={() => navigate("/testing-person/dashboard")}
      />
    </main>
  );
};
