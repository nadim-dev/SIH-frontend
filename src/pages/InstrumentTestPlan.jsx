import { useEffect, useState } from "react";
import {
  FileText,
  Clock3,
  Info,
  ArrowRight,
  Eye,
} from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { generateTestPlanApi } from "../api/instrumentApi.js";
import { getInstrumentImage } from "../utils/instrumentImage.js";

const styles = {
  EXAMINATION: "bg-blue-100 text-blue-700",
  PERFORMANCE: "bg-emerald-100 text-emerald-700",
  INFLUENCE_FACTOR: "bg-violet-100 text-violet-700",
  ENDURANCE: "bg-orange-100 text-orange-700",
  ELECTRONIC: "bg-red-100 text-red-700",
};
const labels = {
  EXAMINATION: "Examination",
  PERFORMANCE: "Performance",
  INFLUENCE_FACTOR: "Influence Factor",
  ENDURANCE: "Endurance",
  ELECTRONIC: "Electronic",
};
const rules = {
  GENERAL_EXAMINATION: "Always applicable",
  WEIGHING_PERFORMANCE: "Always applicable",
  REPEATABILITY: "Always applicable",
  ECCENTRICITY: "Always applicable",
  TARE: "Tare device present",
  TEMPERATURE_INFLUENCE: "Always applicable",
  ENDURANCE: "Class II/III/IIII and Max ≤ 100 kg",
  ELECTRONIC_TESTS: "Electronic instrument",
};

export const InstrumentTestPlan = () => {
  const { setHeaderContent } = useOutletContext();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(
    () =>
      setHeaderContent({
        title: "Test Plan",
        subtitle:
          "Applicable tests generated as per OIML R 76-1:2006 based on instrument specification",
      }),
    [setHeaderContent],
  );
  useEffect(() => {
    let active = true;
    const loadTestPlan = async () => {
      try {
        const response = await generateTestPlanApi(applicationId);
        if (active) setPlan(response?.data || response);
      } catch (e) {
        if (active) setError(e.message || "Failed to generate test plan.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTestPlan();
    return () => {
      active = false;
    };
  }, [applicationId]);
  const tests = plan?.tests || [];
  const instrument = plan?.instrument;
  return (
    <main className="min-h-full bg-[#f3f6fb] p-0 font-sans sm:p-2">
      <>
        {instrument && (
          <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dbe5f0] bg-white p-3 shadow-[0_4px_16px_rgba(37,99,235,0.06)] sm:p-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-[96px] w-[116px] shrink-0 place-items-center overflow-hidden rounded-lg bg-transparent">
                <img
                  src={getInstrumentImage(instrument.instrumentType)}
                  alt={instrument.instrumentType || "Instrument"}
                  className="h-full w-full object-contain mix-blend-multiply"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[17px] font-bold leading-6 text-[#172033]">
                  {instrument.instrumentType || "Weighing Instrument"}
                </div>
                <div className="mt-1 text-[12px] text-[#60718e]">
                  Model: {instrument.modelNumber || "—"}
                  <span className="mx-2 text-slate-300">|</span>Serial No:{" "}
                  {instrument.serialNumber || "—"}
                  <span className="mx-2 text-slate-300">
                    |
                  </span>Manufacturer: {instrument.manufacturer || "—"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#46617f]">
                  <span className="rounded-md bg-[#eaf1f8] px-2.5 py-1">
                    {instrument.technology || "Electronic"}
                  </span>
                  <span className="rounded-md bg-[#eaf1f8] px-2.5 py-1">
                    Accuracy Class {instrument.accuracyClass || "—"}
                  </span>
                  <span className="rounded-md bg-[#eaf1f8] px-2.5 py-1">
                    Max: {instrument.max || "—"} {instrument.unit || "kg"}
                  </span>
                  <span className="rounded-md bg-[#eaf1f8] px-2.5 py-1">
                    e = {instrument.e || "—"} {instrument.unit || "kg"}
                  </span>
                  <span className="rounded-md bg-[#eaf1f8] px-2.5 py-1">
                    Tare Device: {instrument.tareDevice || "—"}
                  </span>
                </div>
              </div>
            </div>
        
          </div>
        )}
        <section className="overflow-hidden rounded-xl border border-[#dbe5f0] bg-white shadow-[0_4px_16px_rgba(37,99,235,0.06)]"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5ebf3] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <FileText size={18} />
            </span>
            <div>
              <div className="m-0 text-[16px] font-bold leading-5 tracking-[-0.2px] text-slate-800">
                Applicable Tests ({tests.length})
              </div>
              <p className="m-0 text-[11px] leading-4 text-slate-500">
                The following tests are applicable for this instrument as per
                OIML R 76-1:2006.
              </p>
            </div>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-blue-100 bg-blue-50 text-[10px] leading-4">
            <span className="px-3 py-1.5 text-slate-500">Standard</span>
            <strong className="bg-white px-3 py-1.5 text-blue-600">
              OIML R 76-1:2006
            </strong>
          </div>
        </div>
        {loading && (
          <p className="px-5 py-8 text-sm text-slate-500">
            Generating applicable tests...
          </p>
        )}
        {error && <p className="px-5 py-8 text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="mx-2 mb-2 overflow-hidden overflow-x-auto rounded-lg border border-[#dbe5f0] sm:mx-3">
            <table className="w-full min-w-[760px] border-collapse text-[11px] text-slate-700">
              <thead>
                <tr className="bg-gradient-to-r from-[#eef3f9] to-[#f6f8fb] text-left font-bold text-[#26364d]">
                  <th className="w-10 px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Test Name</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">OIML Clause</th>
                  <th className="px-3 py-2.5">Applicability Rule</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tests.map((test, index) => (
                  <tr
                    className={`border-b border-[#e7edf4] align-middle transition-colors last:border-0 hover:bg-[#f8fbff] ${index % 2 ? "bg-[#fcfdff]" : "bg-white"}`}
                    key={test.code}
                  >
                    <td className="px-3 py-2 font-medium text-slate-600">
                      {test.sequence}
                    </td>
                    <td className="px-3 py-2 font-semibold text-[#1f2d40]">
                      {test.name}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold leading-3 shadow-none ${styles[test.category] || "bg-slate-100 text-slate-600"}`}
                      >
                        {labels[test.category] || test.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-600">
                      {test.clause}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {rules[test.code] ||
                        "Applicable by instrument specification"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[#f8dfb5] bg-[#fff3df] px-2.5 py-1 text-[10px] font-semibold leading-3 text-[#c87500]">
                        <Clock3 size={11} /> Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="m-3 flex items-center justify-between gap-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-[#f7fbff] px-3 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-100 text-blue-600">
              <Info size={15} />
            </span>
            <div>
              <strong className="block text-[12px] text-blue-600">
                Next Step
              </strong>
              <span className="text-[10px] text-slate-500">
                Review the generated test plan. Once confirmed, you can proceed
                to Test Execution.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/testing/${applicationId}/workflow`)}
            className="inline-flex  cursor-pointer shrink-0 items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-[11px] font-bold text-white hover:bg-blue-700"
          >
            Confirm Plan <ArrowRight size={14} />
          </button>
        </div>
      </section></>
    </main>
  );
};
