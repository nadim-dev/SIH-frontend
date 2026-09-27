import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, Clock3, Gauge, XCircle } from "lucide-react";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { getSupervisorDashboardSummaryApi } from "../../api/instrumentApi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const emptyMetrics = {
  totalTests: 0,
  passRate: 0,
  pendingReviews: 0,
  averageTurnaroundDays: 0,
  failedTests: 0,
  overdueVerifications: 0,
  monthlyBreakdown: [],
};

const metricCards = [
  { key: "totalTests", label: "Total Tests", Icon: ClipboardList, tone: "blue", format: (value) => value.toLocaleString() },
  { key: "passRate", label: "Pass Rate", Icon: CheckCircle2, tone: "emerald", format: (value) => `${value}%` },
  { key: "pendingReviews", label: "Pending Reviews", Icon: Clock3, tone: "amber", format: (value) => value.toLocaleString() },
  { key: "averageTurnaroundDays", label: "Average Turnaround", Icon: Gauge, tone: "violet", format: (value) => `${Number(value).toFixed(1)} days` },
  { key: "failedTests", label: "Failed Tests", Icon: XCircle, tone: "rose", format: (value) => value.toLocaleString() },
];

const toneStyles = {
  blue: ["border-blue-100 bg-blue-50", "bg-blue-100 text-blue-600", "text-blue-900"],
  emerald: ["border-emerald-100 bg-emerald-50", "bg-emerald-100 text-emerald-600", "text-emerald-900"],
  amber: ["border-amber-100 bg-amber-50", "bg-amber-100 text-amber-600", "text-amber-900"],
  violet: ["border-violet-100 bg-violet-50", "bg-violet-100 text-violet-600", "text-violet-900"],
  rose: ["border-rose-100 bg-rose-50", "bg-rose-100 text-rose-600", "text-rose-900"],
  orange: ["border-orange-100 bg-orange-50", "bg-orange-100 text-orange-600", "text-orange-900"],
};

