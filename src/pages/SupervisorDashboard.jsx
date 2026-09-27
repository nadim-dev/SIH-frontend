import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowRight, BarChart3, CheckCircle2, ClipboardList, Clock3, Gauge, PieChart } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { getSupervisorDashboardSummaryApi } from "../api/instrumentApi";

ChartJS.register(ArcElement, Tooltip, Legend);

const donutCenterTextPlugin = {
  id: "donutCenterText",
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    const total = chart.config.options.plugins.donutCenterText.total;
    if (!chartArea || total === undefined) return;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 10px Arial";
    meta.data.forEach((arc, index) => {
      const value = chart.data.datasets[0].data[index];
      if (!value) return;
      const angle = (arc.startAngle + arc.endAngle) / 2;
      const radius = (arc.innerRadius + arc.outerRadius) / 2;
      ctx.fillText(`${((value / total) * 100).toFixed(1)}%`, arc.x + Math.cos(angle) * radius, arc.y + Math.sin(angle) * radius);
    });
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = "#111b55";
    ctx.font = "700 24px Arial";
    ctx.fillText(String(total), x, y + 3);
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Arial";
    ctx.fillText("Total Tests", x, y + 19);
    ctx.restore();
  },
};

const initialMetrics = {
  totalTests: 0,
  passRate: 0,
  pendingReviews: 0,
  averageTurnaroundDays: 0,
  failedTests: 0,
  overdueVerifications: 0,
  monthlyBreakdown: [],
  manufacturerPassRates: [],
  manufacturerTestStatuses: [],
  recentFailures: [],
  testStatus: { passed: 0, failed: 0, pendingReviews: 0, totalTests: 0 },
};

