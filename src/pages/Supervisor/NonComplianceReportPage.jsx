import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  Eye,
  FileText,
  PlayCircle,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { getNonComplianceReportsApi, reviewNonComplianceReportApi } from "../../api/instrumentApi";

export const NonComplianceReportPage = () => {
  const { setHeaderContent } = useOutletContext();
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    setHeaderContent({
      title: "Non-Compliance Reports",
      subtitle: "Review failed test reports submitted by testing officers.",
    });
  }, [setHeaderContent]);
  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await getNonComplianceReportsApi();
        const rows = response.data || [];
        setReports(rows);
        setSelectedId(null);
      } catch (requestError) {
        setError(requestError.message || "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const filtered = useMemo(
    () =>
      reports.filter((report) => {
        const instrument = report.instrumentId || {};
        const text =
          `${report.ncrId} ${instrument.manufacturer} ${instrument.modelNumber} ${instrument.serialNumber}`.toLowerCase();
        return (
          (status === "ALL" || report.status === status) &&
          text.includes(search.toLowerCase())
        );
      }),
    [reports, search, status],
  );
  const selected = selectedId
    ? filtered.find((report) => report._id === selectedId)
    : null;
  const pending = reports.filter(
    (report) => report.status === "PENDING",
  ).length;
  const corrections = reports.filter((report) =>
    ["REJECTED", "CORRECTION_REQUIRED"].includes(report.status),
  ).length;

  const handleResumeTesting = async () => {
    if (!selected || reviewing) return;
    setReviewing(true);
    try {
      const response = await reviewNonComplianceReportApi(
        selected._id,
        "RESUMED",
        "Supervisor allowed testing to resume.",
      );
      setReports((current) => current.map((report) => report._id === selected._id
        ? { ...report, ...(response.data || {}), status: "RESUMED" }
        : report));
      setSelectedId(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Unable to resume testing.");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-3 min-[701px]:grid-cols-3">
        <Summary
          label="Total Reports"
          value={reports.length}
          icon={FileText}
          tone="blue"
        />
        <Summary
          label="Awaiting Review"
          value={pending}
          icon={Clock3}
          tone="amber"
        />
        <Summary
          label="Correction Required"
          value={corrections}
          icon={ShieldAlert}
          tone="red"
        />
      </div>
      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_6px_16px_rgba(23,32,51,0.04)]">
        <div className="border-b border-slate-200 p-5">
          <div>
            <h2 className="m-0 text-xl font-bold text-[#0f1b39]">
              Review Reports
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Inspect evidence and decide the next testing step.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="relative min-w-[210px] flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reports..."
                className="!m-0 !h-9 !w-full !pl-9 !text-xs"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="!m-0 !h-9 !w-[145px] !text-xs"
              aria-label="Filter report status"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading reports...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No non-compliance reports found.
          </div>
        ) : (
          <div className="grid w-full gap-3 p-4">
            {filtered.map((report) => (
              <ReportListItem
                key={report._id}
                report={report}
                active={false}
                onClick={() => setSelectedId(report._id)}
              />
            ))}
          </div>
        )}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
            onClick={() => setSelectedId(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Non-compliance report details"
              className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close report details"
                title="Close"
                onClick={() => setSelectedId(null)}
                className="absolute right-4 top-4 z-10 inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={17} />
              </button>
              <ReportDetails report={selected} onResumeTesting={handleResumeTesting} reviewing={reviewing} />
            </div>
          </div>
        )}
      </section>
    </section>
  );
};

