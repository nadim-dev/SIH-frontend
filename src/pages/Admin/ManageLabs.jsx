import { useEffect, useState } from "react";
import { Ban, Building2, ChevronDown, MapPin, MoreVertical, Plus, Search, Trash2, Users, UserRoundCheck } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  createLaboratoryApi,
  deleteLaboratoryApi,
  getLaboratoriesApi,
  updateLaboratoryStatusApi,
} from "../../api/authApi";

const emptySummary = {
  totalLabs: 0,
  activeLabs: 0,
  inactiveLabs: 0,
  totalOfficers: 0,
};

export const ManageLabs = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [laboratories, setLaboratories] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
  const [selectedLaboratory, setSelectedLaboratory] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  useEffect(() => {
    setHeaderContent({
      title: "Laboratories",
      subtitle:
        "Manage registered laboratories, supervisors and laboratory status.",
    });
  }, [setHeaderContent]);

  const loadLaboratories = async () => {
    setLoading(true);
    try {
      const response = await getLaboratoriesApi();
      setLaboratories(Array.isArray(response?.data) ? response.data : []);
      setSupervisors(
        Array.isArray(response?.supervisors) ? response.supervisors : [],
      );
      setSummary(response?.summary || emptySummary);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load laboratories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLaboratories();
  }, []);

  const visibleLaboratories = laboratories.filter((laboratory) => {
    const status = laboratory.status || "ACTIVE";
    return `${laboratory.name || ""} ${laboratory.location || ""} ${laboratory.code || ""}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "All Status" || status === statusFilter);
  });

  const toggleStatus = async (laboratory) => {
    try {
      await updateLaboratoryStatusApi(
        laboratory._id,
        laboratory.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      );
      await loadLaboratories();
    } catch (requestError) {
      setError(requestError.message || "Unable to update laboratory status.");
    }
  };

  const deleteLaboratory = async (laboratory) => {
    if (!window.confirm(`Delete ${laboratory.name} permanently? This will also remove its supervisor account.`)) return;
    try {
      await deleteLaboratoryApi(laboratory._id);
      setSelectedLaboratory(null);
      await loadLaboratories();
    } catch (requestError) {
      setError(requestError.message || "Unable to delete laboratory.");
    }
  };

  return (
    <main className="px-1 pb-8">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 min-[701px]:grid-cols-2 min-[1100px]:grid-cols-4">
        <SummaryCard
          label="Total Labs"
          value={summary.totalLabs}
          description="Registered laboratories"
          icon={Building2}
          tone="blue"
        />
        <SummaryCard
          label="Active Labs"
          value={summary.activeLabs}
          description="Currently operational"
          icon={UserRoundCheck}
          tone="green"
        />
        <SummaryCard
          label="Inactive Labs"
          value={summary.inactiveLabs}
          description="Currently unavailable"
          icon={Building2}
          tone="amber"
        />
        <SummaryCard
          label="Testing Officers"
          value={summary.totalOfficers}
          description="Assigned testing officers"
          icon={Users}
          tone="red"
        />
      </div>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(23,32,51,0.04)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="m-0 text-xl font-bold text-[#0f1b39]">
              Registered Laboratories
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Review laboratory ownership, officer capacity and availability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/laboratories/add")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1d4ed8]"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Laboratory
          </button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3"><label className="relative min-w-[220px] flex-1"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search laboratories..." className="!m-0 !h-10 !rounded-md !border-slate-200 !pl-9 !text-xs" /></label><label className="relative flex h-10 w-[165px] items-center"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="!m-0 !h-full !w-full !appearance-none !rounded-md !border-slate-200 !bg-white !px-4 !text-sm !font-semibold !text-slate-700"><option>All Status</option><option>ACTIVE</option><option>INACTIVE</option></select><ChevronDown size={16} className="pointer-events-none absolute right-3 text-slate-500" /></label></div>
        <div className="mt-5 overflow-visible rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">
                  #
                </th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">
                  Laboratory
                </th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">
                  Location
                </th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">
                  Supervisor
                </th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">
                  Officers
                </th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">
                  Status
                </th>
                <th className="border-b border-slate-200 px-4 py-3 font-bold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading laboratories...
                  </td>
                </tr>
              ) : visibleLaboratories.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No laboratories registered yet.
                  </td>
                </tr>
              ) : (
                visibleLaboratories.map((laboratory, index) => (
                  <tr
                    key={laboratory._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {laboratory.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} />
                        {laboratory.location}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {laboratory.supervisorId?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {laboratory.officerCount || 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={laboratory.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block"><button type="button" onClick={() => setSelectedLaboratory(selectedLaboratory?._id === laboratory._id ? null : laboratory)} className="cursor-pointer rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><MoreVertical size={15} /></button>{selectedLaboratory?._id === laboratory._id && <LaboratoryActions laboratory={laboratory} onView={() => { setSelectedLaboratory(null); navigate(`/supervisor/testing-officers?labId=${encodeURIComponent(laboratory._id)}`); }} onToggle={() => { setSelectedLaboratory(null); toggleStatus(laboratory); }} onDelete={() => deleteLaboratory(laboratory)} />}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {showAdd && (
        <AddLaboratoryModal
          supervisors={supervisors}
          onClose={() => setShowAdd(false)}
          onCreated={async () => {
            setShowAdd(false);
            await loadLaboratories();
          }}
        />
      )}
    </main>
  );
};

export const AddLaboratory = () => {
  const { setHeaderContent } = useOutletContext();
  useEffect(() => {
    setHeaderContent({
      title: "Add Laboratory",
      subtitle: "Create a laboratory and assign its supervisor.",
    });
  }, [setHeaderContent]);
  return (
    <main className="laboratory-page px-1 ">
      <style>{`.laboratory-page h3,.laboratory-page h3 + p{display:none!important}`}</style>
      <AddLaboratoryModal
        onClose={() => window.history.back()}
        onCreated={() => window.history.back()}
      />
    </main>
  );
};



function AddLaboratoryModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "Maharashtra Legal Metrology Laboratory",
    code: "MH-LAB-001",
    type: "State Legal Metrology Laboratory",
    address: "Legal Metrology Bhavan, Fort",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    officialEmail: "lab@example.gov.in",
    contactNumber: "+91 98765 43210",
    supervisorName: "Rahul Sharma",
    supervisorEmail: "rahul@example.gov.in",
    supervisorPhone: "+91 98765 43211",
    password: "Rahul@12345",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createLaboratoryApi(form);
      await onCreated();
    } catch (requestError) {
      setError(requestError.message || "Unable to create laboratory.");
    } finally {
      setSaving(false);
    }
  };
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const fields = [
    ["name", "Laboratory Name"],
    ["code", "Laboratory Code"],
    ["address", "Address"],
    ["city", "City"],
    ["state", "State"],
    ["pinCode", "PIN Code"],
    ["officialEmail", "Official Email"],
    ["contactNumber", "Contact Number"],
    ["supervisorName", "Full Name"],
    ["supervisorEmail", "Email"],
    ["supervisorPhone", "Phone Number"],
    ["password", "Password"],
  ];
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 p-4">
      <form
        onSubmit={submit}
        className="mx-auto my-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add Laboratory</h3>
            <p className="mt-1 text-xs text-slate-500">
              Create a laboratory and assign its supervisor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-xl text-slate-400"
          >
            ×
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}
        <h4 className="mt-5 border-b pb-2 text-xs font-bold uppercase text-slate-500">
          Laboratory Details
        </h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {fields.slice(0, 8).map(([key, label]) => (
            <label key={key} className="text-xs font-bold text-slate-600">
              {label}
              <input
                required
                type={
                  key.includes("Email") || key === "officialEmail"
                    ? "email"
                    : "text"
                }
                value={form[key]}
                onChange={(event) => set(key, event.target.value)}
                className="!m-0 !mt-1.5 !h-10 !text-sm"
              />
            </label>
          ))}
          <label className="text-xs font-bold text-slate-600 sm:col-span-2">
            Laboratory Type
            <select
              value={form.type}
              onChange={(event) => set("type", event.target.value)}
              className="!m-0 !mt-1.5 !h-10 !w-full !text-sm"
            >
              <option>State Legal Metrology Laboratory</option>
              <option>Regional Legal Metrology Laboratory</option>
            </select>
          </label>
        </div>
        <h4 className="mt-6 border-b pb-2 text-xs font-bold uppercase text-slate-500">
          Supervisor Details
        </h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {fields.slice(8).map(([key, label]) => (
            <label key={key} className="text-xs font-bold text-slate-600">
              {label}
              <input
                required
                minLength={key === "password" ? 6 : undefined}
                type={
                  key.includes("Email")
                    ? "email"
                    : key === "password"
                      ? "password"
                      : "text"
                }
                value={form[key]}
                onChange={(event) => set(key, event.target.value)}
                className="!m-0 !mt-1.5 !h-10 !text-sm"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border px-4 py-2 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            type="submit"
            className="cursor-pointer rounded-md bg-[#2563eb] px-4 py-2 text-xs font-bold text-white"
          >
            {saving ? "Saving..." : "Create Laboratory"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LaboratoryActions({ laboratory, onView, onToggle, onDelete }) {
  const options = [
    { label: "View Laboratory", icon: Building2, color: "text-blue-600", onClick: onView },
    { label: laboratory.status === "ACTIVE" ? "Deactivate Laboratory" : "Activate Laboratory", icon: Ban, color: "text-amber-600", onClick: onToggle },
    { label: "Delete Permanently", icon: Trash2, color: "text-red-600", onClick: onDelete },
  ];
  return <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{options.map(({ label, icon: Icon, color, onClick }) => <button type="button" key={label} onClick={onClick} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-slate-700 hover:bg-slate-100"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 ${color}`}><Icon size={14} /></span><strong className="text-[11px]">{label}</strong></button>)}</div>;
}

