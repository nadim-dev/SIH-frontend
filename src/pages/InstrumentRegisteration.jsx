import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // If using react-router-dom
import { RegisterInstrumentApi } from "../api/instrumentApi";
import Decimal from "decimal.js";
import { compressImage } from "../utils/compressImage";

const MAX_SOURCE_IMAGE_SIZE = 5 * 1024 * 1024;

export const InstrumentRegister = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    manufacturer: "",
    model: "",
    serial: "",
    instrumentType: "",
    accuracy: "",
    unit: "kg",
    maxCapacity: "",
    minCapacity: "",
    verificationStep: "",
    displayStep: "",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const update = ({ target }) => {
    const { name, value } = target;
    setForm((current) => ({ ...current, [name]: value }));
    setServerError(""); // Clear errors on user edit
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setServerError("");
    if (selectedFile.size > MAX_SOURCE_IMAGE_SIZE) {
      setFile(null);
      setServerError("Image must be 5 MB or smaller.");
      return;
    }
    try {
      setFile(await compressImage(selectedFile));
    } catch (error) {
      setFile(null);
      setServerError(error.message);
    }
  };

  // 1. Live Metrological Calculation Engine (Client-side Table 3 feedback)

const validationState = useMemo(() => {
  // Return empty state if values aren't typed yet
  if (!form.maxCapacity || !form.verificationStep || !form.accuracy) {
    return { n: null, error: null, isValid: false };
  }

  try {
    const max = new Decimal(form.maxCapacity);
    const e = new Decimal(form.verificationStep);

    if (max.isNegative() || max.isZero() || e.isNegative() || e.isZero()) {
      return { n: null, error: "Max capacity and e must be positive numbers.", isValid: false };
    }

    // 1. Division Count (n = Max / e)
    const n = max.dividedBy(e);

    // 2. Display resolution check (d <= e <= 10d)
    if (form.displayStep) {
      const d = new Decimal(form.displayStep);
      if (d.greaterThan(e)) {
        return { n: n.toString(), error: "Display step (d) cannot be larger than verification step (e).", isValid: false };
      }
      if (e.greaterThan(d.times(10))) {
        return { n: n.toString(), error: "Verification step (e) cannot exceed 10 × d.", isValid: false };
      }
    }

    // 3. Minimum Capacity check (Min vs 20e / 10e)
    if (form.minCapacity) {
      const min = new Decimal(form.minCapacity);
      
      if (min.greaterThanOrEqualTo(max)) {
        return { n: n.toString(), error: "Min capacity must be strictly less than Max capacity.", isValid: false };
      }

      if (form.accuracy === "Class III") {
        const requiredMin = e.times(20);
        if (min.lessThan(requiredMin)) {
          return {
            n: n.toString(),
            error: `Class III requires Min ≥ 20e (${requiredMin.toString()} ${form.unit || "kg"}).`,
            isValid: false
          };
        }
      } else if (form.accuracy === "Class IIII") {
        const requiredMin = e.times(10);
        if (min.lessThan(requiredMin)) {
          return {
            n: n.toString(),
            error: `Class IIII requires Min ≥ 10e (${requiredMin.toString()} ${form.unit || "kg"}).`,
            isValid: false
          };
        }
      }
    }

    // 4. Class-specific division count limits (OIML R 76 Table 3)
    if (form.accuracy === "Class III") {
      if (n.lessThan(500) || n.greaterThan(10000)) {
        return {
          n: n.toString(),
          error: `Class III requires 500 ≤ n ≤ 10,000 divisions (Current n = ${n.toString()}).`,
          isValid: false
        };
      }
    } else if (form.accuracy === "Class IIII") {
      if (n.lessThan(100) || n.greaterThan(1000)) {
        return {
          n: n.toString(),
          error: `Class IIII requires 100 ≤ n ≤ 1,000 divisions (Current n = ${n.toString()}).`,
          isValid: false
        };
      }
    }

    return { n: n.toString(), error: null, isValid: true };
  } catch {
    // Catches incomplete decimal strings while typing (e.g. typing "0.")
    return { n: null, error: null, isValid: false };
  }
}, [form]);

  // 2. Submit Handler
  const submit = async (event) => {
    event.preventDefault();
    if (!validationState.isValid && validationState.error) {
      setServerError(validationState.error);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      // Build FormData for multipart upload (data + image)
      const data = new FormData();
      data.append("manufacturer", form.manufacturer);
      data.append("modelNumber", form.model);
      data.append("serialNumber", form.serial);
      data.append("instrumentType", form.instrumentType);
      data.append("accuracyClass", form.accuracy.replace("Class ", "")); // Send "III" instead of "Class III"
      data.append("unit", form.unit);
      data.append("max", form.maxCapacity);
      data.append("min", form.minCapacity);
      data.append("e", form.verificationStep);
      data.append("d", form.displayStep);

      if (file) {
        data.append("nameplatePhoto", file);
      }

      // Call API
      const response = await RegisterInstrumentApi(data);

      if (response && response.instrumentId) {
        // Redirect to Observation Grid (Screen 2)
        navigate(`/testing/${response.instrumentId}`);
      }
    } catch (err) {
      setServerError(err.response?.data?.error || err.message || "Failed to register instrument.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="registration-page">
      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />
      <section className="registration-shell">
        <div className="eyebrow">
          <span className="status-dot" /> OIML R 76 · METROLOGY PORTAL
        </div>
        <div className="page-heading">
          <div>
            <h1>
              New instrument
              <br />
              <em>registration</em>
            </h1>
            <p>Record the details exactly as shown on the instrument nameplate.</p>
          </div>
          <div className="reference-badge">
            <span>FORM</span>
            <strong>R-76</strong>
            <small>REV. 01 / 2026</small>
          </div>
        </div>

        <form onSubmit={submit}>
          {/* SECTION 1: IDENTITY */}
          <div className="form-section">
            <div className="section-title">
              <span>01</span>
              <div>
                <h2>Identity</h2>
                <p>Instrument identification</p>
              </div>
            </div>
            <div className="field-grid two-col">
              <label>
                Manufacturer name
                <input
                  name="manufacturer"
                  value={form.manufacturer}
                  onChange={update}
                  placeholder="e.g. Avery Weigh-Tronix"
                  required
                />
              </label>
              <label>
                Model number
                <input
                  name="model"
                  value={form.model}
                  onChange={update}
                  placeholder="Enter model number"
                  required
                />
              </label>
              <label>
                Serial number
                <input
                  name="serial"
                  value={form.serial}
                  onChange={update}
                  placeholder="Enter serial number"
                  required
                />
              </label>
              <label>
                Instrument type
                <select
                  name="instrumentType"
                  value={form.instrumentType}
                  onChange={update}
                  required
                >
                  <option value="">Select instrument type</option>
                  <option value="Bench Scale">Bench Scale</option>
                  <option value="Platform Scale">Platform Scale</option>
                  <option value="Counter / Retail Scale">Counter / Retail Scale</option>
                  <option value="Precision / Analytical Balance">Precision / Analytical Balance</option>
                  <option value="Crane / Hanging Scale">Crane / Hanging Scale</option>
                  <option value="Weighbridge / Vehicle Scale">Weighbridge / Vehicle Scale</option>
                </select>
              </label>
            </div>
          </div>

          {/* SECTION 2: METROLOGICAL PARAMETERS */}
          <div className="form-section">
            <div className="section-title">
              <span>02</span>
              <div>
                <h2>Metrological parameters</h2>
                <p>Values from the instrument nameplate</p>
              </div>
            </div>
            <div className="field-grid three-col">
              <label>
                Accuracy class
                <select
                  name="accuracy"
                  value={form.accuracy}
                  onChange={update}
                  required
                >
                  <option value="">Select class</option>
                  <option value="Class I">Class I</option>
                  <option value="Class II">Class II</option>
                  <option value="Class III">Class III</option>
                  <option value="Class IIII">Class IIII</option>
                </select>
              </label>
              <label>
                Unit of measure
                <select
                  name="unit"
                  value={form.unit}
                  onChange={update}
                  required
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="mg">mg</option>
                  <option value="t">t (tonne)</option>
                </select>
              </label>

              {[
                { name: "maxCapacity", label: "Maximum capacity (Max)", placeholder: "150.000" },
                { name: "minCapacity", label: "Minimum capacity (Min)", placeholder: "1.000" },
                { name: "verificationStep", label: "Verification step (e)", placeholder: "0.050" },
                { name: "displayStep", label: "Display step (d)", placeholder: "0.050" },
              ].map(({ name, label, placeholder }) => (
                <label key={name}>
                  {label}
                  <div className="with-unit">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      name={name}
                      value={form[name]}
                      onChange={update}
                      placeholder={placeholder}
                      required
                    />
                    <span>{form.unit || "kg"}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* LIVE OIML TABLE 3 METRICS BADGE */}
            {validationState.n !== null && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "6px", background: validationState.error ? "#FEF2F2" : "#F0FDF4", border: `1px solid ${validationState.error ? "#FECACA" : "#DCFCE7"}` }}>
                <span style={{ fontWeight: 600, color: validationState.error ? "#DC2626" : "#16A34A" }}>
                  Calculated Divisions (n = Max/e): {validationState.n.toLocaleString()}
                </span>
                {validationState.error && (
                  <p style={{ color: "#DC2626", margin: "0.25rem 0 0 0", fontSize: "0.875rem" }}>
                    ⚠ {validationState.error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: ATTACH EVIDENCE */}
          <div className="form-section evidence-section">
            <div className="section-title">
              <span>03</span>
              <div>
                <h2>Attach evidence</h2>
                <p>Upload a clear photo of the nameplate</p>
              </div>
            </div>
            <label className="upload-field">
              Nameplate photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <span className="upload-box">
                ⌁ <b>{file ? file.name : "Choose image"}</b>
                <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PNG, JPG up to 5 MB"}</small>
              </span>
            </label>
          </div>

          {/* SERVER / VALIDATION ERROR BANNER */}
          {serverError && (
            <div style={{ padding: "0.75rem 1rem", background: "#FEF2F2", color: "#DC2626", borderRadius: "6px", border: "1px solid #FECACA", marginBottom: "1rem" }}>
              <strong>Validation Error:</strong> {serverError}
            </div>
          )}

          {/* FOOTER & SUBMIT */}
          <div className="form-footer">
            <p>
              {validationState.isValid
                ? "✓ Parameters meet OIML R 76 requirements."
                : "All fields and valid metrological limits are required before submission."}
            </p>
            <button
              type="submit"
              disabled={loading || (form.maxCapacity && !validationState.isValid)}
              style={{ opacity: loading || (form.maxCapacity && !validationState.isValid) ? 0.6 : 1 }}
            >
              {loading ? "Validating on Server..." : "Validate & initialize test"} <span>→</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
