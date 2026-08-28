import { useState } from 'react';

const initialForm = { manufacturer: '', model: '', serial: '', instrumentType: '', accuracy: '', unit: '', maxCapacity: '', minCapacity: '', verificationStep: '', displayStep: '' };

export const InstrumentRegister = () => {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const submit = (event) => { event.preventDefault(); setSubmitted(true); };
  return <main className="registration-page"><div className="ambient-glow glow-one" /><div className="ambient-glow glow-two" /><section className="registration-shell">
    <div className="eyebrow"><span className="status-dot" /> OIML R 76 · METROLOGY PORTAL</div>
    <div className="page-heading"><div><h1>New instrument<br /><em>registration</em></h1><p>Record the details exactly as shown on the instrument nameplate.</p></div><div className="reference-badge"><span>FORM</span><strong>R-76</strong><small>REV. 01 / 2026</small></div></div>
    <form onSubmit={submit}>
      <div className="form-section"><div className="section-title"><span>01</span><div><h2>Identity</h2><p>Instrument identification</p></div></div><div className="field-grid two-col">
        <label>Manufacturer name<input name="manufacturer" value={form.manufacturer} onChange={update} placeholder="e.g. Avery Weigh-Tronix" required /></label><label>Model number<input name="model" value={form.model} onChange={update} placeholder="Enter model number" required /></label><label>Serial number<input name="serial" value={form.serial} onChange={update} placeholder="Enter serial number" required /></label><label>Instrument type<select name="instrumentType" value={form.instrumentType} onChange={update} required><option value="">Select instrument type</option><option>Platform Scale</option><option>Bench Scale</option></select></label>
      </div></div>
      <div className="form-section"><div className="section-title"><span>02</span><div><h2>Metrological parameters</h2><p>Values from the instrument nameplate</p></div></div><div className="field-grid three-col">
        <label>Accuracy class<select name="accuracy" value={form.accuracy} onChange={update} required><option value="">Select class</option><option>Class I</option><option>Class II</option><option>Class III</option><option>Class IIII</option></select></label><label>Unit of measure<select name="unit" value={form.unit} onChange={update} required><option value="">Select unit</option><option>kg</option><option>g</option><option>lb</option></select></label>
        {['maxCapacity','minCapacity','verificationStep','displayStep'].map((name) => <label key={name}>{({ maxCapacity: 'Maximum capacity (Max)', minCapacity: 'Minimum capacity (Min)', verificationStep: 'Verification step (e)', displayStep: 'Display step (d)' })[name]}<div className="with-unit"><input type="number" min="0" step="any" name={name} value={form[name]} onChange={update} placeholder={name === 'maxCapacity' ? '150.000' : name === 'minCapacity' ? '1.000' : '0.050'} required /><span>{form.unit || 'kg'}</span></div></label>)}
      </div></div>
      <div className="form-section evidence-section"><div className="section-title"><span>03</span><div><h2>Attach evidence</h2><p>Upload a clear photo of the nameplate</p></div></div><label className="upload-field">Nameplate photo<input type="file" accept="image/*" required /><span className="upload-box">⌁ <b>Choose image</b><small>PNG, JPG up to 10 MB</small></span></label></div>
      <div className="form-footer"><p>{submitted ? '✓ Instrument details validated successfully.' : 'All fields are required before validation.'}</p><button type="submit">Validate &amp; initialize test <span>→</span></button></div>
    </form>
  </section></main>;
};
