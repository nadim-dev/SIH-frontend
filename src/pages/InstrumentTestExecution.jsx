import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  BarChart3,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  ClipboardList,
  Cpu,
  Gauge,
  Lock,
  Play,
  Repeat2,
  Target,
  Thermometer,
  Trash2,
} from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { completeUnimplementedTestApi, getTestExecutionDataApi, submitFullInspectionApi } from "../api/instrumentApi.js";

const categoryClass = {
  EXAMINATION: "bg-blue-100 text-blue-700",
  PERFORMANCE: "bg-emerald-100 text-emerald-700",
  INFLUENCE_FACTOR: "bg-violet-100 text-violet-700",
  ENDURANCE: "bg-orange-100 text-orange-700",
  ELECTRONIC: "bg-red-100 text-red-700",
};
const categoryLabel = {
  EXAMINATION: "Examination",
  PERFORMANCE: "Performance",
  INFLUENCE_FACTOR: "Influence Factor",
  ENDURANCE: "Endurance",
  ELECTRONIC: "Electronic",
};
const testIconClass = { GENERAL_EXAMINATION: "bg-blue-50 text-blue-600", WEIGHING_PERFORMANCE: "bg-blue-50 text-blue-600", REPEATABILITY: "bg-emerald-50 text-emerald-600", ECCENTRICITY: "bg-blue-50 text-blue-600", TARE: "bg-blue-50 text-blue-600", TEMPERATURE_INFLUENCE: "bg-violet-50 text-violet-600", ENDURANCE: "bg-orange-50 text-orange-600", ELECTRONIC_TESTS: "bg-red-50 text-red-600" };
const testIcons = { GENERAL_EXAMINATION: ClipboardList, WEIGHING_PERFORMANCE: BarChart3, REPEATABILITY: Repeat2, ECCENTRICITY: Target, TARE: Trash2, TEMPERATURE_INFLUENCE: Thermometer, ENDURANCE: Activity, ELECTRONIC_TESTS: Cpu };
const getTestRoute = (instrumentId, code, applicationNumber) => ({
  GENERAL_EXAMINATION: `/testing/${instrumentId}/general-examination${applicationNumber ? `?applicationNumber=${encodeURIComponent(applicationNumber)}` : ""}`,
  WEIGHING_PERFORMANCE: `/testing/${instrumentId}/weighingtest${applicationNumber ? `?applicationNumber=${encodeURIComponent(applicationNumber)}` : ""}`,
  ECCENTRICITY: `/testing/${instrumentId}/eccentricity${applicationNumber ? `?applicationNumber=${encodeURIComponent(applicationNumber)}` : ""}`,
  REPEATABILITY: `/testing/${instrumentId}/repeatability${applicationNumber ? `?applicationNumber=${encodeURIComponent(applicationNumber)}` : ""}`,
  TARE: `/testing/${instrumentId}/tare${applicationNumber ? `?applicationNumber=${encodeURIComponent(applicationNumber)}` : ""}`,
  TEMPERATURE_INFLUENCE: `/testing/${instrumentId}/temperature-influence`,
  ENDURANCE: `/testing/${instrumentId}/endurance`,
  ELECTRONIC_TESTS: `/testing/${instrumentId}/electronic-tests`,
}[code] || `/testing/${instrumentId}/test-execution`);

