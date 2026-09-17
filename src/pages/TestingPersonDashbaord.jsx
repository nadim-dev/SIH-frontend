import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyEvaluationsApi } from "../api/instrumentApi";
import { formatDate } from "../utils/formatDate";
import { getInstrumentImage } from "../utils/instrumentImage";
import { ArrowRight, CheckCircle, Clock3, Eye, FileText, FlaskConical, Plus } from "lucide-react";
import { InstrumentEvaluationApi } from "../api/instrumentApi.js";

export const TestingPersonDashboard = () => {
  const { setHeaderContent, currentUser } = useOutletContext();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setHeaderContent({
      title: `Good morning, ${currentUser.name.split(" ")[0]} 👋`,
      subtitle: "Manage your NAWI testing activities and OIML R 76 evaluations",
    });
    getMyEvaluationsApi()
      .then((r) => setEvaluations(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, setHeaderContent]);
  const cards = [
    [
      "Registered",
      "Instruments",
      12,
      "+2",
      "this month",
      FileText,
      "border-[#B7D7FF] bg-[#EAF4FF]",
      "bg-[#B8D8FF] text-[#1267E8]",
      "text-[#079669]",
    ],
    [
      "Tests in",
      "Progress",
      4,
      "+1",
      "from last week",
      FlaskConical,
      "border-[#FFE09A] bg-[#FFF8E6]",
      "bg-[#FFE19A] text-[#B96800]",
      "text-[#C87800]",
    ],
    [
      "Awaiting",
      "Review",
      3,
      "+1",
      "from last week",
      Clock3,
      "border-[#D9C9FF] bg-[#F4EEFF]",
      "bg-[#D9C0FF] text-[#6D28D9]",
      "text-[#7C3AED]",
    ],
    [
      "Completed",
      "Tests",
      5,
      "+3",
      "this month",
      CheckCircle,
      "border-[#B3EACC] bg-[#E8FAF1]",
      "bg-[#B7F0D1] text-[#078A52]",
      "text-[#079669]",
    ],
  ];
  return (
    <section className="bg-[#F8FAFC] py-2.5">
      <div className="grid grid-cols-1 gap-4 min-[701px]:grid-cols-2 min-[1100px]:grid-cols-4">
        {cards.map(
          ([a, b, n, change, period, Icon, c, iconStyle, trendStyle]) => (
            <article
              key={a}
              className={`min-h-[112px] rounded-lg border p-3.5 text-[#0F1B33] shadow-sm ${c}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${iconStyle}`}
                >
                  <Icon size={23} stcrokeWidth={2.25} />
                </div>
                <span className="text-sm font-semibold leading-[1.4]">
                  {a}
                  <br />
                  {b}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between pl-[56px]">
                <strong className="text-2xl leading-none">{n}</strong>
                <span className={`text-xs ${trendStyle}`}>
                  ↗ {change}{" "}
                  <small className="ml-1 text-[#475569]">{period}</small>
                </span>
              </div>
            </article>
          ),
        )}
      </div>
      <section className="mt-5 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-[#0F1B33]">Instrument Evaluations</h2><p className="text-xs text-[#475569]">View and continue your instrument testing applications</p></div><button type="button" onClick={() => navigate("/register/instrument")} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1E88E5]"><Plus size={14} strokeWidth={2.5} />Register Instrument</button></div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[10px]">
            <thead className="bg-[#F1F5F9]">
              <tr>
                {[
                  "Application No.",
                  "Instrument Details",
                  "Manufacturer",
                  "Registered On",
                  "Current Stage",
                  "Progress",
                  "Action",
                ].map((h) => (
                  <th key={h} className="p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center">
                    Loading evaluations...
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center">
                    No instrument evaluations found.
                  </td>
                </tr>
              ) : (
                evaluations.map((e) => {
                  const i = e.instrumentId || {};
                  const p = e.progress || 0;
                  const stage = e.status === "DOCUMENTS_PENDING" ? "Documents" : e.status === "ENVIRONMENT_PENDING" ? "Environment" : e.status.replaceAll("_", " ");
                  const sc =
                    e.status === "COMPLETED"
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : e.status.includes("REVIEW")
                        ? "bg-[#F3E8FF] text-[#7C3AED]"
                        : e.status === "TESTING"
                          ? "bg-[#FFF7E6] text-[#B45309]"
                          : "bg-[#EFF6FF] text-[#2563EB]";
                  const stageLabel = e.status === "DOCUMENTS_PENDING" ? "Documents" : e.status === "ENVIRONMENT_PENDING" ? "Environment" : e.status.replaceAll("_", " ");
                  const progressClass = e.status === "COMPLETED" ? "bg-[#10B981]" : e.status.includes("REVIEW") ? "bg-[#F43F5E]" : e.status === "TESTING" ? "bg-[#8B5CF6]" : e.status === "ENVIRONMENT_PENDING" ? "bg-[#F59E0B]" : "bg-[#2563EB]";
                  return (
                    <tr key={e._id} className="border-b border-[#E2E8F0]">
                      <td className="p-2">
                        <strong className="block text-[11px] font-bold text-[#0F1B33]">{e.applicationNumber}</strong>
                        {e.status === "DOCUMENTS_PENDING" && <span className="mt-1 inline-block rounded bg-[#DBEAFE] px-1.5 py-0.5 text-[8px] font-semibold text-[#2563EB]">New</span>}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2.5">
                          <img src={getInstrumentImage(i.instrumentType)} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} className="h-9 w-9 shrink-0 object-contain" />
                          <div><strong className="font-bold text-[#0F1B33]">{i.instrumentType}</strong><br />Model: {i.modelNumber}</div>
                        </div>
                      </td>
                      <td className="p-2 font-semibold text-[#0F1B33]">{i.manufacturer}</td>
                      <td className="p-2 font-semibold text-[#0F1B33]">
                        {formatDate(e.createdAt)}
                      </td>
                      <td className="p-2">
                        <span className={`rounded px-2 py-1 ${sc}`}>
                          ● {stage}
                        </span>
                      </td>
                      <td className="p-2"><div className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E2E8F0]"><span className={`block h-full rounded-full ${progressClass}`} style={{ width: `${p}%` }} /></span>{p}%</div></td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/testing/${e.applicationNumber}/workflow`)}
                          className={p < 100 ? "inline-flex  cursor-pointer items-center gap-1 rounded bg-[#2563EB] px-2.5 py-1.5 text-white hover:bg-[#1E88E5]" : "inline-flex items-center cursor-pointer gap-1 rounded border border-[#BFDBFE] px-2.5 py-1.5 text-[#2563EB]"}
                        >
                          {p < 100 ? <>Continue <ArrowRight size={12} /></> : <><Eye size={12} />View</>}
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
    </section>
  );
};
