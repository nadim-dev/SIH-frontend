import { useEffect, useMemo, useState } from "react";
import {ArrowLeft,Check,ClipboardList,FileCheck2,FileText,FlaskConical,Gauge,Lock,Play,ShieldCheck,UsersRound} from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getMyEvaluationsApi } from "../api/instrumentApi";
import { formatDate } from "../utils/formatDate";
import { getInstrumentImage } from "../utils/instrumentImage";

const workflowSteps = [
  {
    title: "Instrument Registration",
    copy: "Instrument details submitted successfully.",
    icon: FileCheck2,
    key: "registration",
  },
  {
    title: "Document Upload",
    copy: "Upload and verify the required documents.",
    icon: FileText,
    key: "documents",
  },
  {
    title: "Laboratory Environment",
    copy: "Record laboratory conditions (temperature, humidity, etc.).",
    icon: FlaskConical,
    key: "environment",
  },
  {
    title: "Test Plan",
    copy: "Generate and approve test plan as per OIML R 76.",
    icon: ClipboardList,
    key: "plan",
  },
  {
    title: "Test Execution",
    copy: "Perform prescribed tests and record observations.",
    icon: Gauge,
    key: "testing",
  },
  {
    title: "Compliance Evaluation",
    copy: "Automatic evaluation as per OIML R 76 requirements.",
    icon: ShieldCheck,
    key: "compliance",
  },
  {
    title: "Supervisor Review",
    copy: "Review and approval by lab supervisor.",
    icon: UsersRound,
    key: "review",
  },
  {
    title: "Final Report",
    copy: "Generate digitally signed test report.",
    icon: FileText,
    key: "report",
  },
];

const workflowRoutes = {
  documents: (applicationId) => `/testing/${applicationId}/document-upload`,
  environment: (applicationId) => `/testing/${applicationId}/laboratory-enviroment`,
  plan: (applicationId) => `/testing/${applicationId}/test-plan`,
  testing: (applicationId) => `/testing/${applicationId}/test-execution`,
};

const getActiveStep = (evaluation) => {
  if (!evaluation) return 1;
  if (evaluation.status === "COMPLETED") return 8;
  if (
    evaluation.status === "DOCUMENTS_PENDING" ||
    evaluation.status === "DOCUMENT_REVIEW"
  )
    return 2;
  if (evaluation.status === "ENVIRONMENT_PENDING") return 3;
  if (evaluation.status === "TEST_PLAN_PENDING") return 4;
  if (evaluation.status === "TESTING") return 5;
  if (evaluation.status === "COMPLIANCE_EVALUATION") return 6;
  if (
    evaluation.status === "SUPERVISOR_REVIEW" ||
    evaluation.status === "CORRECTION_REQUIRED"
  )
    return 7;
  return 8;
};

export const InstrumentWorkFlow = () => {
  const { applicationId } = useParams();
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHeaderContent({
      title: "Evaluation Workflow",
      subtitle: "Complete each stage in sequence to finish the evaluation",
    });
    getMyEvaluationsApi()
      .then((response) =>
        setEvaluation(
          (response.data || []).find(
            (item) => item.applicationNumber === applicationId,
          ) || null,
        ),
      )
      .finally(() => setLoading(false));
  }, [applicationId, setHeaderContent]);

  const activeStep = useMemo(() => getActiveStep(evaluation), [evaluation]);
  const instrument = evaluation?.instrumentId || {};

  if (loading)
    return (
      <p className="p-6 text-sm text-[#475569]">
        Loading evaluation workflow...
      </p>
    );
  if (!evaluation)
    return <p className="p-6 text-sm text-[#475569]">Evaluation not found.</p>;

  return (
    <section className="-mt-3 mx-auto max-w-6xl text-[#0F1B33]">
      <button
        type="button"
        onClick={() => navigate("/testing-person/dashboard")}
        className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#D8E0EA] bg-white px-3 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC]"
      >
        <ArrowLeft size={14} />
        Back to My Evaluations
      </button>
      <article className="flex flex-wrap items-start gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <img
          src={getInstrumentImage(instrument.instrumentType)}
          alt=""
          className="h-16 w-16 object-contain"
        />
        <div className="min-w-[220px] flex-1">
          <div>
            <h1 className="m-0 !text-3xl font-bold">
              Application {evaluation.applicationNumber}
            </h1>
          </div>
          <strong className="mt-1 block text-sm">
            {instrument.instrumentType || "Instrument"}
          </strong>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#64748B]">
            <span>Model: {instrument.modelNumber || "—"}</span>
            <span>Serial: {instrument.serialNumber || "—"}</span>
            <span>Manufacturer: {instrument.manufacturer || "—"}</span>
            <span>Registered On: {formatDate(evaluation.createdAt)}</span>
          </div>
        </div>
        <span className="ml-auto rounded bg-[#DBEAFE] px-2.5 py-1.5 text-[10px] font-semibold text-[#2563EB]">
          In Progress
        </span>
      </article>
      <div className="mt-4">
        <h2 className="m-0 text-lg font-bold">Evaluation Workflow</h2>
        <p className="mt-1 text-xs text-[#64748B]">
          Complete each stage in sequence to finish the evaluation.
        </p>
      </div>
      <div className="mt-3 space-y-2">
        {workflowSteps.map((step, index) => {
          const number = index + 1;
          const isComplete = number < activeStep || (activeStep === 8 && number === 8);
          const isActive = number === activeStep && activeStep !== 8;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex gap-3">
              <div className="relative flex w-9 shrink-0 items-center justify-center self-stretch">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${isComplete ? "bg-[#10B981] text-white" : isActive ? "bg-[#2563EB] text-white" : "bg-[#CBD5E1] text-white"}`}
                >
                  {isComplete ? <Check size={15} /> : number}
                </span>
                {number < workflowSteps.length && (
                  <i className="absolute top-1/2 h-[calc(50%+8px)] border-l border-dashed border-[#CBD5E1]" />
                )}
              </div>
              <article
                className={`flex flex-1 items-center gap-3 rounded-lg border p-3 ${isActive ? "border-[#93C5FD] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white"}`}
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-md ${isComplete ? "bg-[#DCFCE7] text-[#059669]" : isActive ? "bg-[#DBEAFE] text-[#2563EB]" : "bg-[#F1F5F9] text-[#64748B]"}`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 text-sm font-bold">{step.title}</h3>
                  <p className="m-0 mt-0.5 text-[11px] text-[#64748B]">
                    {step.copy}
                  </p>
                </div>
                {isComplete ? (
                  <span className="rounded bg-[#DCFCE7] px-3 py-1.5 text-[11px] font-semibold text-[#059669]">
                    ✓ Completed
                  </span>
                ) : isActive ? (
                  <>
                    <span className="rounded bg-[#DBEAFE] px-3 py-1.5 text-[11px] font-semibold text-[#2563EB]">
                      ● In Progress
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const getRoute = workflowRoutes[step.key];
                        if (getRoute) navigate(getRoute(applicationId, instrument._id));
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Continue <Play size={12} fill="currentColor" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-3 py-1.5 text-[11px] font-semibold text-[#64748B]">
                      <Lock size={11} />
                      Locked
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      Complete previous step
                    </span>
                  </>
                )}
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
};
