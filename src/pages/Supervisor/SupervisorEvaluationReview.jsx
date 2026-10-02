import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {getTestExecutionDataApi,reviewSupervisorEvaluationApi} from "../../api/instrumentApi";
import { getInstrumentImage } from "../../utils/instrumentImage";
import { formatDateTime } from "../../utils/formatDate";
import { Check } from "lucide-react";
export const SupervisorEvaluationReview = () => {
  const { applicationId } = useParams(),
    { setHeaderContent } = useOutletContext(),
    navigate = useNavigate(),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [showCorrectionForm, setShowCorrectionForm] = useState(false),
    [correctionTestCodes, setCorrectionTestCodes] = useState(() => new Set()),
    [remarks, setRemarks] = useState(""),
    [selectedTest, setSelectedTest] = useState(null),
    [reviewedTests, setReviewedTests] = useState(() => new Set()),
    [reportGenerated, setReportGenerated] = useState(false),
    [generatedReportId, setGeneratedReportId] = useState("");
  const Date = class extends globalThis.Date {
    toLocaleString() {
      return formatDateTime(this);
    }
  };
  useEffect(() => {
    setHeaderContent({ title: "Supervisor Review", subtitle: "Review test results and approve or return the evaluation." });
    getTestExecutionDataApi(applicationId)
      .then((r) => setData(r.data || r))
      .catch((e) => setError(e.message || "Unable to load review."));
  }, [applicationId, setHeaderContent]);
  const decide = async (d) => {
    if (d === "REJECT" && correctionTestCodes.size === 0) {
      setError("Select at least one test to return for correction.");
      return;
    }
    if (d === "REJECT" && !remarks.trim()) {
      setError("Add a correction reason for the testing officer.");
      return;
    }
    setBusy(true);
    try {
      const response = await reviewSupervisorEvaluationApi(applicationId, d, remarks.trim(), [...correctionTestCodes]);
      if (d === "ACCEPT") {
        setGeneratedReportId(response.data?.data?.reportId || "");
        setReportGenerated(true);
      }
      else navigate("/supervisor/evaluations", { replace: true });
    } catch (e) {
      setError(e.message || "Unable to save review.");
    } finally {
      setBusy(false);
    }
  };
  if (!data)
    return (
      <main className="p-6 text-sm text-slate-500">
        {error || "Loading review..."}
      </main>
    );
  const tests = data.testPlan?.tests || [];
  const testedTests = tests.filter((test) => test.status === "COMPLETED");
  const inspection = data.inspection || {};
  const detailsFor = (code) => {
    const value = code === "GENERAL_EXAMINATION" ? inspection.generalExamination : code === "WEIGHING_PERFORMANCE" ? inspection.weighingTest : code === "REPEATABILITY" ? inspection.repeatabilityTest : code === "ECCENTRICITY" ? inspection.eccentricityTest : code === "TARE" ? inspection.tareTest : code === "SENSITIVITY" ? inspection.sensitivityTest : null;
    if (!value) return { rows: [["Observations", "No recorded observations"]], evidence: [] };
    const evidence = value.evidence || [];
    if (code === "GENERAL_EXAMINATION") return { rows: (value.checklist || []).map((item) => [item.label, item.result]), evidence: [...evidence, ...Object.values(value.photos || {}).filter(Boolean).map((url) => ({ url }))] };
    if (code === "WEIGHING_PERFORMANCE") return { rows: (value.readings || []).map((item) => [`Step ${item.stepIndex}`, `Load ${item.load} | Indication ${item.indicated} | Error ${item.correctedErrorEc} | ${item.passed ? "PASS" : "FAIL"}`]), evidence };
    if (code === "REPEATABILITY") return { rows: (value.runs || []).map((item) => [`Run ${item.runNumber}`, `Load ${item.loadApplied} | Indication ${item.indication}`]), evidence };
    if (code === "ECCENTRICITY") return { rows: (value.positions || []).map((item) => [`Position ${item.stepIndex || item.step}`, `Load ${item.loadApplied || item.load} | Indication ${item.indicated} | ${item.passed ? "PASS" : "FAIL"}`]), evidence };
    if (code === "TARE") return { rows: (value.points || []).map((item) => [`Step ${item.step}`, `Tare ${item.tareValue} | Net load ${item.netLoad} | Indication ${item.indicated} | ${item.passed ? "PASS" : "FAIL"}`]), evidence };
    if (code === "SENSITIVITY") return { rows: (value.points || []).map((item) => [`Test ${item.step}`, `Load ${item.load} | Initial ${item.initialIndication} | Added load ${item.additionalLoad} | Final ${item.finalIndication} | ${item.passed ? "PASS" : "FAIL"}`]), evidence };
    return { rows: [["Result", value.passed ? "PASS" : "COMPLETED"]], evidence };
  };
  const openTestDetails = (test) => {
    setSelectedTest(test);
    setReviewedTests((current) => new Set(current).add(test.code));
  };
  const displayValue = (value) => {
    if (value && typeof value === "object") {
      if (value.$numberDecimal !== undefined) return value.$numberDecimal;
      return value.value ?? "—";
    }
    return value ?? "—";
  };
  const renderDetailValue = (value) => {
    const safeValue = displayValue(value);
    const result = String(safeValue).trim().toUpperCase();
    const badgeStyles = {
      PASS: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
      FAIL: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      "N/A": "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
    };
    return badgeStyles[result]
      ? <span className={`inline-flex rounded px-2 py-1 text-[10px] font-bold ${badgeStyles[result]}`}>{result}</span>
      : String(safeValue);
  };
  const renderObservationContent = () => {
    const rows = detailsFor(selectedTest.code).rows || [];
    if (!["WEIGHING_PERFORMANCE", "REPEATABILITY", "ECCENTRICITY", "TARE", "SENSITIVITY"].includes(selectedTest.code)) {
      return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">{rows.map(([label, value], index) => <div key={`${label}-${index}`} className="grid grid-cols-[minmax(220px,280px)_1fr] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0 even:bg-slate-50/70"><span className="text-xs font-semibold text-slate-500">{label}</span><span className="text-xs font-medium leading-5 text-slate-800">{renderDetailValue(value)}</span></div>)}</div>;
    }
    const readings = inspection.weighingTest?.readings || [];
    if (selectedTest.code === "WEIGHING_PERFORMANCE") return <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[620px] text-left text-[11px]"><thead className="bg-[#F1F5F9] text-slate-600"><tr>{["Step", "Load", "Indication", "Corrected error", "MPE limit", "Result"].map((heading) => <th key={heading} className="border-b border-slate-200 px-2 py-2.5 font-bold">{heading}</th>)}</tr></thead><tbody>{readings.map((reading, index) => <tr key={`weighing-${index}`} className="border-b border-slate-100 last:border-0 even:bg-slate-50/70"><td className="px-2 py-2.5 font-semibold text-slate-700">{displayValue(reading.stepIndex ?? index + 1)}</td><td className="px-2 py-2.5">{displayValue(reading.load)}</td><td className="px-2 py-2.5">{displayValue(reading.indicated)}</td><td className="px-2 py-2.5">{displayValue(reading.correctedErrorEc)}</td><td className="px-2 py-2.5">±{displayValue(reading.mpeLimit)}</td><td className="px-2 py-2.5">{renderDetailValue(reading.passed ? "PASS" : "FAIL")}</td></tr>)}</tbody></table></div>;
    const testConfig = {
      REPEATABILITY: { source: inspection.repeatabilityTest?.runs || [], headings: ["Run", "Load", "Indication", "Calculated variation", "MPE limit", "Result"], values: (item, index) => [item.runNumber ?? index + 1, item.loadApplied, item.indication, inspection.repeatabilityTest?.variation, inspection.repeatabilityTest?.mpeLimit, inspection.repeatabilityTest?.passed ? "PASS" : "FAIL"] },
      ECCENTRICITY: { source: inspection.eccentricityTest?.positions || [], headings: ["Position", "Load", "Indication", "Corrected error", "MPE limit", "Result"], values: (item, index) => [item.stepIndex ?? item.step ?? index + 1, item.loadApplied ?? item.load, item.indicated, item.correctedErrorEc, item.mpeLimit, item.passed ? "PASS" : "FAIL"] },
      TARE: { source: inspection.tareTest?.points || [], headings: ["Step", "Tare", "Net load", "Indication", "Corrected error", "MPE limit", "Result"], values: (item, index) => [item.step ?? index + 1, item.tareValue, item.netLoad, item.indicated, item.correctedError, item.mpeLimit, item.passed ? "PASS" : "FAIL"] },
      SENSITIVITY: { source: inspection.sensitivityTest?.points || [], headings: ["Step", "Load", "Initial indication", "Added load", "Final indication", "Response", "Result"], values: (item, index) => [item.step ?? index + 1, item.load, item.initialIndication, item.additionalLoad, item.finalIndication, item.responseDetected ? "One interval detected" : "Incorrect change", item.passed ? "PASS" : "FAIL"] },
    }[selectedTest.code];
    if (testConfig) return <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#F1F5F9] text-slate-600"><tr>{testConfig.headings.map((heading) => <th key={heading} className="border-b border-slate-200 px-2 py-2.5 font-bold">{heading}</th>)}</tr></thead><tbody>{testConfig.source.map((item, index) => <tr key={`${selectedTest.code}-${index}`} className="border-b border-slate-100 last:border-0 even:bg-slate-50/70">{testConfig.values(item, index).map((value, valueIndex) => <td key={valueIndex} className={`px-2 py-2.5 ${valueIndex === 0 ? "font-semibold text-slate-700" : ""}`}>{testConfig.headings[valueIndex] === "Result" ? renderDetailValue(value) : displayValue(value)}</td>)}</tr>)}</tbody></table></div>;
  };
  const allTestsReviewed = tests.length > 0 && tests.every((test) => reviewedTests.has(test.code));
  return (
    <main className="min-h-full bg-[#F8FAFC]  text-[#172033]">
      {reportGenerated && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={28} strokeWidth={3} /></div><h2 className="mt-4 text-xl font-bold text-slate-900">Report Generated Successfully</h2><p className="mt-2 text-sm text-slate-500">The approved instrument report has been saved and is ready to view.</p>{generatedReportId && <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">Report ID: <span className="font-mono text-slate-900">{generatedReportId}</span></p>}<div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => navigate("/supervisor/evaluations", { replace: true })} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Back to Evaluations</button><button type="button" onClick={() => navigate(`/supervisor/reports/${applicationId}`)} className="rounded-md bg-[#17345A] px-4 py-2 text-xs font-bold text-white">View Report</button></div></div></div>}
      <div className="mx-auto mb-3 max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/supervisor/evaluations")}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
        >
          ← Back to evaluations
        </button>
      </div>
      <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-[#dbe5f0] bg-white p-4 shadow-sm">
          <div className="grid h-20 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-50">
            <img src={getInstrumentImage(data.instrument?.instrumentType)} alt={data.instrument?.instrumentType || "Instrument"} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="!m-0 !text-3xl !tracking-tight text-slate-900">Application {data.evaluation?.applicationNumber}</h2>
            <strong className="mt-1 block text-base text-slate-900">{data.instrument?.instrumentType || "Instrument"}</strong>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
              <span>Model: {data.instrument?.modelNumber || "—"}</span>
              <span>Serial: {data.instrument?.serialNumber || "—"}</span>
              <span>Manufacturer: {data.instrument?.manufacturer || "—"}</span>
              <span>Registered On: {data.evaluation?.createdAt ? new Date(data.evaluation.createdAt).toLocaleDateString("en-GB") : "—"}</span>
            </div>
          </div>
          <span className="rounded-md bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">Awaiting Review</span>
        </div>
        {/* <h2 className="text-[1.3rem] font-bold">Supervisor Review</h2>
        <p className="mt-1 text-xs text-slate-500">
          {data.evaluation?.applicationNumber} · {data.instrument?.manufacturer}{" "}
          {data.instrument?.modelNumber}
        </p> */}
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-[#17345A] text-white">
              <tr>
                <th className="p-3">Test</th>
                <th className="p-3">Category</th>
                <th className="p-3">Recorded Values &amp; Evidence</th>
                <th className="p-3">Result</th>
                {showCorrectionForm && <th className="p-3">Return</th>}
              </tr>
            </thead>
            <tbody>
              {showCorrectionForm && testedTests.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-xs text-slate-500">No completed tests are available to return.</td></tr>}
              {(showCorrectionForm ? testedTests : tests).map((t) => (
                <tr key={t.code} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{t.code === "SENSITIVITY" ? "Discrimination Test" : t.name}</td>
                  <td className="p-3">{t.category || "—"}</td>
                  <td className="p-3"><button type="button" onClick={() => openTestDetails(t)} className="cursor-pointer rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">Review details</button></td><td className="p-3"><span className="flex w-full items-center justify-between gap-3">{t.status}{reviewedTests.has(t.code) && <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" title="Details reviewed" aria-label="Details reviewed"><Check size={15} strokeWidth={3} /></span>}</span></td>{showCorrectionForm && <td className="p-3"><label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={correctionTestCodes.has(t.code)} onChange={(event) => setCorrectionTestCodes((current) => { const next = new Set(current); if (event.target.checked) next.add(t.code); else next.delete(t.code); return next; })} aria-label={`Return ${t.name} for correction`} /><span className="text-[11px]">Select</span></label></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showCorrectionForm && <label className="mt-4 block text-xs font-semibold text-slate-700">Correction reason
          <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} maxLength={1000} placeholder="Explain what the testing officer needs to correct." className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          {!showCorrectionForm ? <button
            type="button"
            disabled={busy}
            onClick={() => { setError(""); setCorrectionTestCodes(new Set()); setRemarks(""); setShowCorrectionForm(true); }}
            className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Return for Correction
          </button> : <>
            <button type="button" disabled={busy} onClick={() => { setShowCorrectionForm(false); setCorrectionTestCodes(new Set()); setRemarks(""); setError(""); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">Cancel</button>
            <button type="button" disabled={busy || correctionTestCodes.size === 0 || !remarks.trim() || testedTests.length === 0} onClick={() => decide("REJECT")} className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Confirm Return</button>
          </>}
          <button
            type="button"
            disabled={busy || !allTestsReviewed}
            onClick={() => decide("ACCEPT")}
            title={!allTestsReviewed ? "Review details for every test before accepting" : "Accept evaluation"}
            className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Approve Evaluation
          </button>
        </div>
      </section>
      {selectedTest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" onClick={() => setSelectedTest(null)}><div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between bg-[#17345A] px-5 py-4 text-white"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200">Test details</p><h2 className="mt-1 text-xl font-bold">{selectedTest.code === "SENSITIVITY" ? "Discrimination Test" : selectedTest.name}</h2></div><button type="button" onClick={() => setSelectedTest(null)} aria-label="Close details" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20">×</button></div><div className="p-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Recorded observations</h3><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Reviewed</span></div>{renderObservationContent()}{detailsFor(selectedTest.code).evidence.length > 0 ? <div className="mt-5"><h3 className="text-sm font-bold text-slate-800">Evidence</h3><div className="mt-2 flex flex-col gap-3">{detailsFor(selectedTest.code).evidence.map((item, index) => <div key={`${item.url}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-2"><a href={item.url} target="_blank" rel="noreferrer" className="block h-28 w-36 shrink-0 overflow-hidden rounded border border-slate-100"><img src={item.url} alt="Test evidence" className="h-full w-full object-cover" /></a><div className="min-w-0 space-y-1 pt-1 text-xs text-slate-600"><p className="m-0"><strong className="text-slate-800">Date &amp; time:</strong> {item.uploadedAt ? formatDateTime(item.uploadedAt) : "Unavailable"}</p><p className="m-0 break-words"><strong className="text-slate-800">Address:</strong> {item.location?.address || (item.location?.latitude != null && item.location?.longitude != null ? `${item.location.latitude}, ${item.location.longitude}` : "Location unavailable")}</p></div></div>)}</div></div> : <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">No evidence uploaded for this test.</div>}<div className="mt-6 flex justify-end"><button type="button" onClick={() => setSelectedTest(null)} className="cursor-pointer rounded-md bg-[#17345A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#102844]">Close details</button></div></div></div></div>}
    </main>
  );
};
