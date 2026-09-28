import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Building2, CalendarDays, CheckCircle2, FileCheck2, LoaderCircle, ShieldCheck } from "lucide-react";
import { verifyReportApi } from "../api/instrumentApi";

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
  : "Not available";

export const ReportVerification = () => {
  const { reportId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    verifyReportApi(reportId)
      .then((response) => { if (active) setData(response.data || response); })
      .catch((requestError) => {
        if (active) setError(requestError.data?.message || requestError.message || "Report could not be verified.");
      });
    return () => { active = false; };
  }, [reportId, retry]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 font-sans">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-[0_16px_45px_rgba(15,23,42,0.08)] sm:p-9">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-amber-600"><AlertTriangle size={26} /></span>
          <p className="mb-1 mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Public report verification</p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-slate-900">Report not found</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{error}</p>
          <button type="button" onClick={() => setRetry((current) => current + 1)} className="mt-6 rounded-lg bg-[#17345a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#102844]">Try again</button>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 font-sans">
        <section className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white px-7 py-10 text-center shadow-sm">
          <LoaderCircle className="animate-spin text-blue-600" size={28} />
          <h1 className="mb-1 mt-4 text-lg font-bold text-slate-900">Verifying report</h1>
          <p className="m-0 text-sm text-slate-500">Checking the report record and its digital fingerprint.</p>
        </section>
      </main>
    );
  }

  const report = data.report || {};
  const instrument = report.instrument || {};
  const isValid = data.valid === true;
  const complianceStatus = String(report.complianceStatus || "").toUpperCase();
  const hasComplianceStatus = Boolean(complianceStatus);
  const isCompliant = ["COMPLIANT", "PASS"].includes(complianceStatus);
  const tests = Array.isArray(report.tests) ? report.tests : [];
  const details = [
    ["Manufacturer", instrument.manufacturer],
    ["Model", instrument.modelNumber],
    ["Serial number", instrument.serialNumber],
    ["Approved on", formatDate(report.approvedAt)],
  ];

  return (
    <main className="min-h-screen bg-[#f3f6fb] px-4 py-8 font-sans sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,35,68,0.10)]">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-8">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileCheck2 size={22} /></span>
          <div>
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">NAWI Pro · Public verification</p>
            <h1 className="m-0 mt-0.5 text-lg font-bold text-slate-900 sm:text-xl">Instrument Test Report</h1>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${isValid ? "border-emerald-200 bg-emerald-50/70" : "border-red-200 bg-red-50/70"}`}>
            <span className={`mt-0.5 shrink-0 ${isValid ? "text-emerald-600" : "text-red-600"}`}>{isValid ? <BadgeCheck size={23} /> : <AlertTriangle size={23} />}</span>
            <div>
              <h2 className={`m-0 text-sm font-extrabold ${isValid ? "text-emerald-800" : "text-red-800"}`}>{isValid ? "Authentic report" : "Report authenticity could not be confirmed"}</h2>
              <p className={`m-0 mt-1 text-xs leading-5 ${isValid ? "text-emerald-700" : "text-red-700"}`}>{isValid ? "The report record matches its saved digital fingerprint." : "The report record is missing or its saved details do not match the verification fingerprint."}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Report number</p>
              <p className="m-0 mt-1 text-base font-bold text-[#17345a]">{report.reportNumber || `Record ${String(report.reportId || reportId).slice(-8).toUpperCase()}`}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${isValid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}><ShieldCheck size={13} />{isValid ? "VERIFIED" : "UNVERIFIED"}</span>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Building2 size={18} /></span>
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Issuing laboratory</p>
              <p className="m-0 mt-1 break-words text-sm font-bold text-slate-800">{report.laboratoryName || "Laboratory details unavailable"}</p>
            </div>
          </div>

          <div className={`mt-3 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${!hasComplianceStatus ? "border-slate-200 bg-slate-50" : isCompliant ? "border-emerald-200 bg-emerald-50/70" : "border-red-200 bg-red-50/70"}`}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><CheckCircle2 size={16} className={isCompliant ? "text-emerald-600" : hasComplianceStatus ? "text-red-600" : "text-slate-400"} />Overall compliance result</span>
            <span className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold ${!hasComplianceStatus ? "bg-slate-200 text-slate-600" : isCompliant ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{complianceStatus || "Not available"}</span>
          </div>

          <section className="mt-5">
            <h2 className="m-0 text-xs font-bold text-slate-800">Test result summary</h2>
            {tests.length ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {tests.map((test) => (
                  <div key={test.name} className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 ${test.passed ? "border-emerald-100 bg-emerald-50/50" : "border-red-100 bg-red-50/50"}`}>
                    <span className="text-xs font-medium text-slate-700">{test.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold ${test.passed ? "text-emerald-700" : "text-red-700"}`}><CheckCircle2 size={13} />{test.passed ? "PASS" : "FAIL"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-0 mt-2 rounded-lg border border-dashed border-slate-200 px-3.5 py-3 text-xs text-slate-500">Test-level results are unavailable in this report record.</p>
            )}
          </section>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="m-0 mt-1.5 break-words text-sm font-semibold text-slate-800">{value || "Not available"}</p>
              </div>
            ))}
          </div>

          <p className="mb-0 mt-6 flex items-start gap-2 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-500"><CalendarDays size={14} className="mt-0.5 shrink-0 text-slate-400" />This page confirms the report record stored by NAWI Pro. Use the report number above when contacting the issuing laboratory.</p>
        </div>
      </section>
    </main>
  );
};
