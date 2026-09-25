import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, Search } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getAllGeneratedReportsAdminApi } from "../../api/instrumentApi";
import { formatDate } from "../../utils/formatDate";

export const AdminReportsPage = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [manufacturer, setManufacturer] = useState("All Manufacturers");
  const [laboratory, setLaboratory] = useState("All Laboratories");
  const [error, setError] = useState("");

  useEffect(() => {
    setHeaderContent({ title: "Generated Reports", subtitle: "View all approved instrument test reports in the system." });
    const loadReports = async () => {
      try {
        const response = await getAllGeneratedReportsAdminApi();
        const payload = response.data;
        setReports(Array.isArray(payload) ? payload : payload?.data || payload?.reports || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load reports.");
      }
    };
    loadReports();
  }, [setHeaderContent]);

  const manufacturers = ["All Manufacturers", ...new Set(reports.map((report) => report.instrumentId?.manufacturer).filter(Boolean))];
  const laboratories = ["All Laboratories", ...new Set(reports.map((report) => report.laboratoryName || "Unassigned Laboratory").filter(Boolean))];
  const visibleReports = useMemo(() => reports.filter((report) => {
    const instrument = report.instrumentId || {};
    const application = report.applicationNumber || report.evaluationId?.applicationNumber || report._id || "";
    const haystack = `${application} ${report.laboratoryName || ""} ${instrument.instrumentType || ""} ${instrument.manufacturer || ""} ${instrument.modelNumber || ""} ${instrument.serialNumber || ""}`.toLowerCase();
    const date = new Date(report.certificate?.issueDate || report.updatedAt || report.createdAt).getTime();
    const months = period === "all" ? null : Number(period);
    return haystack.includes(search.toLowerCase()) && (manufacturer === "All Manufacturers" || instrument.manufacturer === manufacturer) && (laboratory === "All Laboratories" || (report.laboratoryName || "Unassigned Laboratory") === laboratory) && (!months || Date.now() - date <= months * 30 * 24 * 60 * 60 * 1000);
  }), [reports, search, period, manufacturer, laboratory]);

  return <main className="min-h-full w-full bg-[#F8FAFC] px-2 py-4 text-[#172033]"><section className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex flex-wrap gap-3"><label className="relative min-w-[240px] flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports..." className="!m-0 !h-10 !w-full !rounded-md !border-slate-200 !pl-9 !text-xs" /></label><FilterSelect value={period} onChange={setPeriod} options={[["all", "All Time"], ["1", "Last 1 Month"], ["2", "Last 2 Months"], ["3", "Last 3 Months"]]} /><FilterSelect value={manufacturer} onChange={setManufacturer} options={manufacturers.map((item) => [item, item])} /><FilterSelect value={laboratory} onChange={setLaboratory} options={laboratories.map((item) => [item, item])} /></div>{error ? <p className="text-sm text-red-600">{error}</p> : <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[#F1F5F9]"><tr><th className="p-3">#</th><th className="p-3">Report No.</th><th className="p-3">Instrument</th><th className="p-3">Manufacturer</th><th className="p-3">Class</th><th className="p-3">Generated On</th><th className="p-3">Action</th></tr></thead><tbody>{visibleReports.map((report, index) => { const instrument = report.instrumentId || {}; const application = report.applicationNumber || report.evaluationId?.applicationNumber || report._id; return <tr key={report._id} className="border-t border-slate-200"><td className="p-3 font-semibold text-slate-500">{index + 1}</td><td className="p-3 font-bold text-blue-700">{report.certificate?.certificateNumber || `NAWI/TR/${String(application).replace("NAWI-", "")}`}</td><td className="p-3"><div><strong className="block">{instrument.instrumentType || "—"}</strong><small className="block text-[11px] text-slate-500">S/N: {instrument.serialNumber || "—"}</small></div></td><td className="p-3">{instrument.manufacturer || "—"}</td><td className="p-3">{instrument.accuracyClass || "—"}</td><td className="p-3">{formatDate(report.certificate?.issueDate || report.updatedAt || report.createdAt)}</td><td className="p-3"><button type="button" onClick={() => navigate(`/supervisor/reports/${application}`)} className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700"><Eye size={13} />View Report</button></td></tr>; })}</tbody></table>{visibleReports.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No generated reports found.</p>}</div>}</section></main>;
};

function FilterSelect({ value, onChange, options }) { return <label className="relative flex h-10 w-[175px] items-center"><select value={value} onChange={(event) => onChange(event.target.value)} className="!m-0 !h-full !w-full !appearance-none !rounded-md !border-slate-200 !bg-white !px-3 !text-xs !font-semibold !text-slate-700">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-slate-500" /></label>; }
