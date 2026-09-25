import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, FileSpreadsheet, FileText, Search, UserRound, Building2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { getAuditLogsApi } from "../../api/authApi";

const auditRows = [
  ["24 Sep 2026", "10:24 AM", "A", "Ankita Prasad", "Administrator", "Lab Created", "Created new laboratory\n\"Maharashtra Legal Metrology Laboratory\"", "MH-LAB-001"],
  ["22 Sep 2026", "03:45 PM", "M", "Mushir Qureshi", "Supervisor", "Report Generated", "Generated final report", "APP-2026-015"],
  ["22 Sep 2026", "11:20 AM", "A", "Ankita Prasad", "Administrator", "User Deactivated", "Deactivated testing officer\naccount", "TO-106"],
  ["21 Sep 2026", "05:20 PM", "R", "Rahul Sharma", "Supervisor", "Evaluation Rejected", "Rejected evaluation\nAPP-2026-014", "APP-2026-014"],
  ["21 Sep 2026", "02:10 PM", "A", "Nadim Khan", "Testing Officer", "Instrument Registered", "Registered new instrument", "APP-2026-021"],
  ["20 Sep 2026", "09:14 AM", "M", "Mushir Qureshi", "Supervisor", "Report Downloaded", "Downloaded report", "APP-2026-012"],
];

export const AuditLog = () => {
  const { setHeaderContent } = useOutletContext();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("All Actions");
  const [user, setUser] = useState("All Users");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [liveRows, setLiveRows] = useState([]);
  const [summary, setSummary] = useState({ totalLogs: 0, userRelated: 0, laboratoryRelated: 0, reportRelated: 0 });

  useEffect(() => setHeaderContent({ title: "Audit logs", subtitle: "Review a chronological record of important administrative activity." }), [setHeaderContent]);

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const response = await getAuditLogsApi();
        const logs = response?.logs || response?.data?.logs || [];
        setSummary(response?.summary || response?.data?.summary || { totalLogs: 0, userRelated: 0, laboratoryRelated: 0, reportRelated: 0 });
        setLiveRows(logs.map((log) => {
          const date = new Date(log.createdAt);
          return [date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), String(log.actorName || "U").trim().charAt(0).toUpperCase(), log.actorName || "Unknown user", log.actorRole === "LAB SUPERVISOR" ? "Supervisor" : log.actorRole === "TESTING OFFICER" ? "Testing Officer" : log.actorRole || "Administrator", log.action, log.details, log.relatedTo || "—"];
        }));
      } catch (error) {
        console.error("Unable to load audit logs:", error);
        setLiveRows([]);
      }
    };
    loadAuditLogs();
  }, []);

  const rows = [...liveRows, ...auditRows];
  const defaultSummary = {
    totalLogs: auditRows.length,
    userRelated: auditRows.filter((row) => /^User /.test(row[5])).length,
    laboratoryRelated: auditRows.filter((row) => ["Lab Created", "Lab Updated", "Instrument Registered"].includes(row[5])).length,
    reportRelated: auditRows.filter((row) => /Report/.test(row[5])).length,
  };
  const displaySummary = {
    totalLogs: summary.totalLogs + defaultSummary.totalLogs,
    userRelated: summary.userRelated + defaultSummary.userRelated,
    laboratoryRelated: summary.laboratoryRelated + defaultSummary.laboratoryRelated,
    reportRelated: summary.reportRelated + defaultSummary.reportRelated,
  };

  const exportToExcel = () => {
    const headers = ["Date & Time", "User", "Role", "Action", "Details", "Related To"];
    const csv = [headers, ...filteredRows.map((row) => [`="${row[0]} ${row[1]}"`, row[3], row[4], row[5], row[6].replace(/\n/g, " "), row[7]])]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRows = useMemo(() => rows.filter((row) => {
    const text = row.join(" ").toLowerCase();
    const rowDate = new Date(`${row[0]} ${row[1]}`);
    const afterFrom = !dateFrom || rowDate >= new Date(`${dateFrom}T00:00:00`);
    const beforeTo = !dateTo || rowDate <= new Date(`${dateTo}T23:59:59`);
    return text.includes(search.toLowerCase()) && (action === "All Actions" || row[5] === action) && (user === "All Users" || row[3] === user) && afterFrom && beforeTo;
  }), [rows, search, action, user, dateFrom, dateTo]);

  
  return <main className="audit-page">
    <div className="audit-summary">
      <Summary icon={FileText} label="Total Logs" value={displaySummary.totalLogs} />
      <Summary icon={UserRound} label="User Related" value={displaySummary.userRelated} tone="green" />
      <Summary icon={Building2} label="Laboratory Related" value={displaySummary.laboratoryRelated} tone="blue" />
      <Summary icon={FileText} label="Report Related" value={displaySummary.reportRelated} tone="purple" />
    </div>
    <div className="audit-toolbar">
      <label className="audit-search"><Search size={15} /><input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      <Select value={action} onChange={setAction} options={["All Actions", ...new Set(rows.map((row) => row[5]))]} />
      <Select value={user} onChange={setUser} options={["All Users", ...new Set(rows.map((row) => row[3]))]} />
      <label className="audit-date"><input type="date" aria-label="Start date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} onClick={(event) => event.currentTarget.showPicker?.()} /><CalendarDays size={15} /><span>to</span><input type="date" aria-label="End date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} onClick={(event) => event.currentTarget.showPicker?.()} /><CalendarDays size={15} /></label>
    </div>
    <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>Date &amp; Time</th><th>User</th><th>Role</th><th>Action</th><th>Details</th><th>Related To</th></tr></thead><tbody>{filteredRows.map((row) => <tr key={`${row[0]}-${row[1]}-${row[3]}`}><td>{row[0]}<small>{row[1]}</small></td><td><span className="audit-avatar">{row[2]}</span>{row[3]}</td><td>{row[4]}</td><td><span className={`audit-badge ${row[5].includes("Rejected") || row[5].includes("Deactivated") ? "danger" : row[5].includes("Report") ? "purple" : row[5].includes("Evaluation") || row[5].includes("Instrument") ? "blue" : "green"}`}>{row[5]}</span></td><td className="audit-details">{row[6].split("\n").map((line) => <span key={line}>{line}</span>)}</td><td>{row[7]}</td></tr>)}</tbody></table></div>
    <div className="audit-export-bar"><button type="button" className="audit-export-button" onClick={exportToExcel}><FileSpreadsheet size={15} />Export to Excel</button></div>
  </main>;
};

const Summary = ({ icon: Icon, label, value, tone = "slate" }) => <div className="audit-summary-card"><span className={`audit-summary-icon ${tone}`}><Icon size={21} /></span><span><small>{label}</small><strong>{value}</strong></span></div>;
const Select = ({ value, onChange, options }) => <label className="audit-select"><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></label>;

export default AuditLog;
