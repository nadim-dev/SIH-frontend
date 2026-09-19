import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Droplets, Gauge, Thermometer } from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { saveEvaluationEnvironmentApi } from "../api/instrumentApi";

const fields = [
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    value: "23.5",
    range: "Typical range: 15 – 30 °C",
    icon: Thermometer,
    iconClass: "bg-[#FFE7EB] text-[#EF233C]",
  },
  {
    key: "humidity",
    label: "Relative Humidity",
    unit: "% RH",
    value: "52",
    range: "Typical range: 30 – 70 % RH",
    icon: Droplets,
    iconClass: "bg-[#E5F0FF] text-[#1976F3]",
  },
  {
    key: "pressure",
    label: "Barometric Pressure",
    unit: "hPa",
    value: "",
    range: "Typical range: 950 – 1050 hPa",
    icon: Gauge,
    iconClass: "bg-[#F0E7FF] text-[#7B2FE8]",
  },
];

export const LaboratoryEnvironment = () => {
  const { setHeaderContent } = useOutletContext();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState(
    Object.fromEntries(fields.map(({ key, value }) => [key, value])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setHeaderContent?.({
      title: "Laboratory Environment",
      subtitle: "Record the current environmental conditions",
    });
  }, [setHeaderContent]);

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!values.temperature || !values.humidity) {
      setError("Temperature and relative humidity are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await saveEvaluationEnvironmentApi(applicationId, {
        temperature: values.temperature,
        relativeHumidity: values.humidity,
        barometricPressure: values.pressure,
      });
      navigate(`/testing/${applicationId}/workflow`);
    } catch (saveError) {
      setError(saveError.message || "Failed to save laboratory environment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-[#F4F8FC] px-4 py-5 sm:px-6">
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl rounded-xl bg-white px-5 py-5 shadow-[0_8px_28px_rgba(35,70,110,0.08)] sm:px-5 sm:py-5">
        <h2 className="m-0 text-[20px] font-bold leading-tight text-[#152642]">
          Environmental Conditions
        </h2>
        <p className="mt-1 text-[15px] text-[#456184]">
          Enter the current measurements from the laboratory.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {fields.map(({ key, label, unit, value, range, icon: Icon, iconClass }) => (
            <label key={key} className="!font-[sans-serif] !normal-case rounded-lg border border-[#DCE5F0] p-3.5">
              <span className={`grid h-[48px] w-[48px] place-items-center rounded-lg ${iconClass}`}>
                <Icon size={26} strokeWidth={2.2} />
              </span>
              <span className="mt-2 block text-[0.9rem] font-light text-[#152642]">
                {label}{key !== "pressure" && <em className="ml-1 not-italic text-[#EF233C]">*</em>}
              </span>
              <span className="mt-3 flex h-10 overflow-hidden rounded-lg border border-[#DCE5F0] bg-white">
                <input
                  type="number"
                  step="any"
                  min="0"
                  required={key !== "pressure"}
                  value={values[key]}
                  onChange={(event) => updateValue(key, event.target.value)}
                  className=" !m-0 !min-h-0 !min-w-0 flex-1 !rounded-none !border-0 !px-3 text-[15px] text-[#456184] outline-none"
                />
                <span className=" grid min-w-[55px] place-items-center border-l border-[#DCE5F0] bg-[#F0F5FA] px-2 text-sm font-medium text-[#456184]">
                  {unit}
                </span>
              </span>
              <span className=" mt-2 block text-[12px] text-[#607897]">{range}</span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`/testing/${applicationId}/workflow`)}
            className="inline-flex cursor-pointer h-10 items-center gap-2.5 rounded-lg border border-[#DCE5F0] bg-white px-5 text-sm font-semibold text-[#152642] shadow-sm hover:bg-[#F8FAFC]"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer h-10 items-center gap-3 rounded-lg bg-[#1769E8] px-5 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(23,105,232,0.25)] hover:bg-[#1259C9]"
          >
            {saving ? "Saving..." : "Save & Continue"}
            <ArrowRight size={18} />
          </button>
        </div>
        {error && <p className="mt-3 text-right text-xs font-medium text-[#DC2626]">{error}</p>}
      </form>
    </section>
  );
};
