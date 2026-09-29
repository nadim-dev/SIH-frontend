import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  History,
  Search,
  UploadCloud,
} from "lucide-react";
import { getLaboratoriesUsingCurrentOimlVersionApi } from "../../api/authApi";

const standards = {
  version: "R 76-1:2006",
  title: "Non-automatic Weighing Instruments",
  effectiveSince: "15/09/2026",
  nextReviewDue: "15/03/2027",
  description: "International recommendation for non-automatic weighing instruments.",
  notes: "All laboratories are currently using this version for test reports.",
  laboratoriesUsing: 6,
  totalLaboratories: 6,
};

const SummaryCard = ({ icon: Icon, tone, label, children }) => (
  <article className="relative flex min-h-0 flex-col rounded-[13px] border border-slate-200 bg-white p-3 shadow-[0_6px_16px_rgba(23,32,51,0.04)] sm:p-4">
    <div className="flex items-start gap-2.5 sm:gap-3">
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] sm:h-10 sm:w-10 ${tone}`}>
      <Icon size={22} strokeWidth={2} />
    </span>
    <div className="min-w-0">
      <p className="m-0 text-xs leading-tight text-slate-600">{label}</p>
      <div className="mt-1 [&>p]:!text-xl [&>p]:!leading-tight">{children}</div>
    </div>
    </div>
  </article>
);

const InfoRow = ({ label, children }) => (
  <div className="grid grid-cols-[minmax(125px,0.42fr)_minmax(0,1fr)] gap-3 border-t border-slate-200 px-3 py-2 text-[13px] sm:grid-cols-[200px_minmax(0,1fr)]">
    <span className="text-slate-600">{label}</span>
    <div className="min-w-0 text-slate-900">{children}</div>
  </div>
);

const ActionCard = ({ icon: Icon, tone, title, description }) => (
  <button
    type="button"
    disabled
    className="group flex w-full cursor-not-allowed items-center gap-5 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-4 text-left opacity-100 transition-colors hover:border-blue-200 hover:bg-blue-50/40 disabled:cursor-not-allowed"
  >
    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}>
      <Icon size={23} strokeWidth={2} />
    </span>
    <span className="min-w-0 flex-1">
      <strong className="block text-sm font-bold text-slate-900">{title}</strong>
      <span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
    </span>
    <ChevronRight size={22} className="shrink-0 text-slate-500" />
  </button>
);

export const OIMLStandardsPage = () => {
  const { setHeaderContent } = useOutletContext();
  const navigate = useNavigate();
  const [laboratories, setLaboratories] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [labsError, setLabsError] = useState("");

  useEffect(() => {
    setHeaderContent({
      title: "OIML Standards",
      subtitle: "Manage OIML versions, test requirements and compliance rules used by NAWI Pro.",
    });
  }, [setHeaderContent]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getLaboratoriesUsingCurrentOimlVersionApi();
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];
        setLaboratories(rows);
      } catch (error) {
        setLabsError(error.data?.message || error.message || "Unable to load laboratories.");
      } finally {
        setLoadingLabs(false);
      }
    };
    loadData();
  }, []);

  const totalLaboratories = laboratories.length;
  const labsUsingVersion = laboratories.filter((laboratory) => laboratory.versionStatus?.startsWith("Using")).length;
  const adoption = totalLaboratories ? Math.round((labsUsingVersion / totalLaboratories) * 100) : 0;
  const visibleLaboratories = useMemo(() => laboratories.filter((laboratory) =>
    `${laboratory.name || ""} ${laboratory.state || ""} ${laboratory.city || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  ), [laboratories, search]);

  return (
    <main className="space-y-4 text-slate-900">
      <section className="grid grid-cols-1 gap-3 min-[701px]:grid-cols-2 min-[1100px]:grid-cols-4">
        <SummaryCard icon={FileText} tone="bg-violet-100 text-violet-700" label="Current Version">
          <p className="m-0 mt-1 text-[22px] font-bold leading-7 tracking-tight">{standards.version}</p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={15} />Active</span>
        </SummaryCard>
        <SummaryCard icon={CalendarDays} tone="bg-emerald-100 text-emerald-700" label="Effective Since">
          <p className="m-0 mt-1 text-[22px] font-bold leading-7 tracking-tight">{standards.effectiveSince}</p>
        </SummaryCard>
        <SummaryCard icon={Clock3} tone="bg-orange-100 text-orange-600" label="Next Review Due">
          <p className="m-0 mt-1 text-[22px] font-bold leading-7 tracking-tight">{standards.nextReviewDue}</p>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700"><Clock3 size={14} />In 6 months</span>
        </SummaryCard>
        <SummaryCard icon={FlaskConical} tone="bg-blue-100 text-blue-700" label="All Labs Using This Version">
          <p className="m-0 mt-1 text-[22px] font-bold leading-7 tracking-tight">{labsUsingVersion} / {totalLaboratories}</p>
          <p className="m-0 mt-1 text-xs text-blue-800">{adoption}% adoption</p>
        </SummaryCard>
      </section>

      <section className="grid grid-cols-1 gap-3 min-[900px]:grid-cols-[1.3fr_1fr]">
        <article className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <h2 className="mb-3 mt-0 text-base font-bold tracking-tight text-slate-900">Version Information</h2>
          <InfoRow label="OIML Version">
            <span className="mr-4 font-medium">{standards.version}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"><Check size={14} strokeWidth={3} />Active</span>
          </InfoRow>
          <InfoRow label="Title">{standards.title}</InfoRow>
          <InfoRow label="Effective Since">{standards.effectiveSince}</InfoRow>
          <InfoRow label="Next Review Due">{standards.nextReviewDue}</InfoRow>
          <InfoRow label="Description"><span className="block max-w-[460px] leading-5">{standards.description}</span></InfoRow>
          <InfoRow label="Notes">{standards.notes}</InfoRow>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
          <h2 className="mb-5 mt-0 text-lg font-bold tracking-tight text-slate-900">Actions</h2>
          <div className="space-y-4">
            <ActionCard icon={UploadCloud} tone="bg-blue-100 text-blue-700" title="Upload New Version" description="Adopt and apply a new OIML version for India." />
            <ActionCard icon={History} tone="bg-violet-100 text-violet-700" title="View Version History" description="Check past versions and changes." />
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-base font-bold tracking-tight text-slate-900">All Labs Currently Using This Version ({labsUsingVersion})</h2>
          <label className="relative block w-full sm:w-[220px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search laboratory..." className="!m-0 !h-8 !w-full !rounded-md !border-slate-300 !py-1 !pl-9 !pr-2 !text-xs" />
          </label>
        </header>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-[850px] border-collapse text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-[11px] font-semibold text-slate-900">
              <tr>{["#", "Laboratory", "State", "Status", "Date Adopted", "Reports Generated", "Actions"].map((heading) => <th key={heading} className="border border-slate-200 px-3 py-2">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {visibleLaboratories.map((laboratory, index) => (
                <tr key={laboratory._id || laboratory.name} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-3 py-1.5">{index + 1}</td>
                  <td className="border border-slate-200 px-3 py-1.5 font-medium">{laboratory.name || "—"}</td>
                  <td className="border border-slate-200 px-3 py-1.5">{laboratory.state || "—"}</td>
                  <td className="border border-slate-200 px-3 py-1.5"><span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold leading-none text-emerald-700"><CheckCircle2 size={12} strokeWidth={2.5} />{laboratory.versionStatus}</span></td>
                  <td className="border border-slate-200 px-3 py-1.5">{laboratory.adoptedAt || "—"}</td>
                  <td className="border border-slate-200 px-3 py-1.5">{laboratory.reportsGenerated ?? 0}</td>
                  <td className="border border-slate-200 px-3 py-1.5"><button type="button" onClick={() => navigate(`/admin/laboratories/${encodeURIComponent(laboratory._id)}/profile`)} className="rounded border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50">View</button></td>
                </tr>
              ))}
              {!loadingLabs && visibleLaboratories.length === 0 && <tr><td colSpan={7} className="border border-slate-200 px-3 py-8 text-center text-slate-500">{labsError || (laboratories.length ? "No laboratories match your search." : "No laboratories found.")}</td></tr>}
              {loadingLabs && <tr><td colSpan={7} className="border border-slate-200 px-3 py-8 text-center text-slate-500">Loading laboratories…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
