import { useEffect, useState } from "react";
import { createTestingOfficerApi } from "../../api/authApi";
import { FileText, FlaskConical, MoreVertical, Plus, Search, UserRound, Users } from "lucide-react";
import { useOutletContext } from "react-router-dom";

export const ManageTestingOfficersPage = () => {
  const { setHeaderContent } = useOutletContext();
  const [officerRows, setOfficerRows] = useState(officers);
  const [showAddOfficer, setShowAddOfficer] = useState(false);

  useEffect(() => {
    setHeaderContent({
      title: "Testing Officers",
      subtitle: "Monitor testing officers, their evaluations, and testing progress.",
    });
  }, [setHeaderContent]);

   

    
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

        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">#</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Name</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Assigned Tests</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {officerRows.map((officer) => (
                <tr key={officer.email} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-600">{officer.number}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{officer.name}</td>
                  <td className="px-4 py-3 text-slate-600">{officer.assignedTests}</td>
                  <td className="px-4 py-3"><StatusBadge status={officer.status} /></td>
                  <td className="px-4 py-3"><button type="button" aria-label={`More actions for ${officer.name}`} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><MoreVertical size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {showAddOfficer && <AddOfficerModal onClose={() => setShowAddOfficer(false)} onCreated={(officer) => setOfficerRows((rows) => [{ number: rows.length + 1, name: officer.name, assignedTests: 0, status: "Active", email: officer.email }, ...rows])} />}
    </section>
  );
};

function AddOfficerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSaving(true);
    try { const response = await createTestingOfficerApi(form); onCreated(response.officer); onClose(); }
    catch (requestError) { setError(requestError.message || "Unable to create officer."); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><h3 className="m-0 text-lg font-bold text-slate-900">Add Testing Officer</h3><p className="mt-1 text-xs text-slate-500">The account will be created with the Testing Officer role.</p></div><button type="button" onClick={onClose} className="text-xl text-slate-400">×</button></div>
      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
      <label className="mt-5 block text-xs font-bold text-slate-600">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="!m-0 !mt-2 !h-10 !text-sm" placeholder="officer@example.com" /></label>
      <label className="mt-4 block text-xs font-bold text-slate-600">Password<input required minLength={6} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="!m-0 !mt-2 !h-10 !text-sm" placeholder="At least 6 characters" /></label>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button><button disabled={saving} type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? "Creating..." : "Create Officer"}</button></div>
    </form>
  </div>;
}

const officers = [
  { number: 1, name: "Rahul Sharma", assignedTests: 3, status: "Active" },
  { number: 2, name: "Aisha Khan", assignedTests: 5, status: "Active" },
  { number: 3, name: "Amit Patil", assignedTests: 2, status: "In Testing" },
  { number: 4, name: "Sneha More", assignedTests: 0, status: "Inactive" },
  { number: 5, name: "Vikram Joshi", assignedTests: 4, status: "Active" },
];

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
