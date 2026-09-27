import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Building2, Check, ImagePlus, LockKeyhole, MapPin, Save, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { getMyLaboratoryProfileApi, updateMyLaboratoryProfileApi } from "../api/authApi.js";

const fields = [
  ["officialEmail", "Official Email", "email"],
  ["contactNumber", "Contact Number", "tel"],
  ["address", "Address", "textarea"],
  ["city", "City", "text"],
  ["state", "State", "text"],
  ["pinCode", "PIN Code", "text"],
];

export default function SupervisorLaboratoryProfile() {
  const { setHeaderContent } = useOutletContext();
  const [laboratory, setLaboratory] = useState(null);
  const [form, setForm] = useState({});
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [compressingLogo, setCompressingLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setHeaderContent?.({ title: "Laboratory Profile", subtitle: "Manage your laboratory details and official logo." });
  }, [setHeaderContent]);

  useEffect(() => {
    let active = true;
    getMyLaboratoryProfileApi().then((response) => {
      if (!active) return;
      setLaboratory(response.data);
      setForm(Object.fromEntries(fields.map(([key]) => [key, response.data?.[key] || ""])));
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Unable to load the laboratory profile.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => () => { if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview); }, [logoPreview]);

  const selectLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
      setError("Choose a valid image smaller than 15 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setCompressingLogo(true);
    try {
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
      setLogo(compressedFile);
      setLogoPreview(URL.createObjectURL(compressedFile));
    } catch (compressionError) {
      setError(compressionError.message || "Could not prepare the selected logo image.");
    } finally {
      setCompressingLogo(false);
      event.target.value = "";
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await updateMyLaboratoryProfileApi({ ...form, logo });
      setLaboratory(response.data);
      setForm(Object.fromEntries(fields.map(([key]) => [key, response.data?.[key] || ""])));
      setLogo(null); setLogoPreview(""); setNotice("Laboratory profile saved successfully.");
    } catch (requestError) { setError(requestError.message || "Unable to save laboratory details."); }
    finally { setSaving(false); }
  };

  const cancelLogo = () => { setLogo(null); setLogoPreview(""); };

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading laboratory profile…</div>;
  if (!laboratory && error) return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;

  return <form onSubmit={saveProfile} className="space-y-3">
    {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700"><Check size={15} />{notice}</div>}

    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-blue-100 text-blue-700"><Building2 size={19} /></span>
        <div className="min-w-0 flex-1"><h2 className="m-0 text-sm font-bold text-slate-900">Registered laboratory identity</h2><p className="m-0 mt-0.5 text-[11px] text-slate-500">Core identity is managed by your administrator. Contact and location details can be updated below.</p></div>
        <span className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 sm:inline-flex"><LockKeyhole size={12} />Read only</span>
      </header>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {[['Laboratory Name', laboratory.name], ['Laboratory Code', laboratory.code], ['Laboratory Type', laboratory.type]].map(([label, value]) => <div key={label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5"><span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span><strong className="mt-1 block text-xs font-semibold text-slate-800">{value || '—'}</strong></div>)}
      </div>
    </section>

    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-50 text-emerald-700"><MapPin size={18} /></span>
        <div><h2 className="m-0 text-sm font-bold text-slate-900">Contact &amp; location</h2><p className="m-0 mt-0.5 text-[11px] text-slate-500">Keep your public contact details and address current.</p></div>
      </header>
      <div className="grid items-start gap-4 p-4 lg:grid-cols-3">
        <div className="grid content-start gap-x-4 gap-y-3 sm:grid-cols-2 lg:col-span-2">
          {fields.map(([key, label, type]) => <label key={key} className={`block text-[11px] font-semibold text-slate-700 ${key === "address" ? "sm:col-span-2" : ""}`}>
            {label} <i className="not-italic text-red-500">*</i>
            {type === "textarea" ? <textarea required rows={2} value={form[key] || ""} onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))} className="!m-0 !mt-1 !w-full !rounded-md !border !border-solid !border-slate-300 !bg-white !px-3 !py-2 !text-xs focus:!border-blue-500 focus:!outline-none focus:!ring-2 focus:!ring-blue-100" /> : <input required type={type} value={form[key] || ""} onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))} className="!m-0 !mt-1 !h-9 !w-full !rounded-md !border-slate-300 !px-3 !text-xs focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-100" />}
          </label>)}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 lg:col-span-1">
          <div className="flex items-center justify-between"><h3 className="m-0 text-xs font-bold text-slate-800">Laboratory Logo</h3><ImagePlus size={16} className="text-blue-600" /></div>
          <p className="mb-3 mt-1 text-[10px] leading-4 text-slate-500">Shown with your laboratory across the system.</p>
          <div className="grid h-32 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white p-3">
            {(logoPreview || laboratory.logoUrl) ? <img src={logoPreview || laboratory.logoUrl} alt="Laboratory logo preview" className="max-h-full max-w-full object-contain" /> : <div className="text-center text-slate-400"><Building2 size={34} className="mx-auto mb-2 text-slate-300" /><span className="text-[10px]">No logo uploaded</span></div>}
          </div>
          <label className={`mt-3 flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-blue-200 bg-white px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-50 ${compressingLogo ? "pointer-events-none cursor-wait opacity-60" : ""}`}><ImagePlus size={15} className="shrink-0" />{compressingLogo ? "Optimizing image…" : logo ? "Choose another logo" : "Upload or replace logo"}<input type="file" accept="image/*" onChange={selectLogo} disabled={compressingLogo} className="!hidden" /></label>
          <p className="mb-0 mt-2 text-center text-[9px] text-slate-500">Image is compressed before upload · Up to 15 MB</p>
          {logo && <p className="mb-0 mt-1 truncate text-center text-[9px] font-medium text-emerald-700">Ready · {(logo.size / 1024).toFixed(0)} KB</p>}
          {logo && <button type="button" onClick={cancelLogo} className="mt-2 inline-flex w-full items-center justify-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800"><X size={13} />Remove selected file</button>}
        </aside>
      </div>
    </section>

    <footer className="flex justify-end gap-2 border-t border-slate-200 pt-4">
      <button type="button" onClick={() => { setForm(Object.fromEntries(fields.map(([key]) => [key, laboratory?.[key] || ""]))); cancelLogo(); setError(""); setNotice(""); }} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Reset</button>
      <button type="submit" disabled={saving || compressingLogo} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><Save size={14} />{saving ? "Saving…" : compressingLogo ? "Preparing logo…" : "Save Laboratory Profile"}</button>
    </footer>
  </form>;
}