export const Supervisordashbaord = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(initialMetrics);
  const [manufacturerSort, setManufacturerSort] = useState("passRate");
  const [statusManufacturer, setStatusManufacturer] = useState("ALL");

  useEffect(() => {
    setHeaderContent({
      title: "Supervisor Dashboard",
      subtitle: "Monitor testing activity, compliance, reviews, and laboratory turnaround.",
    });
    getSupervisorDashboardSummaryApi()
      .then((response) => setMetrics(response.data || initialMetrics))
      .catch((error) => console.error("Unable to load supervisor dashboard metrics:", error));
  }, [setHeaderContent]);

  const cards = [
    {
      label: "Total Tests",
      value: metrics.totalTests.toLocaleString(),
      note: "Across your testing officers",
      Icon: ClipboardList,
      tone: "border-blue-100 bg-blue-50",
      iconTone: "bg-blue-100 text-blue-600",
      valueTone: "text-blue-900",
    },
    {
      label: "Pass Rate",
      value: `${metrics.passRate}%`,
      note: "Of evaluated tests",
      Icon: CheckCircle2,
      tone: "border-emerald-100 bg-emerald-50",
      iconTone: "bg-emerald-100 text-emerald-600",
      valueTone: "text-emerald-900",
    },
    {
      label: "Pending Reviews",
      value: metrics.pendingReviews.toLocaleString(),
      note: "Awaiting your review",
      Icon: Clock3,
      tone: "border-amber-100 bg-amber-50",
      iconTone: "bg-amber-100 text-amber-600",
      valueTone: "text-amber-900",
    },
    {
      label: "Average Turnaround",
      value: `${(metrics.averageTurnaroundDays * 24).toFixed(1)} hrs`,
      note: "For completed evaluations",
      Icon: Gauge,
      tone: "border-violet-100 bg-violet-50",
      iconTone: "bg-violet-100 text-violet-600",
      valueTone: "text-violet-900",
    },
  ];
  const manufacturerRows = [...(metrics.manufacturerPassRates || [])].sort((a, b) => (b[manufacturerSort] || 0) - (a[manufacturerSort] || 0)).slice(0, 5);
  const manufacturerMax = manufacturerSort === "passRate" ? 100 : Math.max(...manufacturerRows.map((item) => item.total), 1);
  const testStatus = statusManufacturer === "ALL"
    ? (metrics.testStatus || initialMetrics.testStatus)
    : (metrics.manufacturerTestStatuses || []).find((item) => item.manufacturer === statusManufacturer) || { passed: 0, failed: 0, pendingReviews: 0, total: 0 };
  const evaluatedCount = testStatus.totalTests ?? testStatus.total ?? 0;
  const passedPercent = evaluatedCount ? (testStatus.passed / evaluatedCount) * 100 : 0;
  const failedPercent = evaluatedCount ? (testStatus.failed / evaluatedCount) * 100 : 0;
  const pendingPercent = evaluatedCount ? (testStatus.pendingReviews / evaluatedCount) * 100 : 0;
  const manufacturerColors = ["bg-blue-500", "bg-sky-500", "bg-teal-400", "bg-violet-500", "bg-purple-300"];

  return (
    <main className="min-h-full bg-[#F8FAFC] py-2.5">
      <section aria-labelledby="supervisor-key-metrics">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="supervisor-key-metrics" className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><span aria-hidden="true" className="inline-flex h-5 items-end gap-[2px] text-blue-600"><i className="h-2 w-[3px] rounded-t-[2px] bg-current" /><i className="h-3.5 w-[3px] rounded-t-[2px] bg-current" /><i className="h-5 w-[3px] rounded-t-[2px] bg-current" /></span>Key Metrics</h2>
          <button type="button" onClick={() => navigate("/supervisor/key-metrics")} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">View Details <ArrowRight size={15} /></button>
        </div>
        <div className="grid grid-cols-4 gap-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {cards.map(({ label, value, note, Icon, tone, iconTone, valueTone }) => (
            <article key={label} className={`flex min-h-[112px] items-center gap-3 rounded-lg border px-3 py-3 shadow-sm ${tone}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${iconTone}`}><Icon size={21} strokeWidth={2.2} /></span>
              <div className="min-w-0">
                <p className="m-0 text-xs font-medium text-slate-700">{label}</p>
                <strong className={`mt-1 block text-2xl leading-none ${valueTone}`}>{value}</strong>
                <small className="mt-2 block text-[10px] text-slate-500">{note}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-5 grid gap-3 xl:grid-cols-2">
        <article className="rounded-xl border border-blue-100 bg-white py-4 pl-2 pr-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><BarChart3 size={20} className="text-blue-600" />Manufacturer-wise Pass Rate</h2>
            <select value={manufacturerSort} onChange={(event) => setManufacturerSort(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><option value="passRate">Pass Rate</option><option value="total">Test Count</option></select>
          </div>
          {manufacturerRows.length ? <div className="space-y-1.5">
            {manufacturerRows.map((manufacturer, index) => {
              const value = manufacturerSort === "passRate" ? manufacturer.passRate : manufacturer.total;
              const width = (value / manufacturerMax) * 100;
              return <div key={manufacturer.manufacturer} className="grid grid-cols-[minmax(50px,88px)_minmax(0,1fr)_82px] items-center gap-1.5 text-[10px] sm:grid-cols-[minmax(68px,108px)_minmax(0,1fr)_90px]"><span className="whitespace-normal break-words text-right font-medium leading-3 text-[#17345a]">{manufacturer.manufacturer}</span><div className="h-[18px] overflow-hidden rounded-r bg-[#eaf0f7]" style={{ backgroundImage: "repeating-linear-gradient(to right, transparent 0, transparent calc(20% - 1px), #dce5ef calc(20% - 1px), #dce5ef 20%)" }}><div className={`h-full rounded-r ${manufacturerColors[index % manufacturerColors.length]}`} style={{ width: `${Math.min(width, 100)}%` }} /></div><strong className="whitespace-nowrap text-right text-[10px] text-[#111b55]">{manufacturerSort === "passRate" ? `${manufacturer.passRate.toFixed(0)}%` : `${manufacturer.total}`} <small className="text-slate-500">({manufacturer.passed}/{manufacturer.total})</small></strong></div>;
            })}
            <div className="grid grid-cols-[minmax(50px,88px)_minmax(0,1fr)_82px] items-start gap-1.5 sm:grid-cols-[minmax(68px,108px)_minmax(0,1fr)_90px]"><span /><div className="flex justify-between border-t border-slate-300 pt-0.5 text-[8px] text-slate-500">{[0, 20, 40, 60, 80, 100].map((tick) => <span key={tick}>{manufacturerSort === "passRate" ? `${tick}` : Math.round((manufacturerMax * tick) / 100)}</span>)}</div><span /></div>
            <p className="m-0 pl-[58px] text-center text-[9px] text-slate-600 sm:pl-[80px]">{manufacturerSort === "passRate" ? "Pass Rate (%)" : "Test Count"}</p>
          </div> : <p className="py-10 text-center text-xs text-slate-500">No evaluated tests available by manufacturer yet.</p>}
        </article>

        <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="mb-3"><h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><PieChart size={20} className="text-blue-600" />Test Status Overview</h2></div>
          <select value={statusManufacturer} onChange={(event) => setStatusManufacturer(event.target.value)} className="mb-5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"><option value="ALL">All Manufacturers</option>{(metrics.manufacturerTestStatuses || []).map((item) => <option key={item.manufacturer} value={item.manufacturer}>{item.manufacturer}</option>)}</select>
          <div className="grid items-center gap-5 sm:grid-cols-[minmax(160px,.8fr)_minmax(0,1.2fr)]">
            <DonutChart passed={testStatus.passed} failed={testStatus.failed} total={evaluatedCount} />
            <div className="space-y-2.5">
              <StatusMetric label="Passed Tests" count={testStatus.passed} percent={passedPercent} tone="emerald" />
              <StatusMetric label="Failed Tests" count={testStatus.failed} percent={failedPercent} tone="red" />
              <StatusMetric label="Pending Reviews" count={testStatus.pendingReviews} percent={pendingPercent} tone="amber" />
            </div>
          </div>
        </article>
      </section>
      <section className="mt-5 rounded-xl border border-red-100 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 flex items-center gap-2 text-base font-bold text-[#111b55]"><span className="text-red-600">⚠</span>Recent Failures Requiring Attention</h2>
          <button type="button" onClick={() => navigate("/supervisor/non-compliance")} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">View All <span aria-hidden="true">→</span></button>
        </div>
        <div className="overflow-x-auto rounded-md border border-slate-100">
          <table className="w-full min-w-[780px] text-left text-[11px]">
            <thead className="bg-[#f1f7ff] text-[#111b55]"><tr><th className="px-2 py-2">#</th><th className="px-2 py-2">Date</th><th className="px-2 py-2">Instrument / Application</th><th className="px-2 py-2">Test</th><th className="px-2 py-2">Failure Detail</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Action</th></tr></thead>
            <tbody>{(metrics.recentFailures || []).length ? metrics.recentFailures.map((failure, index) => <tr key={failure._id} className="border-t border-slate-100"><td className="px-2 py-2 text-slate-500">{index + 1}</td><td className="px-2 py-2 whitespace-nowrap">{new Date(failure.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td><td className="px-2 py-2"><strong className="block text-[#17345a]">{failure.instrumentId?.instrumentType || "—"}</strong><small className="block text-slate-500">{failure.evaluationId?.applicationNumber || failure.instrumentId?.serialNumber || "—"}</small></td><td className="px-2 py-2 font-medium text-[#17345a]">{formatTestType(failure.testType)}</td><td className="max-w-[230px] truncate px-2 py-2 text-slate-600" title={failure.failedItems?.[0]?.label || failure.remarks}>{failure.failedItems?.[0]?.label || failure.remarks || "Failed test result"}</td><td className="px-2 py-2"><span className={`rounded px-2 py-1 font-semibold ${failure.status === "PENDING" ? "bg-amber-50 text-amber-700" : failure.status === "APPROVED" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{failure.status === "APPROVED" ? "Non-compliant" : failure.status?.replaceAll("_", " ")}</span></td><td className="px-2 py-2"><button type="button" onClick={() => navigate("/supervisor/non-compliance")} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100">View Details</button></td></tr>) : <tr><td colSpan="7" className="p-7 text-center text-slate-500">No NCR failures have been submitted by your testing officers.</td></tr>}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

function StatusMetric({ label, count, percent, tone }) {
  const styles = {
    emerald: { dot: "bg-emerald-500", count: "text-emerald-800", badge: "bg-emerald-50 text-emerald-700" },
    red: { dot: "bg-red-500", count: "text-red-800", badge: "bg-red-50 text-red-700" },
    amber: { dot: "bg-amber-500", count: "text-amber-800", badge: "bg-amber-50 text-amber-700" },
  }[tone];
  return <div className="grid grid-cols-[minmax(0,1fr)_30px_55px] items-center gap-2 rounded-lg border border-slate-100 px-3 py-3 text-[11px]"><span className="flex min-w-0 items-center gap-2"><i className={`h-3 w-3 shrink-0 rounded-full ${styles.dot}`} /><span className="truncate text-slate-700">{label}</span></span><strong className={`text-right text-sm ${styles.count}`}>{count}</strong><span className={`rounded px-2 py-1 text-right font-bold ${styles.badge}`}>{percent.toFixed(1)}%</span></div>;
}

function formatTestType(value) {
  return String(value || "Test").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).replace("General Examination", "General Examination");
}

function DonutChart({ passed, failed, total }) {
  const data = { labels: ["Passed Tests", "Failed Tests"], datasets: [{ data: [passed, failed], backgroundColor: ["#10b981", "#ef4444"], borderColor: "#ffffff", borderWidth: 2, hoverOffset: 3 }] };
  const options = { responsive: true, maintainAspectRatio: false, cutout: "58%", rotation: -90, plugins: { legend: { display: false }, tooltip: { enabled: true }, donutCenterText: { total } } };
  return <div className="flex h-44 w-44 justify-center"><Doughnut data={data} options={options} plugins={[donutCenterTextPlugin]} /></div>;
}
