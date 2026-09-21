import { useEffect, useState } from "react";
import { activateTestingOfficerApi, createTestingOfficerApi, deactivateTestingOfficerApi, deleteTestingOfficerApi, getTestingOfficersApi } from "../../api/authApi";
import { Activity, Ban, Eye, EyeOff, FileText, FlaskConical, MoreVertical, Plus, Search, Trash2, UserRound, Users } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import getInitials from "../../utils/getInitial";

export const ManageTestingOfficersPage = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [officerRows, setOfficerRows] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [deletingOfficer, setDeletingOfficer] = useState(false);

  useEffect(() => {
    setHeaderContent({
      title: "Testing Officers",
      subtitle: "Monitor testing officers, their evaluations, and testing progress.",
    });
  }, [setHeaderContent]);

  useEffect(() => {
    const loadTestingOfficers = async () => {
      try {
        const response = await getTestingOfficersApi();
        setOfficerRows(response.officers || []);
      } catch (error) {
        console.error("Unable to load testing officers:", error);
      } finally {
        setLoadingOfficers(false);
      }
    };

    loadTestingOfficers();
  }, []);

  const handleDeactivate = async (officer) => {
    if (!window.confirm(`Deactivate ${officer.name}?`)) return;
    try {
      await deactivateTestingOfficerApi(officer._id);
      setOfficerRows((rows) => rows.map((row) => getOfficerKey(row) === getOfficerKey(officer) ? { ...row, status: "Inactive" } : row));
      setSelectedOfficer(null);
    } catch (error) {
      window.alert(error.message || "Unable to deactivate testing officer.");
    }
  };

  const handleActivate = async (officer) => {
    if (!window.confirm(`Activate ${officer.name}?`)) return;
    try {
      await activateTestingOfficerApi(officer._id);
      setOfficerRows((rows) => rows.map((row) => getOfficerKey(row) === getOfficerKey(officer) ? { ...row, status: "Active" } : row));
      setSelectedOfficer(null);
    } catch (error) {
      window.alert(error.message || "Unable to activate testing officer.");
    }
  };

   

    
  return (
    <section className="px-1">
      <div className="grid grid-cols-1 gap-4 min-[701px]:grid-cols-2 min-[1100px]:grid-cols-4">
        <SummaryCard label="Total Officers" value="12" description="Registered in the system" icon={Users} tone="blue" />
        <SummaryCard label="Active Officers" value="8" description="Currently active accounts"  icon={UserRound} tone="green" />
        <SummaryCard label="In Testing" value="3" description="Currently executing tests"  icon={FlaskConical} tone="amber" />
        <SummaryCard label="Pending Review" value="5" description="Awaiting supervisor review"  icon={FileText} tone="red" />
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(23,32,51,0.04)]">
        <h2 className="m-0 text-xl font-bold text-[#0f1b39]">All Testing Officers</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" placeholder="Search officers..." className="!m-0 !h-9 !rounded-md !border-slate-200 !pl-9 !text-xs" />
          </label>
          <select className="!m-0 !h-9 !w-[165px] !rounded-md !border-slate-200 !text-sm" defaultValue="all" aria-label="Filter by status">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="testing">In Testing</option>
          </select>
          <button type="button" onClick={() => setShowAddOfficer(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1d4ed8]">
            <Plus size={16} strokeWidth={2.5} /> Add Officer
          </button>
        </div>

        <div className="mt-5 overflow-visible rounded-lg border border-slate-200">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">#</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Name</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Officer ID</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Assigned Tests</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingOfficers ? <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Loading testing officers...</td></tr> : officerRows.length === 0 ? <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">No testing officers found.</td></tr> : officerRows.map((officer) => (
                <tr key={officer.email} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-600">{officer.number}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5 font-semibold text-slate-800"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100">{getInitials(officer.name)}</span>{officer.name}</div></td>
                  <td className="px-4 py-3 font-medium text-slate-600">{officer.officerId}</td>
                  <td className="px-4 py-3 text-slate-600">{officer.assignedTests}</td>
                  <td className="px-4 py-3"><StatusBadge status={officer.status} /></td>
                  <td className="relative px-4 py-3"><button type="button" onClick={() => setSelectedOfficer(getOfficerKey(selectedOfficer) === getOfficerKey(officer) ? null : officer)} aria-label={`More actions for ${officer.name}`} className="cursor-pointer rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><MoreVertical size={15} /></button>{getOfficerKey(selectedOfficer) === getOfficerKey(officer) && <OfficerActionsModal officer={officer} deleting={deletingOfficer} onMonitor={() => { setSelectedOfficer(null); navigate(`/testing-person/dashboard?officerId=${encodeURIComponent(officer._id)}`); }} onDeactivate={() => handleDeactivate(officer)} onActivate={() => handleActivate(officer)} onDelete={async () => { if (!window.confirm(`Delete ${officer.name} permanently?`)) return; try { setDeletingOfficer(true); await deleteTestingOfficerApi(officer._id); setOfficerRows((rows) => rows.filter((row) => getOfficerKey(row) !== getOfficerKey(officer))); setSelectedOfficer(null); } catch (error) { window.alert(error.message || "Unable to delete testing officer."); } finally { setDeletingOfficer(false); } }} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {showAddOfficer && <AddOfficerModal onClose={() => setShowAddOfficer(false)} onCreated={(officer) => setOfficerRows((rows) => [{ number: 1, _id: officer._id, name: officer.name, officerId: officer.officerId, assignedTests: 0, status: "Active", email: officer.email }, ...rows.map((row, index) => ({ ...row, number: index + 2 }))])} />}
    </section>
  );
};

function OfficerActionsModal({ officer, onMonitor, onDelete, onDeactivate, onActivate, deleting }) {
  const options = [
    { label: "Monitor Activity", icon: Activity, color: "text-blue-600" },
    { label: officer.status === "Inactive" ? "Activate Officer" : "Deactivate Officer", icon: Ban, color: "text-amber-600" },
    { label: "Delete Permanently", icon: Trash2, color: "text-red-600" },
  ];
  return <div className="absolute right-3 top-[calc(100%-4px)] z-30 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
    <div>{options.map(({ label, icon: Icon, color }) => <button type="button" key={label} disabled={deleting && label === "Delete Permanently"} onClick={label === "Monitor Activity" ? onMonitor : label === "Deactivate Officer" ? onDeactivate : label === "Activate Officer" ? onActivate : label === "Delete Permanently" ? onDelete : undefined} className="flex w-full cursor-pointer items-center gap-2 rounded-md p-1.5 text-left text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 ${color}`}><Icon size={14} /></span><strong className="text-[11px]">{deleting && label === "Delete Permanently" ? "Deleting..." : label}</strong></button>)}</div>
  </div>;
}

function getOfficerKey(officer) {
  return officer ? officer.officerId || officer.email || officer.name : null;
}

function AddOfficerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSaving(true);
    try { const response = await createTestingOfficerApi(form); onCreated(response.officer); onClose(); }
    catch (requestError) { setError(requestError.message || "Unable to create officer."); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><h3 className="m-0 text-lg font-bold text-slate-900">Add Testing Officer</h3><p className="mt-1 text-xs text-slate-500">Enter the officer’s login credentials to create their account.</p></div><button type="button" onClick={onClose} className="text-xl text-slate-400">×</button></div>
      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
      <label className="mt-5 block text-xs font-bold text-slate-600">Name<input required minLength={2} type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="!m-0 !mt-2 !h-10 !text-sm" placeholder="Testing officer name" /></label>
      <label className="mt-4 block text-xs font-bold text-slate-600">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="!m-0 !mt-2 !h-10 !text-sm" placeholder="officer@example.com" /></label>
      <label className="mt-4 block text-xs font-bold text-slate-600">Password<div className="relative mt-2"><input required minLength={6} type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="!m-0 !h-10 !w-full !pr-10 !text-sm" placeholder="At least 6 characters" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button><button disabled={saving} type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? "Creating..." : "Create Officer"}</button></div>
    </form>
  </div>;
}


function StatusBadge({ status }) {
  const styles = { "In Testing": "bg-amber-50 text-amber-700", Inactive: "bg-red-50 text-red-700" }[status] || "bg-emerald-50 text-emerald-700";
  const dot = { "In Testing": "bg-amber-600", Inactive: "bg-red-600" }[status] || "bg-emerald-600";
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold ${styles}`}><i className={`h-2 w-2 rounded-full ${dot}`} />{status}</span>;
}

function SummaryCard({ label, value, description, icon: Icon, tone }) {
  return (
    <article className={`!relative !flex  !min-h-0 !flex-col !rounded-[13px] !border !p-4 !shadow-[0_6px_16px_rgba(23,32,51,0.04)] ${toneStyles[tone]}`}>
      <div className="!flex !items-start !gap-3">
        <div className={`!grid !h-10 !w-10 !shrink-0 !place-items-center !rounded-[13px] ${iconStyles[tone]}`}><Icon size={23} strokeWidth={2.3} /></div>
        <div className="!min-w-0">
          <h2 className="!m-0 !text-[13px] !leading-tight !text-[#0f1b39] font-semibold">{label}</h2>
          <strong className="!mt-2 !block !text-[1.5rem] !font-bold !leading-none !tracking-[-1px]">{value}</strong>
          <p className="!m-0 !mt-[6px] !text-[10px] !leading-tight !text-[#596b85]">{description}</p>
        </div>
      </div>
    </article>
  );
}

const toneStyles = {
  blue: "!border-[#d6e7ff] !bg-gradient-to-br !from-[#f4f9ff] !to-[#edf6ff] !text-[#125bc2]",
  green: "!border-[#d8f0e1] !bg-gradient-to-br !from-[#f3fcf6] !to-[#eefaf3] !text-[#087850]",
  amber: "!border-[#f8e6be] !bg-gradient-to-br !from-[#fffaf0] !to-[#fff8ed] !text-[#c66b00]",
  red: "!border-[#f5d9df] !bg-gradient-to-br !from-[#fff7f8] !to-[#fff1f4] !text-[#ae2632]",
};

const iconStyles = {
  blue: "!bg-[#dcecff]",
  green: "!bg-[#dcf7e8]",
  amber: "!bg-[#fff0d4]",
  red: "!bg-[#ffe0e6]",
};
