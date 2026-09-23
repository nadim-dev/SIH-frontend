import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getGeneratedReportApi } from "../../api/instrumentApi";

export const SupervisorReport = () => {
  const { applicationId } = useParams();
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
 

  useEffect(() => {
    setHeaderContent({
      title: "Instrument Test Report",
      subtitle: `Approved test report for application ${applicationId}`,
    });
    getGeneratedReportApi(applicationId)
      .then((response) => setReport(response.data?.data || response.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load report."),
      );
  }, [applicationId, setHeaderContent]);

  if (!report)
    return (
      <main className="p-6 text-sm text-slate-500">
        {error || "Loading report..."}
      </main>
    );
  const instrument = report.instrumentDetails || {};
  const results = report.testResults || {};
  const rows = [
    ["Weighing Performance", results.weighingTest?.passed],
    ["Repeatability", results.repeatabilityTest?.passed],
    ["Eccentricity", results.eccentricityTest?.passed],
    ["Tare", results.tareTest?.passed],
  ];
  return (
    <main className="min-h-full bg-[#F8FAFC] p-4 text-[#172033]">
      <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold">Instrument Test Report</h1>
            <p className="mt-1 text-xs text-slate-500">
              Application report generated after supervisor approval.
            </p> 
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            APPROVED
          </span>
        </div>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
          <div>
            <small className="text-[10px] text-slate-500">Manufacturer</small>
            <strong className="block text-sm">
              {instrument.manufacturer || "—"}
            </strong>
          </div>
          <div>
            <small className="text-[10px] text-slate-500">Model</small>
            <strong className="block text-sm">
              {instrument.modelNumber || "—"}
            </strong>
          </div>
          <div>
            <small className="text-[10px] text-slate-500">Serial Number</small>
            <strong className="block text-sm">
              {instrument.serialNumber || "—"}
            </strong>
          </div>
          <div>
            <small className="text-[10px] text-slate-500">Accuracy Class</small>
            <strong className="block text-sm">
              {instrument.accuracyClass || "—"}
            </strong>
          </div>
        </div>
        <h2 className="mt-6 mb-2 text-base font-bold">Test Results</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#17345A] text-white">
              <tr>
                <th className="p-3">Test</th>
                <th className="p-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, passed]) => (
                <tr key={name} className="border-t border-slate-200">
                  <td className="p-3 font-semibold">{name}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-bold ${passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/supervisor/evaluations")}
            className="rounded-md bg-[#17345A] px-4 py-2 text-xs font-bold text-white"
          >
            Back to evaluations
          </button>
        </div>
      </section>
    </main>
  );
};
