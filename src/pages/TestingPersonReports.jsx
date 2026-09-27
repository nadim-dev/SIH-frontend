import { useEffect, useState } from "react";
import { ChevronDown, Eye, Search } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyEvaluationsApi } from "../api/instrumentApi";
import { formatDate } from "../utils/formatDate";

export const TestingPersonReports = () => {
  const { setHeaderContent, currentUser } = useOutletContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [manufacturer, setManufacturer] = useState("All Manufacturers");

  useEffect(() => {
    setHeaderContent({ title: "My Reports", subtitle: "View your completed instrument test reports." });
    getMyEvaluationsApi()
      .then((response) => setReports((response.data || []).filter((evaluation) => Number(evaluation.progress) >= 100)))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load reports."));
  }, [setHeaderContent]);

  const manufacturers = ["All Manufacturers", ...new Set(reports.map((report) => report.instrumentId?.manufacturer).filter(Boolean))];
  const visibleReports = reports.filter((report) => {
    const instrument = report.instrumentId || {};
    const haystack = `${report.applicationNumber || ""} ${instrument.instrumentType || ""} ${instrument.manufacturer || ""} ${instrument.modelNumber || ""} ${instrument.serialNumber || ""}`.toLowerCase();
    const date = new Date(report.completedAt || report.updatedAt || report.createdAt).getTime();
    const months = period === "all" ? null : Number(period);
    return haystack.includes(search.toLowerCase()) && (manufacturer === "All Manufacturers" || instrument.manufacturer === manufacturer) && (!months || Date.now() - date <= months * 30 * 24 * 60 * 60 * 1000);
  });

  return (
    <main className="min-h-full bg-[#F8FAFC] py-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3"><label className="relative min-w-[240px] flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports..." className="!m-0 !h-10 !w-full !rounded-md !border-slate-200 !pl-9 !text-xs" /></label><FilterSelect value={period} onChange={setPeriod} options={[["all", "All Time"], ["1", "Last 1 Month"], ["2", "Last 2 Months"], ["3", "Last 3 Months"]]} /><FilterSelect value={manufacturer} onChange={setManufacturer} options={manufacturers.map((item) => [item, item])} /></div>
        {error ? <p className="text-sm text-red-600">{error}</p> : visibleReports.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No completed reports found.</p> : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-[#F1F5F9]"><tr><th className="p-3">#</th><th className="p-3">Report No.</th><th className="p-3">Instrument</th><th className="p-3">Manufacturer</th><th className="p-3">Test Date</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
              <tbody>{visibleReports.map((report, index) => { const instrument = report.instrumentId || {}; const nonCompliant = report.complianceStatus === "NON_COMPLIANT" || report.complianceResult === "FAIL"; return <tr key={report._id} className="border-t border-slate-200"><td className="p-3 font-semibold text-slate-500">{index + 1}</td><td className="p-3 font-bold text-blue-700">NAWI/TR/{(report.applicationNumber || "—").replace("NAWI-", "")}</td><td className="p-3"><div><strong className="block">{instrument.instrumentType || "—"}</strong><small className="block text-[11px] text-slate-500">Serial No.: {instrument.serialNumber || "—"}</small></div></td><td className="p-3">{instrument.manufacturer || "—"}</td><td className="p-3">{formatDate(report.completedAt || report.updatedAt || report.createdAt)}</td><td className="p-3"><span className={`rounded px-2 py-1 ${nonCompliant ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>{nonCompliant ? "Non-Compliant" : "Compliant"}</span></td><td className="p-3"><button type="button" onClick={() => navigate(`/testing/${report.applicationNumber}/report`)} className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700"><Eye size={13} />View</button></td></tr>; })}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

function FilterSelect({ value, onChange, options }) { return <label className="relative flex h-10 w-[175px] items-center"><select value={value} onChange={(event) => onChange(event.target.value)} className="!m-0 !h-full !w-full !appearance-none !rounded-md !border-slate-200 !bg-white !px-3 !text-xs !font-semibold !text-slate-700">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-slate-500" /></label>; }