export const SupervisorKeyMetrics = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [selectedMetric, setSelectedMetric] = useState("totalTests");
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    setHeaderContent({ title: "Key Metrics", subtitle: "Review detailed testing performance and laboratory trends." });
    getSupervisorDashboardSummaryApi()
      .then((response) => setMetrics({ ...emptyMetrics, ...(response.data || {}) }))
      .catch((error) => console.error("Unable to load supervisor key metrics:", error));
  }, [setHeaderContent]);

  const allRows = metrics.monthlyBreakdown || [];
  const periodRows = useMemo(() => {
    if (period === "monthly") return allRows;
    const grouped = new Map();
    allRows.forEach((row) => {
      const [year, month] = row.key.split("-").map(Number);
      const groupKey = period === "yearly" ? String(year) : `${year}-Q${Math.ceil(month / 3)}`;
      const current = grouped.get(groupKey) || { key: groupKey, month: groupKey, totalTests: 0, passed: 0, failed: 0 };
      current.totalTests += row.totalTests;
      current.passed += row.passed;
      current.failed += row.failed;
      grouped.set(groupKey, current);
    });
    return [...grouped.values()].sort((a, b) => a.key.localeCompare(b.key)).map((row, index, rows) => {
      const previous = rows[index - 1];
      const evaluated = row.passed + row.failed;
      return { ...row, passRate: evaluated ? Number(((row.passed / evaluated) * 100).toFixed(1)) : 0, changePercent: previous?.totalTests ? Number((((row.totalTests - previous.totalTests) / previous.totalTests) * 100).toFixed(1)) : null };
    });
  }, [allRows, period]);
  const rows = periodRows;
  const selectedCard = metricCards.find((card) => card.key === selectedMetric) || metricCards[0];
  const selectedValues = rows.map((row) => selectedMetric === "passRate" ? row.passRate : selectedMetric === "failedTests" ? row.failed : selectedMetric === "pendingReviews" ? Math.max(metrics.pendingReviews, 0) : selectedMetric === "averageTurnaroundDays" ? metrics.averageTurnaroundDays : row.totalTests);
  const chartData = useMemo(() => ({ labels: rows.map((row) => row.month), datasets: [{ label: selectedCard.label, data: selectedValues, borderColor: "#1683f7", backgroundColor: "rgba(22, 131, 247, .16)", fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: "#1683f7" }] }), [rows, selectedCard.label, selectedValues]);
  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2];
  const highest = rows.reduce((result, row) => !result || row.totalTests > result.totalTests ? row : result, null);
  const lowest = rows.reduce((result, row) => !result || row.totalTests < result.totalTests ? row : result, null);
  const monthlyAverage = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.totalTests, 0) / rows.length) : 0;

  return (
    <main className="min-h-full bg-[#F8FAFC] py-2.5">
      <section className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {metricCards.map(({ key, label, Icon, tone, format }) => {
            const styles = toneStyles[tone];
            const value = metrics[key] || 0;
            return <button key={key} type="button" onClick={() => setSelectedMetric(key)} className={`min-w-0 rounded-lg border p-2 text-left transition ${styles[0]} ${selectedMetric === key ? "ring-2 ring-blue-500" : ""}`}><div className="flex items-center gap-2"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${styles[1]}`}><Icon size={18} /></span><span className="min-w-0"><span className="block truncate text-[10px] font-medium text-slate-700">{label}</span><strong className={`mt-0.5 block text-xl leading-none ${styles[2]}`}>{format(value)}</strong></span></div><span className="mt-2 block text-[9px] text-slate-500">{key === "totalTests" ? "Across your testing officers" : key === "averageTurnaroundDays" ? "For completed evaluations" : "Current period"}</span></button>;
          })}
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><BarChart3 size={19} className="text-blue-600" />{selectedCard.label}</h2><p className="m-0 text-[11px] text-slate-500">{period === "monthly" ? "Monthly" : period === "quarterly" ? "Quarterly" : "Yearly"} performance for your laboratory.</p></div><div className="flex items-center gap-2"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 w-24 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select><button type="button" onClick={() => navigate("/supervisor/dashbaord")} className="inline-flex h-9 items-center gap-1 text-xs font-semibold text-blue-700"><ArrowLeft size={14} />Back</button></div></div>
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,.9fr)]">
          <div className="h-[260px] rounded-lg border border-slate-100 p-2">{rows.length ? <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "#e8eef6" }, ticks: { stepSize: selectedMetric === "passRate" ? 20 : 1, precision: 0, color: "#64748b", font: { size: 10 }, callback: (value) => selectedMetric === "passRate" ? `${value}%` : Math.round(value) } }, x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 10 } } } } }} /> : <div className="grid h-full place-items-center text-xs text-slate-500">No monthly testing data available.</div>}</div>
          <div className="rounded-lg border border-slate-100 p-3"><h3 className="m-0 text-sm font-bold text-[#111b55]">Summary</h3><div className="mt-2 divide-y divide-slate-100 text-[11px]">{[["Tests (selected period)", metrics.totalTests], ["Previous period", previous?.totalTests ?? 0], ["Change", latest?.changePercent == null ? "—" : `${latest.changePercent >= 0 ? "↑" : "↓"} ${Math.abs(latest.changePercent)}%`], ["Highest in a month", highest ? `${highest.totalTests} (${highest.month})` : "—"], ["Lowest in a month", lowest ? `${lowest.totalTests} (${lowest.month})` : "—"], ["Monthly average", monthlyAverage], ["Trend", latest && previous ? (latest.totalTests >= previous.totalTests ? "Increasing" : "Decreasing") : "—"]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-2 py-2"><span className="text-slate-600">{label}</span><strong className={label === "Trend" ? "text-emerald-600" : "text-[#111b55]"}>{value}</strong></div>)}</div></div>
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-blue-100 bg-white p-3 shadow-sm"><h3 className="m-0 flex items-center gap-2 text-sm font-bold text-[#111b55]"><BarChart3 size={16} className="text-blue-600" />Monthly Breakdown</h3><div className="mt-2 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-[11px]"><thead className="bg-[#f1f7ff] text-[#111b55]"><tr><th className="px-3 py-2">Month</th><th className="px-3 py-2">Total Tests</th><th className="px-3 py-2">Passed</th><th className="px-3 py-2">Failed</th><th className="px-3 py-2">Pass Rate</th><th className="px-3 py-2">Change (vs previous)</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.key} className="border-t border-slate-100"><td className="px-3 py-2">{row.month}</td><td className="px-3 py-2 font-semibold">{row.totalTests}</td><td className="px-3 py-2">{row.passed}</td><td className="px-3 py-2">{row.failed}</td><td className="px-3 py-2 font-semibold text-emerald-600">{row.passRate}%</td><td className={`px-3 py-2 font-semibold ${row.changePercent == null || row.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>{row.changePercent == null ? "—" : `${row.changePercent >= 0 ? "↑" : "↓"} ${Math.abs(row.changePercent)}%`}</td></tr>) : <tr><td colSpan="6" className="p-7 text-center text-slate-500">No monthly breakdown available.</td></tr>}</tbody></table></div></section>
    </main>
  );
};
