import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {approveInspectionApi,getApprovedInspectionReportsApi,getPendingApprovalInspectionsApi} from "../../api/instrumentApi";
import { getAdminDashboardSummaryApi } from "../../api/authApi";
import { ArrowRight, BarChart3, Building2, Camera, CheckCircle2, ClipboardList, Clock3, Image as ImageIcon, Leaf, PenLine, QrCode, Users, Weight } from "lucide-react";

const value = (item) => {
  if (item === undefined || item === null) return "—";
  if (typeof item === "object") {
    // Decimal128 values may be serialized by MongoDB as {$numberDecimal: "..."}.
    if (item.$numberDecimal !== undefined) return String(item.$numberDecimal);
    if (item.value !== undefined && typeof item.value !== "object")
      return String(item.value);
  }
  return String(item);
};

const TestRows = ({ title, test }) => {
  const rows = test?.readings || test?.positions || test?.runs || [];
  return (
    <section className="admin-test-section">
      <div className="admin-test-heading">
        <h3>{title}</h3>
        <span className={`admin-result ${test?.passed ? "passed" : "failed"}`}>
          {test?.passed ? "PASS" : "NOT PASSED"}
        </span>
      </div>
      {rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Test case</th>
                <th>Load</th>
                <th>Indicated</th>
                <th>Corrected error</th>
                <th>MPE limit</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${row.stepIndex ?? index}`}>
                  <td>{value(row.stepIndex ?? index + 1)}</td>
                  <td>{value(row.label)}</td>
                  <td>{value(row.load)}</td>
                  <td>{value(row.indicated)}</td>
                  <td>{value(row.correctedErrorEc)}</td>
                  <td>{value(row.mpeLimit)}</td>
                  <td>
                    <span className="admin-row-pass">
                      {row.passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty-test">
          No test-case readings were submitted.
        </p>
      )}
    </section>
  );
};

export const AdminDashbaord = () => {
  const { setHeaderContent } = useOutletContext();
  const [metrics, setMetrics] = useState({ activeLabs: 0, totalTests: 0, nationalPassRate: 0, pendingReviews: 0, activeUsers: 0, labComparison: [], nationalAverageTurnaroundDays: 0 });
  const [comparisonMetric, setComparisonMetric] = useState("passRate");
  const [inspections, setInspections] = useState([]);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  const loadInspections = async () => {
    setLoading(true);
    setError("");
    try {
      const [response, reportResponse] = await Promise.all([
        getPendingApprovalInspectionsApi(),
        getApprovedInspectionReportsApi(),
      ]);
      setInspections(response.data || []);
      setReports(reportResponse.data || []);
    } catch (err) {
      setError(
        err.data?.message || err.message || "Failed to load approval requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHeaderContent({
      title: "Admin Dashboard",
      subtitle: "National overview of laboratories, testing performance, pending reviews, and data quality.",
    });
    loadInspections();
    getAdminDashboardSummaryApi()
      .then((response) => setMetrics(response.data || { activeLabs: 0, totalTests: 0, nationalPassRate: 0, pendingReviews: 0, activeUsers: 0 }))
      .catch((err) => setError(err.data?.message || err.message || "Failed to load dashboard metrics."));
  }, [setHeaderContent]);

  const metricCards = [
    { label: "Total Labs Active", value: metrics.activeLabs, Icon: Building2, tone: "border-blue-100 bg-blue-50 text-blue-700" },
    { label: "Total Tests (National)", value: metrics.totalTests.toLocaleString(), Icon: ClipboardList, tone: "border-violet-100 bg-violet-50 text-violet-700" },
    { label: "National Pass Rate", value: `${metrics.nationalPassRate}%`, Icon: CheckCircle2, tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
    { label: "Total Pending Reviews", value: metrics.pendingReviews, Icon: Clock3, tone: "border-amber-100 bg-amber-50 text-amber-700" },
    { label: "Active Users", value: metrics.activeUsers, Icon: Users, tone: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  ];
  const labRows = metrics.labComparison || [];
  const rankedLabs = [...labRows].sort((a, b) => (b[comparisonMetric] || 0) - (a[comparisonMetric] || 0));
  const turnaroundLabs = [...labRows].sort((a, b) => (a.averageTurnaroundDays || 0) - (b.averageTurnaroundDays || 0));
  const lowestPassLab = [...labRows].sort((a, b) => a.passRate - b.passRate)[0];
  const highestPendingLab = [...labRows].sort((a, b) => b.pendingReviews - a.pendingReviews)[0];
  const slowestLab = [...labRows].sort((a, b) => b.averageTurnaroundDays - a.averageTurnaroundDays)[0];

  const approve = async () => {
    const instrument = selected?.instrumentId;
    if (
      !instrument ||
      selected.allTestsPassed !== true ||
      selected.inspectionStatus !== "PENDING_APPROVAL"
    )
      return;
    setApproving(true);
    setError("");
    try {
      const response = await approveInspectionApi(instrument._id);
      openCertificateReport(
        selected,
        response.certificate,
        response.digitalSignatureToken,
      );
      setSelected(null);
      await loadInspections();
    } catch (err) {
      setError(
        err.data?.message || err.message || "Failed to approve instrument.",
      );
    } finally {
      setApproving(false);
    }
  };

  const openCertificateReport = (inspection, certificate, signature) => {
    const instrument = inspection.instrumentId || {};
    const tests = ["weighingTest", "eccentricityTest", "repeatabilityTest"];
    const rows = tests
      .map(
        (key) =>
          `<tr><td>${key.replace("Test", " test")}</td><td>${inspection[key]?.passed ? "PASS" : "FAIL"}</td></tr>`,
      )
      .join("");
    const verificationUrl = (
      certificate.qrVerificationUrl ||
      `${window.location.origin}/certificate/${certificate.certificateNumber}`
    ).replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
      "https://nawipro12.netlify.app",
    );
    const qrUrl = `https://quickchart.io/qr?size=180&text=${encodeURIComponent(verificationUrl)}`;
    const report = `<!doctype html><html><head><title>${certificate.certificateNumber}</title><style>body{font-family:Arial;color:#172033;max-width:800px;margin:40px auto;padding:25px;border:8px double #17345a}h1{text-align:center;color:#17345a}h2{font-size:18px;border-bottom:1px solid #ddd;padding-bottom:8px}p{line-height:1.6}.label{color:#64748b;font-size:12px}.qr{text-align:center;margin-top:20px}.qr img{width:150px;height:150px}.qr small{display:block;color:#64748b}</style></head><body><h1>LEGAL METROLOGY</h1><h2>Certificate of Instrument Approval</h2><p><span class="label">Certificate number</span><br><strong>${certificate.certificateNumber}</strong></p><p><span class="label">Instrument</span><br><strong>${instrument.manufacturer || "—"} ${instrument.modelNumber || ""}</strong><br>Serial number: ${instrument.serialNumber || "—"}</p><table width="100%" cellpadding="10" border="1" cellspacing="0"><tr><th>Inspection module</th><th>Result</th></tr>${rows}</table><p>Issued: ${new Date(certificate.issueDate).toLocaleDateString()}<br>Valid until: ${new Date(certificate.validUntil).toLocaleDateString()}<br>Approved by: Administrator</p><div class="qr"><img src="${qrUrl}" alt="Certificate verification QR code"><small>Scan to verify this certificate</small></div><script>window.onload=()=>window.print()</script></body></html>`;
    const reportWindow = window.open("", "_blank");
    if (reportWindow) {
      reportWindow.document.write(report);
      reportWindow.document.close();
    }
  };

  return (
    <main className="admin-page">
      <section className="mb-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900"><span aria-hidden="true" className="inline-flex h-5 items-end gap-[2px] text-blue-600"><i className="h-2 w-[3px] rounded-t-[2px] bg-current" /><i className="h-3.5 w-[3px] rounded-t-[2px] bg-current" /><i className="h-5 w-[3px] rounded-t-[2px] bg-current" /></span>National Key Metrics</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metricCards.map(({ label, value, Icon, tone }) => (
            <article key={label} className={`flex min-h-24 items-center gap-3 rounded-lg border px-2.5 py-3 shadow-sm ${tone}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80"><Icon size={19} /></span>
              <div className="min-w-0"><p className="m-0 text-[11px] font-medium text-slate-600">{label}</p><strong className="mt-1 block text-xl leading-none text-slate-900">{value}</strong></div>
            </article>
          ))}
        </div>
      </section>
      <section className="mb-5 grid gap-3 xl:grid-cols-2">
        <article className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><BarChart3 size={20} className="text-blue-600" />Lab-wise Comparison</h2>
            <select value={comparisonMetric} onChange={(event) => setComparisonMetric(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <option value="passRate">Pass Rate</option><option value="tests">Tests</option><option value="pendingReviews">Pending Reviews</option>
            </select>
          </div>
          <div className="overflow-x-auto rounded-md border border-slate-100">
            <table className="w-full table-fixed text-left text-[11px]">
              <thead className="bg-[#f1f7ff] text-[#111b55]"><tr><th className="w-7 px-1.5 py-2">#</th><th className="w-[38%] px-1.5 py-2">Laboratory</th><th className="w-[10%] px-1.5 py-2">Tests</th><th className="w-[15%] px-1.5 py-2">Pass %</th><th className="w-[17%] px-1.5 py-2">Avg Time (Hours)</th><th className="px-1.5 py-2">Pending Rev.</th></tr></thead>
              <tbody>{rankedLabs.length ? rankedLabs.map((lab, index) => <tr key={lab.laboratory} className="border-t border-slate-100"><td className="px-1.5 py-2 text-slate-500">{index + 1}</td><td className="whitespace-normal break-words px-1.5 py-2 font-medium leading-4 text-blue-800">{lab.laboratory}</td><td className="px-1.5 py-2">{lab.tests}</td><td className="px-1.5 py-2"><span className={`inline-block min-w-14 rounded px-1.5 py-1 text-center font-bold ${lab.passRate >= 80 ? "bg-emerald-100 text-emerald-700" : lab.passRate >= 75 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{lab.passRate.toFixed(1)}%</span></td><td className="px-1.5 py-2">{(lab.averageTurnaroundDays * 24).toFixed(1)}</td><td className="px-1.5 py-2">{lab.pendingReviews}</td></tr>) : <tr><td colSpan="6" className="p-6 text-center text-slate-500">No active laboratories found.</td></tr>}</tbody>
            </table>
          </div>
          {labRows.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-700">{lowestPassLab.laboratory} has the lowest pass rate ({lowestPassLab.passRate.toFixed(1)}%).</div><div className="rounded-md bg-amber-50 px-3 py-2 text-[10px] text-amber-700">{highestPendingLab.laboratory} has the most pending reviews ({highestPendingLab.pendingReviews}).</div></div>}
        </article>

        <article className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><Clock3 size={20} className="text-blue-600" />Lab-wise Turnaround Time</h2><span className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Average Turnaround Time</span></div>
          {turnaroundLabs.length ? <div className="space-y-1">
            {turnaroundLabs.map((lab) => { const hours = (lab.averageTurnaroundDays || 0) * 24; const barColor = hours <= 43.2 ? "bg-emerald-500" : hours <= 48 ? "bg-amber-400" : hours <= 57.6 ? "bg-orange-500" : "bg-rose-500"; return <div key={lab.laboratory} className="grid grid-cols-[minmax(92px,130px)_minmax(0,1fr)_60px] items-center gap-2 border-b border-slate-100 py-2 text-[10px] last:border-0"><span className="whitespace-normal break-words text-right font-medium leading-3 text-blue-800">{lab.laboratory}</span><div className="relative h-5 rounded-r bg-slate-100"><div className="absolute inset-y-0 left-1/2 z-10 border-l-2 border-dashed border-blue-500" /><div className={`h-full rounded-r ${barColor}`} style={{ width: `${Math.min((hours / 96) * 100, 100)}%` }} /></div><strong className="whitespace-nowrap font-semibold text-[#111b55]">{hours.toFixed(1)} hrs</strong></div>; })}
            <div className="ml-[100px] flex justify-between pr-[68px] text-[9px] text-slate-500 sm:ml-[138px]"><span>0</span><span>24</span><span>48</span><span>72</span><span>96 hrs</span></div>
          </div> : <p className="py-8 text-center text-xs text-slate-500">No completed evaluations available for turnaround analysis.</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-3"><div className="rounded-md bg-blue-50 px-2.5 py-2 text-[10px] text-blue-800"><span className="block">National Average</span><strong className="text-sm">{(metrics.nationalAverageTurnaroundDays * 24).toFixed(1)} hrs</strong></div><div className="rounded-md bg-emerald-50 px-2.5 py-2 text-[10px] text-emerald-800"><span className="block">Target</span><strong className="text-sm">≤ 48 hrs</strong></div>{slowestLab && <div className="rounded-md bg-rose-50 px-2.5 py-2 text-[10px] text-rose-800"><span className="block">Slowest Lab</span><strong className="whitespace-normal break-words text-xs">{slowestLab.laboratory}: {(slowestLab.averageTurnaroundDays * 24).toFixed(1)} hrs</strong></div>}</div>
        </article>
      </section>
      <section className="mb-5 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><ImageIcon size={20} className="text-blue-600" />Data Quality &amp; Photo Compliance</h2>
          
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Tests with complete photo evidence", value: "98.2%", Icon: Camera, progress: "94.2%", bar: "bg-sky-500", icon: "bg-sky-100 text-sky-600" },
            { label: "Tests with standard weight traceability", value: "98.7%", Icon: Weight, progress: "98.7%", bar: "bg-emerald-600", icon: "bg-blue-100 text-blue-600" },
            { label: "Tests with environmental data logged", value: "100%", Icon: Leaf, progress: "100%", bar: "bg-violet-500", icon: "bg-emerald-100 text-emerald-600" },
            { label: "Reports with digital signature", value: "100%", Icon: PenLine, progress: "100%", bar: "bg-cyan-500", icon: "bg-blue-100 text-blue-600" },
            { label: "Reports with QR code", value: "100%", Icon: QrCode, progress: "100%", bar: "bg-blue-600", icon: "bg-blue-100 text-blue-600" },
          ].map(({ label, value, Icon, progress, bar, icon }) => (
            <article key={label} className="rounded-lg bg-[#f1f7ff] px-2.5 py-3">
              <div className="flex min-h-14 items-center gap-2.5">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${icon}`}><Icon size={20} /></span>
                <p className="m-0 text-xs font-medium leading-4 text-[#111b55]">{label}</p>
              </div>
              <strong className="ml-[58px] mt-1 block text-[22px] leading-none text-[#111b55]">{value}</strong>
              <div className="mt-2.5 h-3 rounded bg-blue-100"><div className={`h-full rounded ${bar}`} style={{ width: progress }} /></div>
            </article>
          ))}
        </div>
      </section>
      {/*
      <div className="admin-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION / MAKER-CHECKER</span>
          <h1>Instrument approvals</h1>
          <p>
            Review every passed test case before approving an instrument
            request.
          </p>
        </div>
        <div className="admin-count">
          <strong>{inspections.length}</strong>
          <span>pending requests</span>
        </div>
      </div>
      {error && <div className="testing-error-banner">{error}</div>}
      {loading ? (
        <div className="admin-state">Loading approval requests...</div>
      ) : inspections.length === 0 ? (
        <div className="admin-state">
          <strong>No approval requests</strong>
          <span>Instruments appear here after all physical tests pass.</span>
        </div>
      ) : (
        <div className="admin-layout">
          <aside className="admin-request-list">
            <h2>Pending requests</h2>
            {inspections.map((inspection) => {
              const instrument = inspection.instrumentId;
              return (
                <button
                  key={inspection._id}
                  className={`admin-request ${selected?._id === inspection._id ? "active" : ""}`}
                  onClick={() => setSelected(inspection)}
                >
                  <strong>
                    {instrument?.manufacturer} {instrument?.modelNumber}
                  </strong>
                  <span>Serial: {instrument?.serialNumber}</span>
                  <small>All test cases passed</small>
                </button>
              );
            })}
          </aside>
          {selected && (
            <section className="admin-details">
              <div className="admin-summary">
                <div className="admin-details-top">
                  <div>
                    <span className="eyebrow">INSPECTION DETAILS</span>
                    <h2>
                      {selected.instrumentId?.manufacturer}{" "}
                      {selected.instrumentId?.modelNumber}
                    </h2>
                    <p>
                      Serial number:{" "}
                      <strong>{selected.instrumentId?.serialNumber}</strong>
                    </p>
                  </div>
                  <span className="admin-pending-badge">PENDING APPROVAL</span>
                </div>
                <div className="admin-specs">
                  <span>
                    <small>Instrument type</small>
                    <strong>
                      {value(selected.instrumentId?.instrumentType)}
                    </strong>
                  </span>
                  <span>
                    <small>Accuracy class</small>
                    <strong>
                      {value(selected.instrumentId?.accuracyClass)}
                    </strong>
                  </span>
                  <span>
                    <small>Capacity</small>
                    <strong>
                      {value(selected.instrumentId?.min)}–
                      {value(selected.instrumentId?.max)}{" "}
                      {value(selected.instrumentId?.unit)}
                    </strong>
                  </span>
                  <span>
                    <small>Tested by</small>
                    <strong>{value(selected.testedBy?.officerName)}</strong>
                  </span>
                </div>
                <div className="admin-all-passed">
                  ✓ All physical test modules passed. The request is eligible
                  for administrator approval.
                </div>
              </div>
              <div className="admin-tests">
                <TestRows
                  title="Weighing performance test"
                  test={selected.weighingTest}
                />
                <TestRows
                  title="Eccentricity test"
                  test={selected.eccentricityTest}
                />
                <TestRows
                  title="Repeatability test"
                  test={selected.repeatabilityTest}
                />
              </div>
              <div className="admin-approval-footer">
                <p>
                  Approve only after verifying the submitted readings and
                  results above.
                </p>
                <button
                  onClick={approve}
                  disabled={
                    approving ||
                    selected.allTestsPassed !== true ||
                    selected.inspectionStatus !== "PENDING_APPROVAL"
                  }
                >
                  {approving ? "Approving..." : "Approve instrument request"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
      <section className="admin-reports">
        <div className="admin-reports-heading">
          <div>
            <span className="eyebrow">CERTIFICATES / REPORTS</span>
            <h2>Approved inspection reports</h2>
            <p>Generated certificates remain available here after approval.</p>
          </div>
          <strong>{reports.length} reports</strong>
        </div>
        {reports.length === 0 ? (
          <p className="admin-reports-empty">
            No approved reports have been generated yet.
          </p>
        ) : (
          <div className="admin-report-grid">
            {reports.map((report) => (
              <article className="admin-report-card" key={report._id}>
                <span className="admin-report-status">APPROVED</span>
                <h3>
                  {report.instrumentId?.manufacturer}{" "}
                  {report.instrumentId?.modelNumber}
                </h3>
                <p>Serial number: {report.instrumentId?.serialNumber}</p>
                <div className="admin-report-meta">
                  <span>
                    <small>Certificate</small>
                    <b>{report.certificate?.certificateNumber}</b>
                  </span>
                  <span>
                    <small>Issued</small>
                    <b>
                      {report.certificate?.issueDate
                        ? new Date(
                            report.certificate.issueDate,
                          ).toLocaleDateString()
                        : "—"}
                    </b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openCertificateReport(
                      report,
                      report.certificate,
                      report.supervisorAudit?.digitalSignatureToken,
                    )
                  }
                >
                  View / print report →
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
      */}
    </main>
  );
};
