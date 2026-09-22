import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Search } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyEvaluationsApi } from "../../api/instrumentApi";

export const SupervisorEvaluation = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeaderContent({
      title: "Supervisor Evaluation",
      subtitle:
        "Review submitted instrument evaluations and compliance results.",
    });
    getMyEvaluationsApi()
      .then((response) => setEvaluations(response.data?.data || []))
      .finally(() => setLoading(false));
  }, [setHeaderContent]);

  const rows = useMemo(
    () =>
      evaluations.filter((evaluation) => {
        const instrument = evaluation.instrumentId || {};
        const text =
          `${evaluation.applicationNumber} ${instrument.modelNumber} ${instrument.manufacturer}`.toLowerCase();
        return (
          (!query || text.includes(query.toLowerCase())) &&
          (status === "ALL" || evaluation.status === status)
        );
      }),
    [evaluations, query, status],
  );

  return (
    <main className="min-h-full w-full bg-[#F8FAFC] px-2 py-4 text-[#172033]">
      <section className="w-full rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
        <div className="mb-3 grid items-center gap-2 md:grid-cols-[minmax(360px,1fr)_minmax(170px,190px)_minmax(170px,190px)_auto]">
          <label className="relative flex items-center text-xs text-[#94A3B8]">
            <Search size={16} className="pointer-events-none absolute left-4 z-10" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by application no., model, manufacturer..."
              className="!m-0 w-full rounded-md border border-[#E2E8F0] py-2 !pl-12 pr-3 outline-none"
            />
          </label>
          <label>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="!m-0 w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUPERVISOR_REVIEW">Awaiting Review</option>
              <option value="TESTING">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
          <label>
            <select
              aria-label="Filter by testing officer"
              className="!m-0 w-full rounded-md border border-[#E2E8F0] px-2 py-2 text-xs"
            >
              <option>All Officers</option>
            </select>
          </label>
          
        </div>
        <div className="w-full overflow-x-auto rounded-md border mt-5 border-[#E2E8F0]">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-[#F1F5F9] text-[#334155]">
              <tr>
                {[
                  "#",
                  "Application No.",
                  "Instrument",
                  "Model",
                  "Manufacturer",
                  "Testing Officer",
                  "Last Updated",
                  "Action",
                ].map((heading) => (
                  <th key={heading} className="px-3 py-3 font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    Loading evaluations...
                  </td>
                </tr>
              ) : (
                rows.map((evaluation, index) => {
                  const instrument = evaluation.instrumentId || {};
                  return (
                    <tr
                      key={evaluation._id}
                      className="border-t border-[#E2E8F0] hover:bg-blue-50"
                    >
                      <td className="px-3 py-3 font-bold">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-3 font-bold text-[#0F4C9A]">
                        {evaluation.applicationNumber}
                      </td>
                      <td className="px-3 py-3">
                        {instrument.instrumentType || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {instrument.modelNumber || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {instrument.manufacturer || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {evaluation.testingOfficerName || "—"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {new Date(
                          evaluation.updatedAt || evaluation.createdAt,
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/testing/${evaluation.applicationNumber}/workflow`,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-[#DBEAFE] px-3 py-1.5 font-bold text-[#2563EB]"
                        >
                          <FileText size={13} /> Review{" "}
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
