import { useEffect, useState } from "react";
import { ChevronDown, Download, Eye, FileText, Search } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getGeneratedReportsApi } from "../../api/instrumentApi";
import { formatDate } from "../../utils/formatDate";
import { getInstrumentImage } from "../../utils/instrumentImage";

export const SupervisorReportsPage = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [manufacturer, setManufacturer] = useState("All Manufacturers");
  const [downloadReport, setDownloadReport] = useState(null);
  useEffect(() => {
    setHeaderContent({
      title: "Generated Reports",
      subtitle: "View and access approved instrument test reports.",
    });
    const loadReports = async () => {
      try {
        const response = await getGeneratedReportsApi();
        const payload = response.data;
        const rows = Array.isArray(payload)
          ? payload
          : payload?.data || payload?.reports || [];
        setReports(Array.isArray(rows) ? rows : []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load reports.");
      }
    };
    loadReports();
  }, [setHeaderContent]);
  const manufacturers = ["All Manufacturers", ...new Set(reports.map((report) => report.instrumentId?.manufacturer).filter(Boolean))];
  const visibleReports = reports.filter((report) => {
    const haystack = `${report.evaluationId?.applicationNumber || ""} ${report.instrumentId?.instrumentType || ""} ${report.instrumentId?.manufacturer || ""} ${report.instrumentId?.modelNumber || ""} ${report.instrumentId?.serialNumber || ""}`.toLowerCase();
    const createdAt = new Date(report.createdAt).getTime();
    const months = period === "all" ? null : Number(period);
    const withinPeriod = !months || (Date.now() - createdAt <= months * 30 * 24 * 60 * 60 * 1000);
    return haystack.includes(search.toLowerCase()) && (manufacturer === "All Manufacturers" || report.instrumentId?.manufacturer === manufacturer) && withinPeriod;
  });
  return (
    <main className="min-h-full w-full bg-[#F8FAFC] px-2 py-4 text-[#172033]">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* <div className="mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-700" />
          <div>
            <h1 className="text-lg font-bold">Generated Test Reports</h1>
            <p className="text-xs text-slate-500">
              Reports created after supervisor approval.
            </p>
          </div>
        </div> */}
        <div className="mb-4 flex flex-wrap gap-3"><label className="relative min-w-[240px] flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports..." className="!m-0 !h-10 !w-full !rounded-md !border-slate-200 !pl-9 !text-xs" /></label><FilterSelect value={period} onChange={setPeriod} options={[["all", "All Time"], ["1", "Last 1 Month"], ["2", "Last 2 Months"], ["3", "Last 3 Months"]]} /><FilterSelect value={manufacturer} onChange={setManufacturer} options={manufacturers.map((item) => [item, item])} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && visibleReports.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No generated reports found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-[#F1F5F9]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Report No.</th>
                  <th className="p-3">Instrument</th>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Generated On</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleReports.map((report, index) => (
                  <tr key={report._id} className="border-t border-slate-200">
                    <td className="p-3 font-semibold text-slate-500">{index + 1}</td>
                    <td className="p-3 font-bold text-black">
                      NAWI/TR/{(report.evaluationId?.applicationNumber || "—").replace("NAWI-", "")}
                      <div className="hidden">
                      <div className="flex items-center gap-2">
                        <img
                          src={getInstrumentImage(report.instrumentId?.instrumentType)}
                          alt=""
                          className="h-9 w-9 shrink-0 object-contain"
                        />
                        <span>{report.instrumentId?.instrumentType || "—"}</span>
                      </div>
                      </div>
                    </td>
                    <td className="p-3"><div><strong className="block">{report.instrumentId?.instrumentType || "—"}</strong><small className="block text-[11px] text-slate-500">S/N: {report.instrumentId?.serialNumber || "—"}</small></div></td>
                    <td className="p-3">{report.instrumentId?.manufacturer || "—"}</td>
                    <td className="p-3">{report.instrumentId?.accuracyClass || "—"}</td>
                    <td className="p-3">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2"><button type="button" onClick={() => navigate(`/supervisor/reports/${report.evaluationId?.applicationNumber}`)} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700"><Eye size={13} />View Report</button><button type="button" onClick={() => setDownloadReport(report)} aria-label="Download report" className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"><Download size={14} /></button></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {downloadReport && <DownloadModal report={downloadReport} onClose={() => setDownloadReport(null)} onPdf={() => { setDownloadReport(null); navigate(`/supervisor/reports/${downloadReport.evaluationId?.applicationNumber}`); }} />}
    </main>
  );
};

function DownloadModal({ report, onClose, onPdf }) {
  const application = report.evaluationId?.applicationNumber || "report";
  const downloadDoc = () => {
    const content = `<html><body><h1>Generated Test Report</h1><p>Application No.: ${application}</p><p>Manufacturer: ${report.instrumentId?.manufacturer || "—"}</p><p>Model: ${report.instrumentId?.modelNumber || "—"}</p><p>Serial Number: ${report.instrumentId?.serialNumber || "—"}</p></body></html>`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "application/msword" }));
    link.download = `${application}-report.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
    onClose();
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"><div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><h3 className="m-0 text-base font-bold text-slate-900">Download report</h3><p className="mt-1 text-xs text-slate-500">Choose a document format.</p></div><button type="button" onClick={onClose} className="text-xl text-slate-400">×</button></div><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onPdf} className="rounded-md border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">Download PDF</button><button type="button" onClick={downloadDoc} className="rounded-md border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">Download DOC</button></div></div></div>;
}

function FilterSelect({ value, onChange, options }) { return <label className="relative flex h-10 w-[175px] items-center"><select value={value} onChange={(event) => onChange(event.target.value)} className="!m-0 !h-full !w-full !appearance-none !rounded-md !border-slate-200 !bg-white !px-3 !text-xs !font-semibold !text-slate-700">{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 text-slate-500" /></label>; }