function StatusBadge({ status }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
    >
      <i
        className={`h-2 w-2 rounded-full ${active ? "bg-emerald-600" : "bg-red-600"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const toneStyles = {
  blue: "!border-[#d6e7ff] !bg-gradient-to-br !from-[#f4f9ff] !to-[#edf6ff]",
  green: "!border-[#d8f0e1] !bg-gradient-to-br !from-[#f3fcf6] !to-[#eefaf3]",
  amber: "!border-[#f8e6be] !bg-gradient-to-br !from-[#fffaf0] !to-[#fff8ed]",
  red: "!border-[#f5d9df] !bg-gradient-to-br !from-[#fff7f8] !to-[#fff1f4]",
};
function SummaryCard({ label, value, description, icon: Icon, tone }) {
  return (
    <article
      className={`!relative !flex !min-h-0 !flex-col !rounded-[13px] !border !p-4 !shadow-[0_6px_16px_rgba(23,32,51,0.04)] ${toneStyles[tone]}`}
    >
      <div className="!flex !items-start !gap-3">
        <div className="!grid !h-10 !w-10 !shrink-0 !place-items-center !rounded-[13px] !bg-white/60 !text-[#2563eb]">
          <Icon size={23} strokeWidth={2.3} />
        </div>
        <div className="!min-w-0">
          <h2 className="!m-0 !text-[13px] !leading-tight !text-[#0f1b39] font-semibold">
            {label}
          </h2>
          <strong className="!mt-2 !block !text-[1.5rem] !font-bold !leading-none !tracking-[-1px] !text-[#172033]">
            {value}
          </strong>
          <p className="!m-0 !mt-[6px] !text-[10px] !leading-tight !text-[#596b85]">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
