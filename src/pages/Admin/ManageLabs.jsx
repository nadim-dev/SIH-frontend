import { useEffect, useState } from "react";
import { Building2, MapPin, Plus, Users, UserRoundCheck } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { createLaboratoryApi, getLaboratoriesApi, updateLaboratoryStatusApi } from "../../api/authApi";

const emptySummary = { totalLabs: 0, activeLabs: 0, inactiveLabs: 0, totalOfficers: 0 };

export const ManageLabs = () => {
  const { setHeaderContent } = useOutletContext();
  const [laboratories, setLaboratories] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setHeaderContent({ title: "Laboratories", subtitle: "Manage registered laboratories, supervisors and laboratory status." });
  }, [setHeaderContent]);

  const loadLaboratories = async () => {
    setLoading(true);
    try {
      const response = await getLaboratoriesApi();
      setLaboratories(Array.isArray(response?.data) ? response.data : []);
      setSupervisors(Array.isArray(response?.supervisors) ? response.supervisors : []);
      setSummary(response?.summary || emptySummary);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load laboratories.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadLaboratories(); }, []);

  const toggleStatus = async (laboratory) => {
    try {
      await updateLaboratoryStatusApi(laboratory._id, laboratory.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      await loadLaboratories();
    } catch (requestError) { setError(requestError.message || "Unable to update laboratory status."); }
  };

  return <main className="px-1 pb-8">
    {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
    <div className="grid grid-cols-1 gap-4 min-[701px]:grid-cols-2 min-[1100px]:grid-cols-4">
      <SummaryCard label="Total Labs" value={summary.totalLabs} description="Registered laboratories" icon={Building2} tone="blue" />
      <SummaryCard label="Active Labs" value={summary.activeLabs} description="Currently operational" icon={UserRoundCheck} tone="green" />
      <SummaryCard label="Inactive Labs" value={summary.inactiveLabs} description="Currently unavailable" icon={Building2} tone="amber" />
      <SummaryCard label="Total Officers" value={summary.totalOfficers} description="Assigned testing officers" icon={Users} tone="red" />
    </div>
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(23,32,51,0.04)]">
      <div className="flex items-center justify-between gap-4"><div><h2 className="m-0 text-xl font-bold text-[#0f1b39]">Registered Laboratories</h2><p className="mt-1 text-xs text-slate-500">Review laboratory ownership, officer capacity and availability.</p></div><button type="button" onClick={() => setShowAdd(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1d4ed8]"><Plus size={16} strokeWidth={2.5} /> Add Laboratory</button></div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[720px] border-collapse text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="border-b border-slate-200 px-4 py-3 font-bold">#</th><th className="border-b border-slate-200 px-4 py-3 font-bold">Laboratory</th><th className="border-b border-slate-200 px-4 py-3 font-bold">Location</th><th className="border-b border-slate-200 px-4 py-3 font-bold">Supervisor</th><th className="border-b border-slate-200 px-4 py-3 font-bold">Officers</th><th className="border-b border-slate-200 px-4 py-3 font-bold">Status</th><th className="border-b border-slate-200 px-4 py-3 font-bold">Action</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Loading laboratories...</td></tr> : laboratories.length === 0 ? <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">No laboratories registered yet.</td></tr> : laboratories.map((laboratory, index) => <tr key={laboratory._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="px-4 py-3 text-slate-600">{String(index + 1).padStart(2, "0")}</td><td className="px-4 py-3 font-semibold text-slate-800">{laboratory.name}</td><td className="px-4 py-3 text-slate-600"><span className="inline-flex items-center gap-1.5"><MapPin size={13} />{laboratory.location}</span></td><td className="px-4 py-3 text-slate-600">{laboratory.supervisorId?.name || "—"}</td><td className="px-4 py-3 font-semibold text-slate-700">{laboratory.officerCount || 0}</td><td className="px-4 py-3"><StatusBadge status={laboratory.status} /></td><td className="px-4 py-3"><button type="button" onClick={() => toggleStatus(laboratory)} className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50">{laboratory.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td></tr>)}
      </tbody></table></div>
    </section>
    {showAdd && <AddLaboratoryModal supervisors={supervisors} onClose={() => setShowAdd(false)} onCreated={async () => { setShowAdd(false); await loadLaboratories(); }} />}
  </main>;
};

function AddLaboratoryModal({ supervisors, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", location: "", supervisorId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { await createLaboratoryApi(form); await onCreated(); } catch (requestError) { setError(requestError.message || "Unable to create laboratory."); } finally { setSaving(false); } };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h3 className="m-0 text-lg font-bold text-slate-900">Add Laboratory</h3><p className="mt-1 text-xs text-slate-500">Register a laboratory and assign its supervisor.</p></div><button type="button" onClick={onClose} className="cursor-pointer text-xl text-slate-400">×</button></div>{error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}<label className="mt-5 block text-xs font-bold text-slate-600">Laboratory name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="!m-0 !mt-2 !h-10 !text-sm" placeholder="Maharashtra Lab" /></label><label className="mt-4 block text-xs font-bold text-slate-600">Location<input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="!m-0 !mt-2 !h-10 !text-sm" placeholder="Mumbai" /></label><label className="mt-4 block text-xs font-bold text-slate-600">Supervisor<select value={form.supervisorId} onChange={(event) => setForm({ ...form, supervisorId: event.target.value })} className="!m-0 !mt-2 !h-10 !w-full !text-sm"><option value="">Select supervisor</option>{supervisors.map((supervisor) => <option key={supervisor._id} value={supervisor._id}>{supervisor.name}</option>)}</select></label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button><button disabled={saving} type="submit" className="cursor-pointer rounded-md bg-[#2563eb] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Create Laboratory"}</button></div></form></div>;
}

function StatusBadge({ status }) { const active = status === "ACTIVE"; return <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><i className={`h-2 w-2 rounded-full ${active ? "bg-emerald-600" : "bg-red-600"}`} />{active ? "Active" : "Inactive"}</span>; }

const toneStyles = { blue: "!border-[#d6e7ff] !bg-gradient-to-br !from-[#f4f9ff] !to-[#edf6ff]", green: "!border-[#d8f0e1] !bg-gradient-to-br !from-[#f3fcf6] !to-[#eefaf3]", amber: "!border-[#f8e6be] !bg-gradient-to-br !from-[#fffaf0] !to-[#fff8ed]", red: "!border-[#f5d9df] !bg-gradient-to-br !from-[#fff7f8] !to-[#fff1f4]" };
function SummaryCard({ label, value, description, icon: Icon, tone }) { return <article className={`!relative !flex !min-h-0 !flex-col !rounded-[13px] !border !p-4 !shadow-[0_6px_16px_rgba(23,32,51,0.04)] ${toneStyles[tone]}`}><div className="!flex !items-start !gap-3"><div className="!grid !h-10 !w-10 !shrink-0 !place-items-center !rounded-[13px] !bg-white/60 !text-[#2563eb]"><Icon size={23} strokeWidth={2.3} /></div><div className="!min-w-0"><h2 className="!m-0 !text-[13px] !leading-tight !text-[#0f1b39] font-semibold">{label}</h2><strong className="!mt-2 !block !text-[1.5rem] !font-bold !leading-none !tracking-[-1px] !text-[#172033]">{value}</strong><p className="!m-0 !mt-[6px] !text-[10px] !leading-tight !text-[#596b85]">{description}</p></div></div></article>; }
