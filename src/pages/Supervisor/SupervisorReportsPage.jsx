import { useEffect, useState } from "react";
import { FileText, Eye } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getGeneratedReportsApi } from "../../api/instrumentApi";
import { formatDate } from "../../utils/formatDate";

export const SupervisorReportsPage = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    setHeaderContent({
      title: "Generated Reports",
      subtitle: "View and access approved instrument test reports.",
    });
    getGeneratedReportsApi()
      .then((response) => {
        const payload = response.data;
        const rows = Array.isArray(payload)
          ? payload
          : payload?.data || payload?.reports || [];
        setReports(Array.isArray(rows) ? rows : []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load reports."),
      );
  }, [setHeaderContent]);
  return (
    <main className="min-h-full w-full bg-[#F8FAFC] px-2 py-4 text-[#172033]">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-700" />
          <div>
            <h1 className="text-lg font-bold">Generated Test Reports</h1>
            <p className="text-xs text-slate-500">
              Reports created after supervisor approval.
            </p>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && reports.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No generated reports found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-[#F1F5F9]">
                <tr>
                  <th className="p-3">Application No.</th>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Serial Number</th>
                  <th className="p-3">Generated On</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id} className="border-t border-slate-200">
                    <td className="p-3 font-bold text-blue-700">
                      {report.evaluationId?.applicationNumber || "—"}
                    </td>
                    <td className="p-3">{report.instrumentId?.manufacturer || "—"}</td>
                    <td className="p-3">{report.instrumentId?.modelNumber || "—"}</td>
                    <td className="p-3">
                      {report.instrumentId?.serialNumber || "—"}
                    </td>
                    <td className="p-3">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/supervisor/reports/${report.evaluationId?.applicationNumber}`,
                          )
                        }
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-blue-200 px-3 py-1.5 font-bold text-blue-700"
                      >
                        <Eye size={13} />
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};
