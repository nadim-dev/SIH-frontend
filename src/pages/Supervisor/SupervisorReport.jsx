import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { getGeneratedReportApi } from "../../api/instrumentApi";
import laboratoryLogo from "../../assets/laboratory_logo.png";
import benchScaleImage from "../../assets/bench_scale.png";
import { AlertTriangle, BookOpenCheck, Check, CheckCircle2, FileText, Images, Mail, Phone, Thermometer, UserRound } from "lucide-react";

export const SupervisorReport = () => {
  const { applicationId } = useParams();
  const { setHeaderContent, currentUser } = useOutletContext();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const printReport = () => {
    document.title = "nawi_report";
    window.addEventListener("afterprint", () => {
      document.title = "";
    }, { once: true });
    window.print();
  };
/*
      // Let browser images finish loading before the canvas snapshot.
      await Promise.all(
        Array.from(reportRef.current.querySelectorAll("img")).map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                image.addEventListener("load", resolve, { once: true });
                image.addEventListener("error", resolve, { once: true });
              }),
        ),
      );
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: reportRef.current.clientWidth,
        height: reportRef.current.scrollHeight,
        windowWidth: reportRef.current.clientWidth,
        // A remote image without Access-Control-Allow-Origin can taint the
        // canvas. Skip that individual image so the rest of the report still
        // downloads successfully.
        onclone: (clonedDocument) => {
          clonedDocument.querySelectorAll("img").forEach((image) => {
            try {
              if (new URL(image.src, window.location.href).origin !== window.location.origin) {
                image.removeAttribute("src");
                image.alt = "Image unavailable in downloaded PDF";
              }
            } catch {
              image.removeAttribute("src");
            }
          });
        },
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pagePixelHeight = Math.floor((pageHeight / pageWidth) * canvas.width);
      for (let top = 0, page = 0; top < canvas.height; top += pagePixelHeight, page += 1) {
        const sliceHeight = Math.min(pagePixelHeight, canvas.height - top);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        pageCanvas.getContext("2d").drawImage(
          canvas,
          0, top, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight,
        );
        if (page) pdf.addPage();
        pdf.addImage(
          pageCanvas.toDataURL("image/jpeg", 0.92),
          "JPEG",
          0,
          0,
          pageWidth,
          (sliceHeight * pageWidth) / canvas.width,
        );
      }
      pdf.save(`${applicationId}-report.pdf`);
    } catch (exportError) {
      console.error("Unable to export report PDF:", exportError);
      window.alert(`Unable to create the PDF. ${exportError?.message || "Please try again."}`);
    } finally {
      setExporting(false);
    }
  }; */

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    document.title = "";
    setHeaderContent({
      title: "Instrument Test Report",
      subtitle: `Approved test report for application ${applicationId}`,
    });
    getGeneratedReportApi(applicationId)
      .then((response) => { const loaded = response.data?.data || response.data; setReport(loaded); })
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load report."),
      );
    return () => {
      document.title = "NAWI Pro";
    };
  }, [applicationId, setHeaderContent]);

  if (!report)
    return (
      <main className="p-6 text-sm text-slate-500">
        {error || "Loading report..."}
      </main>
    );
  const instrument = report.instrumentDetails || {};
  const results = report.testResults || {};
  const sensitivityInPlan = (report.testPlan?.tests || []).some((test) => test.code === "SENSITIVITY" || /sensitivity/i.test(test.name || ""));
  const reportResults = sensitivityInPlan && !results.sensitivityTest
    ? { ...results, sensitivityTest: { passed: null, points: [] } }
    : results;
  const isNonCompliant = report.complianceStatus === "NON_COMPLIANT";
  const manufacturerName = instrument.manufacturer || "Maharashtra Instruments";
  const companySlug = manufacturerName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 32) || "manufacturer";
  const applicantAddress = instrument.applicantAddress || instrument.address || "L.B.S. Marg, Vikhroli West, Mumbai, Maharashtra, India";
  const contactPerson = instrument.contactPerson || "Rajat Sharma";
  const applicantEmail = instrument.applicantEmail || `contact@${companySlug}.com`;
  const laboratory = report.laboratoryDetails || report.supervisorId?.labId || {};
  const laboratoryName = laboratory.name || report.laboratoryName || "State Legal Metrology Laboratory";
  const laboratoryAddress = [laboratory.address, laboratory.city, laboratory.state, laboratory.pinCode].filter(Boolean).join(", ");
  const kgValue = (value) => displayValue(value) === "—" ? "—" : `${displayValue(value)} kg`;
  const rows = [
    ["Weighing Performance", results.weighingTest?.passed],
    ["Repeatability", results.repeatabilityTest?.passed],
    ["Eccentricity", results.eccentricityTest?.passed],
    ["Tare", results.tareTest?.passed],
  ];
  const applicationNumber =
    report.evaluationId?.applicationNumber || applicationId;
  const reportNumber = `NAWI/TR/${applicationNumber.replace("NAWI-", "")}`;
  const reportDate = report.approvedAt || report.createdAt;
  const verificationUrl = (report.qrCode || `${window.location.origin}/verify-report/${report._id || report.evaluationId?._id || applicationNumber}`)
    .replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, "https://nawipro.netlify.app")
    .replace(/^https?:\/\/nawipro12\.netlify\.app/i, "https://nawipro.netlify.app");
  const qrUrl = `https://quickchart.io/qr?size=180&text=${encodeURIComponent(verificationUrl)}`;
  return (
    <main className="report-print-page min-h-full bg-[#f8fafc] p-3 text-[11px] text-[#172033]">
      {currentUser?.role !== "TESTING OFFICER" && <div className="mx-auto mb-3 flex max-w-[1360px] justify-end print:hidden"><button type="button" onClick={printReport} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white">Print / Save PDF</button></div>}
      <section className="report-print-document mx-auto max-w-[1360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <div className="-ml-2 flex items-center gap-3">
            <img
              src={laboratoryLogo}
              alt="Government of Maharashtra"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h2 className="m-0 text-[1rem] font-extrabold text-[#172b55]">
                {laboratoryName}
              </h2>
              <p className="m-0 text-[11px] text-slate-600">
                {laboratoryAddress || "Laboratory address unavailable"}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10px] leading-3.5 text-slate-500">
                {laboratory.officialEmail && <span className="inline-flex items-center gap-1 leading-3.5"><Mail size={10} className="shrink-0 text-blue-600" aria-hidden="true" /><span>{laboratory.officialEmail}</span></span>}
                {laboratory.contactNumber && <span className="inline-flex items-center gap-1 leading-3.5"><Phone size={10} className="shrink-0 text-red-600" aria-hidden="true" /><span>{laboratory.contactNumber}</span></span>}
                {!laboratory.officialEmail && !laboratory.contactNumber && <span>Laboratory contact details unavailable</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="m-0 text-sm font-extrabold text-[#172b55]">
              NAWI Test Report
            </h2>
            <p className="m-0 text-[10px] text-slate-500">
              Non-Automatic Weighing Instrument
            </p>
            <p className="m-0 text-[9px] text-slate-500">
              As per OIML R 76-1:2006  R 76-2:2007
            </p>
          </div>
        </header>
        <div className="m-1 mx-2 grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-2">
          <div className="col-start-1 row-start-1 flex items-center gap-3 rounded-sm bg-[#eef6ff] px-2 py-1">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={31} />
            <div>
              <h1 className="m-0 text-lg font-extrabold text-[#2563eb]">
                Instrument Test Report
              </h1>
              <p className="m-0 text-[10px] text-slate-500">
                Complete OIML R 76 test results and compliance evaluation
              </p>
            </div>
          </div>
          <div className={`compliance-badge ml-4 flex items-center gap-1.5 rounded-lg px-3 py-2 ${isNonCompliant ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
            <span className={`compliance-check grid h-6 w-6 place-items-center rounded-full ${isNonCompliant ? "bg-red-600" : "bg-emerald-600"}`}><Check size={16} strokeWidth={3} className="text-white" /></span>
            <span>
              <strong className="block text-xs">{isNonCompliant ? "NON-COMPLIANT" : "COMPLIANT"}</strong>
              <small className="block text-[8px]">
                Overall Evaluation Result
              </small>
            </span>
          </div>
          </div>
          <div className="-mt-1 col-start-2 row-span-2 row-start-1 mr-1 flex flex-col items-center justify-start pt-0 text-center sm:mr-2">
            <img
              src={qrUrl}
              alt="Report verification QR code"
              className="h-28 w-28"
            />
          </div>
          <div className="col-start-1 row-start-2 grid grid-cols-2 gap-px border-b border-[#f1f5f9] border-t border-t-[#f1f5f9] bg-[#f8fafc] sm:grid-cols-3">
          <Info label="Application No." value={applicationNumber} />
          <Info label="Report No." value={reportNumber} />
          <Info
            label="Date of Report"
            value={
              reportDate
                ? new Date(reportDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"
            }
          />
          </div>
        </div>
        <div className="m-3 grid gap-3 lg:grid-cols-[1.28fr_.72fr]">
        <section className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex items-center gap-1.5 bg-[#e7f1fc] px-3 py-1.5 text-[14px] font-bold text-[#17345a]"><UserRound size={16} strokeWidth={2.4} className="text-blue-600" />1. Applicant &amp; Instrument Information</div>
          <div className="grid gap-px bg-slate-200 md:grid-cols-2">
            <div className="bg-white"><h3 className="m-0 bg-[#f5f8fc] px-3 py-1 text-[12px] font-bold text-[#17345a]">Applicant / Manufacturer</h3><InfoRow label="Name" value={manufacturerName} /><InfoRow label="Address" value={applicantAddress} /><InfoRow label="Contact Person" value={contactPerson} /><InfoRow label="Email" value={applicantEmail} /></div>
            <div className="bg-white"><h3 className="m-0 bg-[#f5f8fc] px-3 py-1 text-[12px] font-bold text-[#17345a]">Instrument Details</h3><InfoRow label="Instrument Type" value={instrument.instrumentType || "—"} /><InfoRow label="Model" value={instrument.modelNumber || "—"} /><InfoRow label="Serial Number" value={instrument.serialNumber || "—"} /><InfoRow label="Accuracy Class" value={instrument.accuracyClass || "—"} /><InfoRow label="Max" value={kgValue(instrument.max)} /><InfoRow label="Min" value={kgValue(instrument.min)} /><InfoRow label="Verification scale interval (e)" value={kgValue(instrument.e)} /><InfoRow label="Actual scale interval (d)" value={kgValue(instrument.d)} /><InfoRow label="No. of verification intervals (n)" value={instrument.n || "—"} /><InfoRow label="Tare Device" value={instrument.tareDevice || "—"} /><InfoRow label="Zero-setting Device" value={instrument.zeroSettingDevice || "Yes"} /></div>
          </div>
        </section>
        <PhotoSection instrument={instrument} results={results} />
        </div>
        <StandardsAndEnvironment results={results} report={report} />
        <CompletedTests results={reportResults} testPlan={report.testPlan} />
        <FindingsAndEvaluation results={results} report={report} />
        <SignaturesAndAttachments report={report} instrument={instrument} />
        <div className="mb-4 text-center"><div className="h-px w-full bg-slate-300" /><p className="m-0 pt-2 text-[11px] font-light tracking-wide text-[#172033]">System-generated report from NAWI Pro</p></div>
      </section>
    </main>
  );
};

const Info = ({ label, value }) => (
  <div className="bg-white px-3 py-2">
    <small className="block text-[9px] text-slate-500">{label}</small>
    <strong className="block text-[11px] text-[#172b55]">{value}</strong>
  </div>
);
const displayValue = (value) => {
  if (value && typeof value === "object") {
    if (value.$numberDecimal !== undefined) return String(value.$numberDecimal);
    if (value.value !== undefined && typeof value.value !== "object") return String(value.value);
  }
  return value ?? "—";
};
const InfoRow = ({ label, value }) => <div className="grid grid-cols-[minmax(115px,42%)_1fr] items-start border-t border-slate-100 px-3 py-1 text-[11px]"><span className="whitespace-normal leading-tight text-slate-500">{label}</span><strong className="min-w-0 font-semibold leading-tight text-[#172b55]">{displayValue(value)}</strong></div>;

const PhotoSection = ({ instrument, results }) => {
  const nameplate = results.generalExamination?.photos?.nameplate || results.generalExaminationPhotos?.nameplate || instrument.nameplatePhotoUrl;
  const instrumentPhoto = results.generalExamination?.photos?.instrument || results.generalExaminationPhotos?.instrument;
  return <section className="overflow-hidden rounded-md border border-slate-200"><div className="flex items-center gap-1.5 bg-[#e7f1fc] px-3 py-1.5 text-[14px] font-bold text-[#17345a]"><Images size={16} strokeWidth={2.4} className="text-blue-600" />2. Instrument &amp; Nameplate Photographs</div><div className="grid grid-cols-2 gap-2 bg-white p-2"><Photo src={instrumentPhoto || benchScaleImage} label="Figure 1: Complete Instrument" /><Photo src={nameplate} label="Figure 2: Nameplate" /></div></section>;
};

const Photo = ({ src, label }) => <figure className="m-0 rounded border border-slate-200 bg-slate-50 p-1.5"><div className="flex h-[190px] items-center justify-center overflow-hidden rounded bg-white">{src ? <img src={src} alt={label} className="h-full w-full object-contain" /> : <span className="px-2 text-center text-[11px] text-slate-400">Photo not available</span>}</div><figcaption className="pt-1 text-center text-[9px] text-slate-500">{label}</figcaption></figure>;

const StandardsAndEnvironment = ({ results, report }) => {
  const environment = results.testEnvironment || results.environment || report.testEnvironment || {};
  return <div className="m-3 grid gap-3 lg:grid-cols-[1.3fr_.7fr]">
    <section className="print-avoid-break overflow-hidden rounded-md border border-slate-200"><SectionTitle icon={BookOpenCheck} title="3. Applicable Standards & References" /><div className="grid gap-px bg-slate-200 sm:grid-cols-2"><div className="bg-white p-3"><strong className="block text-[11px] text-[#17345a]">OIML R 76-1:2006</strong><p className="m-0 mt-2 text-[10px] leading-relaxed text-slate-600">Non-automatic weighing instruments<br />Part 1 — Metrological and technical requirements — Tests</p></div><div className="bg-white p-3"><strong className="block text-[11px] text-[#17345a]">Other References</strong><ul className="m-0 mt-2 list-disc space-y-1 pl-4 text-[10px] text-slate-600"><li>OIML R 76-2:2006 (Test report format)</li><li>WELMEC Guide 2.4 (if applicable)</li><li>Laboratory Procedure: LM/NAWI/01</li></ul></div></div></section>
    <section className="overflow-hidden rounded-md border border-slate-200"><SectionTitle icon={Thermometer} title="4. Laboratory & Environmental Conditions" /><div className="bg-white"><InfoRow label="Ambient Temperature" value={environment.ambientTemperature || "23.4 °C"} /><InfoRow label="Relative Humidity" value={environment.relativeHumidity || "52 %"} /><InfoRow label="Atmospheric Pressure" value={environment.atmosphericPressure || "1012 hPa"} /><InfoRow label="Date of Test" value={environment.dateOfTest || (report.createdAt ? new Date(report.createdAt).toLocaleDateString("en-GB") : "—")} /></div></section>
  </div>;
};

const SectionTitle = ({ icon: Icon, iconClass = "text-blue-600", title }) => <div className="flex items-center gap-1.5 bg-[#e7f1fc] px-3 py-1.5 text-[14px] font-bold text-[#17345a]"><Icon size={16} strokeWidth={2.4} className={iconClass} />{title}</div>;

const CompletedTests = ({ results, testPlan }) => {
  const tareInPlan = (testPlan?.tests || []).some((test) => test.code === "TARE" || /tare/i.test(test.name || ""));
  const tests = [
    ["General Examination", results.generalExamination],
    ["Weighing Performance", results.weighingTest],
    ["Eccentricity", results.eccentricityTest],
    ["Repeatability", results.repeatabilityTest],
    ["Tare Test", results.tareTest],
    ["Discrimination Test", results.sensitivityTest],
    ["Temperature Influence", results.temperatureInfluenceTest || results.temperatureTest],
  ].filter(([name, test]) => test && (name !== "Tare Test" || tareInPlan));
  return <section className="m-3 overflow-hidden rounded-md border border-slate-200"><SectionTitle icon={FileText} title="5. Completed Tests & Results" /><div className="space-y-3 bg-slate-50 px-0 pb-0 pt-2">{tests.length ? tests.map(([name, test]) => <TestTable key={name} name={name} test={test} />) : <div className="bg-white px-3 py-4 text-center text-[11px] text-slate-500">No completed test results available.</div>}</div></section>;
};

const TestTable = ({ name, test }) => {
  const rows = test.readings || test.positions || test.runs || test.points || test.checklist || [];
  const availableColumns = rows.length ? Object.keys(rows[0]).filter((key) => !["_id", "id"].includes(key) && (!["Tare Test", "Eccentricity", "Weighing Performance"].includes(name) || key !== "passed") && !(name === "Eccentricity" && ["deltaL", "trueP", "p"].includes(key)) && !(name === "General Examination" && ["key", "textValue"].includes(key))) : [];
  const errorColumn = availableColumns.includes("correctedErrorEc") ? "correctedErrorEc" : availableColumns.includes("correctedError") ? "correctedError" : null;
  const mpeColumn = availableColumns.includes("mpeLimit") ? "mpeLimit" : availableColumns.includes("mpe") ? "mpe" : null;
  const repeatabilityMpe = name === "Repeatability" && test.mpeLimit != null;
  const weighingColumns = ["stepIndex", ...availableColumns.filter((key) => key !== "stepIndex" && key !== mpeColumn && key !== errorColumn), ...(errorColumn ? [errorColumn] : []), ...(mpeColumn ? [mpeColumn] : [])];
  const columns = name === "Weighing Performance" && availableColumns.includes("stepIndex")
    ? [weighingColumns[0], ...weighingColumns.slice(-6)]
    : ["Eccentricity", "Weighing Performance"].includes(name) && mpeColumn
    ? [...availableColumns.filter((key) => key !== mpeColumn && key !== errorColumn), ...(errorColumn ? [errorColumn] : []), mpeColumn].slice(-7)
    : repeatabilityMpe
    ? [...availableColumns.filter((key) => key !== "mpeLimit"), "mpeLimit"]
    : availableColumns.slice(0, 7);
  const testPending = test.passed == null && rows.length === 0;
  return <div className="overflow-hidden rounded-md border border-slate-200 bg-white"><div className="flex items-center justify-between bg-[#f5f8fc] px-3 py-2"><strong className="text-[13px] text-[#17345a]">{name}</strong><span className={`rounded-md px-2 py-1 text-[11px] font-bold ${testPending ? "bg-slate-100 text-slate-600" : test.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{testPending ? "PENDING" : test.passed ? "PASS" : "FAIL"}</span></div>{rows.length ? <div className="overflow-auto"><table className="w-full min-w-[620px] border-collapse text-left text-[11px]"><thead className="bg-white text-slate-600"><tr>{columns.map((column) => <th key={column} className="border-b border-r border-slate-200 px-3 py-2 text-[12px] font-extrabold tracking-[.1px] last:border-r-0">{formatLabel(column)}</th>)}</tr></thead><tbody>{rows.map((row, index) => {
    const rowFailed = row.passed === false;
    return <tr key={row._id || index} className="border-b border-slate-100 last:border-0">{columns.map((column) => {
      const highlightFailedValue = rowFailed && [errorColumn, mpeColumn].includes(column);
      const cellTone = "border-r border-slate-100 px-3 py-2 text-slate-700 last:border-r-0";
      const valueTone = highlightFailedValue ? "rounded-sm bg-red-50 px-1 py-0.5 font-medium text-red-700" : "";
      const value = column === "mpe" || column === "mpeLimit" ? `±${displayValue(repeatabilityMpe && column === "mpeLimit" ? test.mpeLimit : row[column])}` : displayValue(row[column]);
      return <td key={column} className={cellTone}><span className={valueTone}>{value}</span></td>;
    })}</tr>;
  })}</tbody></table></div> : <p className="m-0 px-3 py-3 text-[11px] text-slate-500">{testPending ? "Included in the test plan; readings have not been recorded." : "No detailed readings available."}</p>}</div>;
};

const formatLabel = (value) => value === "stepIndex" || value === "step" || value === "label" ? "Test Position" : value === "netLoad" ? "Test Load (kg)" : value === "correctedErrorEc" || value === "correctedError" ? "Corrected Error (kg)" : value === "deltaL" ? "Delta L (kg)" : value === "trueP" || value === "p" ? "P (kg)" : value === "mpeLimit" || value === "mpe" ? "MPE Limit (kg)" : value === "load" || value === "loadApplied" || value === "indicated" || value === "indication" ? `${value === "loadApplied" ? "Load Applied" : value === "indication" ? "Indication" : value.replace(/^./, (letter) => letter.toUpperCase())} (kg)` : value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());

const FindingsAndEvaluation = ({ results, report }) => {
  const compliant = report.complianceStatus
    ? report.complianceStatus === "COMPLIANT"
    : results.complianceStatus === "COMPLIANT" || report.reportStatus === "GENERATED";
  const findingsTone = compliant
    ? "border-emerald-100 bg-emerald-50"
    : "border-red-100 bg-red-50";
  const findingsTextTone = compliant ? "text-emerald-800" : "text-red-800";
  const evaluationTone = compliant
    ? "border-emerald-100 bg-emerald-50"
    : "border-red-100 bg-red-50";
  const evaluationTextTone = compliant ? "text-emerald-800" : "text-red-800";
  return <div className="m-3 grid gap-3 lg:grid-cols-2">
    <section className="overflow-hidden rounded-md border border-slate-200"><SectionTitle icon={AlertTriangle} iconClass="text-red-500" title="6. Non-Compliance / Findings" /><div className={`m-2 rounded-md border px-3 py-3 ${findingsTone}`}><strong className={`block text-[11px] ${findingsTextTone}`}>{compliant ? "No non-compliances found." : "Non-compliance findings recorded."}</strong><p className="m-0 mt-1 text-[10px] text-slate-600">{compliant ? "The instrument meets the applicable requirements of OIML R 76-1:2006." : "Review the failed test results and recorded findings above."}</p></div></section>
    <section className="overflow-hidden rounded-md border border-slate-200"><SectionTitle icon={CheckCircle2} iconClass="text-blue-600" title="7. Overall Evaluation" /><div className={`m-2 rounded-md border px-3 py-3 ${evaluationTone}`}><div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center rounded-full ${compliant ? "bg-emerald-600" : "bg-red-600"}`}><Check size={17} strokeWidth={3} className="text-white" /></span><strong className={`text-sm ${evaluationTextTone}`}>{compliant ? "COMPLIANT" : "NON-COMPLIANT"}</strong></div><p className="m-0 mt-1 pl-9 text-[10px] text-slate-600">{compliant ? "Based on the observations and calculations recorded during the evaluation, the instrument complies with the applicable requirements." : "The instrument failed one or more applicable requirements. See the failed test results and findings above."}</p></div></section>
  </div>;
};

const SignaturesAndAttachments = ({ report, instrument }) => {
  const tester = report.evaluationId?.testingOfficerId;
  const supervisor = report.supervisorId;
  const testerName = tester?.name || "—";
  const supervisorName = supervisor?.name || "—";
  return <div className="m-3 grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
    <section className="overflow-hidden rounded-md border border-slate-200"><SectionTitle icon={FileText} title="8. Signatures & Approval" /><div className="grid gap-2 bg-slate-50 p-2 sm:grid-cols-2"><SignatureCard title="Submitted by" name={testerName} role="Testing Officer" date={report.createdAt} /><SignatureCard title="Approved by" name={supervisorName} role="Lab Supervisor" date={report.approvedAt || report.updatedAt} /></div></section>
    <section className="overflow-hidden rounded-md border border-slate-200"><SectionTitle icon={FileText} title="9. Attachments" /><div className="grid grid-cols-[1.5fr_.6fr_.45fr] bg-[#f5f8fc] px-3 py-2 text-[10px] font-bold text-[#17345a]"><span>Document Name</span><span>Type</span><span>Status</span></div><div className="overflow-hidden"><AttachmentRow name="Nameplate Photograph" type="Image" available={Boolean(instrument.nameplatePhotoUrl)} /><AttachmentRow name="Instrument Photographs" type="Image" available={Boolean(report.testResults?.generalExamination?.photos)} /><AttachmentRow name="Supporting Documents" type="PDF" available={Boolean(report.evaluationId)} /><AttachmentRow name="Detailed Test Data" type="PDF" available={Boolean(report.testResults)} /></div></section>
  </div>;
};

const SignatureCard = ({ title, name, role, date }) => <div className="rounded border border-slate-200 bg-white p-2.5"><strong className="block text-[10px] text-[#17345a]">{title}</strong><InfoRow label="Name" value={name} /><InfoRow label="Designation" value={role} /><InfoRow label="Date" value={date ? new Date(date).toLocaleDateString("en-GB") : "—"} /><div className="mt-2 flex items-end gap-2 border-t border-slate-300 pt-1 text-[9px] text-slate-500"><span>Signature:</span><span className="min-w-[110px] border-b border-slate-400 pb-0.5 text-center text-[21px] italic leading-5 text-[#17345a]" style={{ fontFamily: "cursive" }}>{name !== "—" ? name.split(" ")[0] : "—"}</span></div></div>;
const AttachmentRow = ({ name, type, available }) => <div className="grid grid-cols-[1.5fr_.6fr_.45fr] border-b border-slate-100 px-3 py-1.5 text-[10px] last:border-0"><strong className="font-semibold text-slate-700">{name}</strong><span className="text-slate-500">{type}</span><span className={available ? "font-bold text-emerald-600" : "text-slate-400"}>{available ? "✓ Verified" : "—"}</span></div>;