export const InstrumentTestExecution = () => {
  const { setHeaderContent, currentUser } = useOutletContext();
  const isSupervisor = currentUser?.role === "LAB SUPERVISOR";
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const completePlaceholderTest = async (code) => {
    try {
      await completeUnimplementedTestApi(data.instrument?._id, code);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete test.");
    }
  };
  const submitForReview = async () => {
    setSubmittingReview(true);
    try {
      await submitFullInspectionApi(data.instrument?._id);
      setReviewSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to submit report for review.");
    } finally { setSubmittingReview(false); }
  };
  useEffect(
    () =>
      setHeaderContent({
        title: "Test Execution",
        subtitle:
          "Perform the prescribed tests and record observations as per OIML R 76-1:2006",
      }),
    [setHeaderContent],
  );
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await getTestExecutionDataApi(applicationId);
        if (active) setData(response?.data || response);
      } catch (e) {
        if (active) setError(e.message || "Failed to load test execution.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [applicationId]);
  const tests = data?.testPlan?.tests || [];
  const completed = tests.filter((test) => test.status === "COMPLETED").length;
  const progress = tests.length
    ? Math.round((completed / tests.length) * 100)
    : 0;
  if (loading)
    return (
      <main className="p-6 text-sm text-slate-500">
        Loading test execution...
      </main>
    );
  if (error) return <main className="p-6 text-sm text-red-600">{error}</main>;
  return (
    <main className="min-h-full bg-[#f3f6fb] p-2 font-sans sm:p-3">
      <section className="mx-auto max-w-[1180px] space-y-3">
        <div className="grid items-center gap-4 rounded-xl border border-[#dbe5f0] bg-white p-3 shadow-sm md:grid-cols-[100px_minmax(0,1fr)_330px] md:px-5">
          <div className="flex flex-col items-center justify-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-full border-[5px] border-slate-200 text-sm font-bold text-slate-800">
              <span>
                {completed}/{tests.length}
              </span>
            </div>
            <small className="mt-1 text-[10px] font-medium text-slate-800">Tests Completed</small>
          </div>
          <div className="min-w-0">
            <b className="block text-[16px] text-slate-800">Overall Progress</b>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <b className="text-[12px] text-slate-700">{progress}%</b>
            </div>
            <div className="mt-2 rounded-md bg-emerald-100 px-3 py-2 text-[12px] leading-5 font-semibold text-emerald-900">
              <span className="mr-2 inline-grid h-4 w-4 place-items-center rounded-full bg-emerald-500 align-[-3px] text-white"><Check size={10} strokeWidth={3} /></span>You have completed {completed} out of {tests.length} tests. Continue with the next test.
            </div>
          </div>
          <div className="flex items-center justify-around border-l border-slate-200 text-[11px] text-slate-500">
            <span>
              <CalendarDays size={14} className="mr-1 inline text-blue-600" />{" "}
              Start Date
              <br />
              <b className="ml-5 text-slate-700">
                {data?.evaluation?.createdAt
                  ? new Date(data.evaluation.createdAt).toLocaleDateString(
                      "en-GB",
                    )
                  : "—"}
              </b>
            </span>
            <span>
              <Clock3 size={14} className="mr-1 inline text-indigo-600" /> Last Updated
              <br />
              <b className="ml-5 text-slate-700">
                {data?.evaluation?.updatedAt
                  ? new Date(data.evaluation.updatedAt).toLocaleString("en-GB")
                  : "—"}
              </b>
            </span>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#dbe5f0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-blue-600">
                <Gauge size={17} />
              </span>
              <div>
                <b className="block text-sm text-slate-800">
                  Applicable Tests ({tests.length})
                </b>
                <small className="text-[10px] text-slate-500">
                  Click on a test to record observations. Tests are based on
                  your instrument specifications.
                </small>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-600 text-white"><Check size={9} strokeWidth={3} /></span>Completed</span>
              <span className="inline-flex items-center gap-1"><Circle size={14} className="text-blue-600" strokeWidth={3} />In Progress</span>
              <span className="inline-flex items-center gap-1"><Circle size={14} className="fill-slate-300 text-slate-300" />Pending</span>
              <span className="inline-flex items-center gap-1"><Lock size={14} className="text-slate-600" />Locked</span>
            </div>
          </div>
          <div className="divide-y divide-slate-200">
                {tests.map((test, index) => {
              const status = test.status || "PENDING";
              const isCompleted = status === "COMPLETED";
                  const isActive = !isCompleted && index === completed;
                  const TestIcon = testIcons[test.code] || Gauge;
              return (
                <button
                  key={test.code}
                  type="button"
                  onClick={() => {
                    if (isSupervisor || !isActive) return;
                    if (["TEMPERATURE_INFLUENCE", "ENDURANCE"].includes(test.code)) {
                      completePlaceholderTest(test.code);
                      return;
                    }
                    navigate(getTestRoute(data.instrument?._id, test.code, data.evaluation?.applicationNumber));
                  }}
                  className={`flex w-full items-center gap-2 px-2 py-2.5 text-left text-[11px] ${!isSupervisor && isActive ? "cursor-pointer hover:bg-blue-50" : "cursor-default"}`}
                >
                  <span className="w-7 rounded bg-slate-100 px-1 py-1 text-center font-bold text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full ${isCompleted ? "bg-emerald-500 text-white" : isActive ? "border-2 border-blue-600 text-blue-600" : "bg-slate-300 text-white"}`}
                  >
                    {isCompleted ? (
                      <Check size={10} />
                    ) : isActive ? (
                      <Circle size={8} />
                    ) : null}
                  </span>
                  <span className={`grid h-6 w-6 place-items-center rounded-md ${testIconClass[test.code] || "bg-slate-50 text-slate-500"}`}>
                    <TestIcon size={14} />
                  </span>
                  <span className="w-36 font-semibold text-slate-800">
                    {test.name}
                  </span>
                  <span
                    className={`rounded px-2 py-1 text-[10px] font-medium ${categoryClass[test.category] || "bg-slate-100 text-slate-600"}`}
                  >
                    {categoryLabel[test.category] || test.category}
                  </span>
                  <span className="hidden flex-1 text-[11px] text-slate-500 md:block">
                    {test.description}
                  </span>
                  <span
                    className={`rounded px-2 py-1 ${isCompleted ? "bg-emerald-50 text-emerald-700" : isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {isCompleted
                      ? "● Completed"
                      : isActive
                        ? "● In Progress"
                        : "○ Pending"}
                  </span>
                  {!isSupervisor && isActive && <span title="Start test" className="ml-2 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm"><Play size={10} fill="currentColor" /></span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate(`/testing/${applicationId}/workflow`)}
            className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700"
          >
            <ArrowLeft size={13} /> Back to Evaluation
          </button>
          {!isSupervisor && <button
            type="button"
            onClick={submitForReview}
            disabled={submittingReview || completed !== tests.length}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-[10px] font-bold text-white"
          >
            {submittingReview ? "Submitting..." : "Submit For Review"} <ArrowRight size={13} />
          </button>}
        </div>
        {reviewSubmitted && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40"><div className="w-[min(90vw,420px)] rounded-xl bg-white p-6 text-center shadow-2xl"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={25} /></div><h2 className="text-lg font-bold text-slate-900">Report Submitted</h2><p className="mt-2 text-sm text-slate-600">Your inspection report has been submitted for review.</p><div className="mt-5 flex justify-center gap-3"><button type="button" onClick={() => setReviewSubmitted(false)} className="rounded border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700">Close</button><button type="button" onClick={() => navigate("/testing-person/dashboard")} className="rounded bg-blue-600 px-5 py-2 text-sm font-bold text-white">Back to Dashboard</button></div></div></div>}
      </section>
    </main>
  );
};