function Summary({ label, value, icon: Icon, tone }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-700",
  };
  return (
    <article
      className={`flex items-center gap-3 rounded-xl border p-4 ${tones[tone]}`}
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/70">
        <Icon size={19} />
      </span>
      <span>
        <small className="block text-[10px] font-bold uppercase tracking-wide opacity-75">
          {label}
        </small>
        <strong className="text-2xl">{value}</strong>
      </span>
    </article>
  );
}
function ReportListItem({ report, active, onClick }) {
  const instrument = report.instrumentId || {};
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full cursor-pointer flex-col gap-5 rounded-2xl border border-l-4 p-5 text-left shadow-[0_4px_14px_rgba(15,27,57,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(15,27,57,0.1)] sm:flex-row sm:items-center sm:justify-between ${active ? "border-blue-300 border-l-blue-600 bg-blue-50/60" : "border-slate-200 border-l-blue-500 bg-white hover:border-blue-300"}`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <FileText size={20} />
        </span>
        <div className="min-w-0">
          <span className="block truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {report.ncrId || "NCR report"}
          </span>
          <strong className="mt-1.5 block truncate text-base font-bold text-slate-900">
            {instrument.manufacturer || "Instrument"}{" "}
            {instrument.modelNumber || ""}
          </strong>
          <span className="mt-1 block truncate text-xs text-slate-500">
            Serial number: {instrument.serialNumber || "—"}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4 sm:border-t-0 sm:pt-0 sm:pl-6">
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Submitted
          </span>
          <span className="mt-1 block text-xs font-medium text-slate-700">
            {formatDate(report.createdAt)}
          </span>
        </div>
        <Status status={report.status} />
        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition group-hover:bg-blue-700">
          View details <span aria-hidden="true">→</span>
        </span>
      </div>
    </button>
  );
}
function ReportDetails({ report, onResumeTesting, reviewing }) {
  const instrument = report.instrumentId || {};
  return (
    <article className="p-5">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3 pr-16">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
            Non-Compliance Review
          </span>
          <Status status={report.status} />
        </div>
        <h3 className="mt-1 text-xl font-bold text-slate-900">
          {report.ncrId || "Report details"}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Submitted {formatDate(report.createdAt)}
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Manufacturer", instrument.manufacturer],
          ["Model", instrument.modelNumber],
          ["Serial Number", instrument.serialNumber],
          ["Failed Items", report.failedItems?.length || 0],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <small className="block text-[10px] text-slate-500">{label}</small>
            <strong className="mt-1 block truncate text-xs text-slate-800">
              {value || "—"}
            </strong>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <h4 className="text-sm font-bold text-slate-800">Failed checks</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {(report.failedItems || []).map((item) => (
            <span
              key={item.key || item.label}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700"
            >
              <AlertTriangle size={13} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-slate-200 p-4">
        <h4 className="text-sm font-bold text-slate-800">Officer remarks</h4>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {report.remarks || "No remarks provided."}
        </p>
      </div>
      <div className="mt-5">
        <h4 className="text-sm font-bold text-slate-800">Evidence</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {(report.evidence || []).length ? (
            report.evidence.map((file) => (
              <a
                key={file.publicId || file.url}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
              >
                <Eye size={14} />
                {file.originalName || "View evidence"}
              </a>
            ))
          ) : (
            <span className="text-xs text-slate-500">
              No evidence attached.
            </span>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        {report.status === "RESUMED" ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <strong className="block">Testing resumed</strong>
            <span>{report.supervisorRemarks || "Supervisor allowed the officer to continue testing."}</span>
            {report.reviewedAt && <span className="ml-1 text-blue-600">({formatDate(report.reviewedAt)})</span>}
          </div>
        ) : <span />}
        {report.status === "PENDING" && <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onResumeTesting}
            disabled={reviewing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlayCircle size={15} /> {reviewing ? "Resuming..." : "Resume Testing"}
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <Check size={15} /> Approve NCR
          </button>
        </div>}
      </div>
    </article>
  );
}
function Status({ status }) {
  const tone =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "RESUMED"
        ? "bg-blue-50 text-blue-700"
      : status === "PENDING"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${tone}`}
    >
      {status?.replaceAll("_", " ") || "PENDING"}
    </span>
  );
}
function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}
