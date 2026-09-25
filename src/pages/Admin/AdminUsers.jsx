import { useEffect, useState } from "react";
import { Ban, ChevronDown, MoreVertical, Search, Trash2, UserRound, Users } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { deleteAdminUserApi, getAdminUsersApi, updateAdminUserStatusApi } from "../../api/authApi";

export const AdminUsers = () => {
  const { setHeaderContent } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [laboratoryFilter, setLaboratoryFilter] = useState("All Laboratories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    if (!selectedUser || !menuAnchor) return undefined;
    const updateMenuPosition = () => {
      const rect = menuAnchor.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 8, left: rect.right - 176 });
    };
    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [selectedUser, menuAnchor]);

  const updateUserStatus = async (user) => {
    const nextStatus = user.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    if (!window.confirm(`${nextStatus === "ACTIVE" ? "Activate" : "Deactivate"} ${user.name}?`)) return;
    try {
      const response = await updateAdminUserStatusApi(user._id, nextStatus);
      const updated = response?.user || response?.data?.user;
      setUsers((rows) => rows.map((row) => row._id === user._id ? { ...row, ...updated, status: nextStatus } : row));
      setSelectedUser(null);
    } catch (error) { window.alert(error.message || "Unable to update user status."); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name} permanently?`)) return;
    try {
      await deleteAdminUserApi(user._id);
      setUsers((rows) => rows.filter((row) => row._id !== user._id));
      setSelectedUser(null);
    } catch (error) { window.alert(error.message || "Unable to delete user."); }
  };

  useEffect(() => {
    const loadUsers = async () => {
      setHeaderContent({ title: "Users", subtitle: "Manage registered users and their access to the system." });
      try {
        const response = await getAdminUsersApi();
        const rows = response?.users || response?.data?.users || [];
        setUsers(Array.isArray(rows) ? rows.filter((user) => !["NAWI_ADMIN", "ADMIN", "ADMINISTRATOR", "ADMINISTRATOR"].includes(String(user.role || "").trim().toUpperCase().replace(/\s+/g, "_"))) : []);
      } catch (error) {
        console.error("Unable to load admin users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [setHeaderContent]);

  const visibleUsers = users.filter((user) => {
    const role = user.role === "TESTING OFFICER" ? "Testing Officer" : user.role === "LAB SUPERVISOR" ? "Supervisor" : user.role || "Testing Officer";
    const status = user.status === "ACTIVE" ? "Active" : user.status === "INACTIVE" ? "Inactive" : user.status === "IN_TESTING" ? "In testing" : user.status || "Active";
    return (
      `${user.name} ${user.email} ${role}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (laboratoryFilter === "All Laboratories" || (user.labId?.name || user.laboratoryName || "Unassigned Laboratory") === laboratoryFilter) &&
      (statusFilter === "All Status" || status === statusFilter)
    );
  });
  const laboratories = ["All Laboratories", ...new Set(users.map((user) => user.labId?.name || user.laboratoryName || "Unassigned Laboratory"))];
  return (
    <main className="px-1 pb-8">
      <div className="grid grid-cols-1 gap-4 min-[701px]:grid-cols-2 min-[1100px]:grid-cols-4">
        <Summary
          label="Total Users"
          value={users.length}
          description="Registered accounts"
          icon={Users}
          tone="blue"
        />
        <Summary
          label="Active Users"
          value={users.filter((user) => String(user.status || "ACTIVE").toUpperCase() === "ACTIVE").length}
          description="Currently active accounts"
          icon={UserRound}
          tone="green"
        />
        <Summary
          label="Supervisors"
          value={
            users.filter((user) =>
              String(user.role || "")
                .toUpperCase()
                .includes("SUPERVISOR"),
            ).length
          }
          description="Laboratory supervisors"
          icon={UserRound}
          tone="amber"
        />
        <Summary
          label="Testing Officers"
          value={users.filter((user) => user.role === "TESTING OFFICER").length}
          description="Assigned testing users"
          icon={Users}
          tone="red"
        />
      </div>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(23,32,51,0.04)]">
         <h2 className="m-0 text-xl font-bold text-[#0f1b39]">
          Registered Users
        </h2>
       <p className="mt-1 text-xs text-slate-500">
          Review user accounts, roles and current access status.
        </p> 
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="!m-0 !h-10 !rounded-md !border-slate-200 !pl-9 !text-xs"
            />
          </label>
          <FilterSelect value={laboratoryFilter} onChange={setLaboratoryFilter} options={laboratories} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["All Status", "Active", "Inactive", "In testing"]} />
        </div>
        <div className="mt-5 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3">#</th>
                <th className="border-b border-slate-200 px-4 py-3">Name</th>
                <th className="border-b border-slate-200 px-4 py-3">Email</th>
                <th className="border-b border-slate-200 px-4 py-3">Role</th>
                <th className="border-b border-slate-200 px-4 py-3">Status</th>
                <th className="border-b border-slate-200 px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user, index) => (
                  <tr
                    key={user._id || user.email}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {user.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${user.role === "LAB SUPERVISOR" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                        {user.role === "LAB SUPERVISOR" ? "Supervisor" : user.role === "TESTING OFFICER" ? "Testing Officer" : user.role || "Testing Officer"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${String(user.status || "ACTIVE").toUpperCase() === "INACTIVE" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {user.status === "ACTIVE" ? "Active" : user.status === "INACTIVE" ? "Inactive" : user.status || "Active"}
                      </span>
                    </td>
                    <td className="relative px-4 py-3"><button type="button" aria-label={`More actions for ${user.name}`} onClick={(event) => { const isSameUser = selectedUser?._id === user._id; setSelectedUser(isSameUser ? null : user); setMenuAnchor(isSameUser ? null : event.currentTarget); }} className="cursor-pointer rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"><MoreVertical size={15} /></button>{selectedUser?._id === user._id && <UserActions user={user} position={menuPosition} onStatus={() => updateUserStatus(user)} onDelete={() => deleteUser(user)} />}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

function Summary({ label, value, description, icon: Icon, tone }) {
  const colors = {
    blue: "!border-[#bfdbfe] !bg-[#eff6ff] !text-[#1d4ed8]",
    green: "!border-[#bbf7d0] !bg-[#f0fdf4] !text-[#15803d]",
    amber: "!border-[#fde68a] !bg-[#fffbeb] !text-[#b45309]",
    red: "!border-[#fecdd3] !bg-[#fff1f2] !text-[#be123c]",
  };
  const iconColors = {
    blue: "!bg-[#dbeafe] !text-[#2563eb]",
    green: "!bg-[#dcfce7] !text-[#16a34a]",
    amber: "!bg-[#fef3c7] !text-[#d97706]",
    red: "!bg-[#ffe4e6] !text-[#e11d48]",
  };
  return (
    <article
      className={`!relative !flex !min-h-0 !flex-col !rounded-[13px] !border !p-4 !shadow-[0_6px_16px_rgba(23,32,51,0.06)] ${colors[tone]}`}
    >
      <div className="!flex !items-start !gap-3">
        <div
          className={`!grid !h-10 !w-10 !shrink-0 !place-items-center !rounded-[13px] ${iconColors[tone]}`}
        >
          <Icon size={23} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="!m-0 !text-[13px] !font-semibold !text-[#0f1b39]">
            {label}
          </h2>
          <strong className="!mt-2 !block !text-[1.5rem] !leading-none !text-[#172033]">
            {value}
          </strong>
          <p className="!m-0 !mt-[6px] !text-[10px] !text-[#596b85]">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <label className="relative flex h-10 w-[220px] items-center">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="!m-0 !h-full !w-full !appearance-none !rounded-md !border-slate-200 !bg-white !px-3 !pr-8 !text-sm !font-semibold !text-slate-700"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 text-slate-500"
      />
    </label>
  );
}

function UserActions({ user, position, onStatus, onDelete }) {
  const inactive = user.status === "INACTIVE";
  const options = [
    { label: inactive ? "Activate User" : "Deactivate User", icon: Ban, color: "text-amber-600", action: onStatus },
    { label: "Delete Permanently", icon: Trash2, color: "text-red-600", action: onDelete },
  ];
  return <div className="fixed z-[100] w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl" style={{ top: position?.top, left: position?.left }}>{options.map(({ label, icon: Icon, color, action }) => <button type="button" key={label} onClick={action} className="flex w-full cursor-pointer items-center gap-2 rounded-md p-1.5 text-left text-slate-700 hover:bg-slate-100"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 ${color}`}><Icon size={14} /></span><strong className="text-[11px]">{label}</strong></button>)}</div>;
}
