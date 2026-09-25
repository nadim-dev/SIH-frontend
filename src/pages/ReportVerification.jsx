import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyReportApi } from "../api/instrumentApi";

export const ReportVerification = () => {
  const { reportId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { verifyReportApi(reportId).then((response) => setData(response.data || response)).catch((e) => setError(e.response?.data?.message || "Report could not be verified.")); }, [reportId]);
  if (error) return <main className="certificate-page"><section className="certificate-card"><h1>Report not found</h1><p>{error}</p></section></main>;
  if (!data) return <main className="certificate-page"><section className="certificate-card"><p>Verifying report...</p></section></main>;
  const report = data.report || {};
  const instrument = report.instrument || {};
  return <main className="certificate-page"><section className="certificate-card"><span className={`certificate-valid ${data.valid ? "" : "invalid"}`}>{data.valid ? "✓ VALID REPORT" : "✕ REPORT VERIFICATION FAILED"}</span><h1>Instrument Test Report</h1><p className="certificate-number">{report.reportId}</p><div className="certificate-info"><p><small>Manufacturer</small><strong>{instrument.manufacturer || "—"}</strong></p><p><small>Model</small><strong>{instrument.modelNumber || "—"}</strong></p><p><small>Serial number</small><strong>{instrument.serialNumber || "—"}</strong></p><p><small>Approved</small><strong>{report.approvedAt ? new Date(report.approvedAt).toLocaleDateString() : "—"}</strong></p><p><small>Result</small><strong>{report.complianceStatus || "—"}</strong></p></div><p className="certificate-note">This report was verified by the NAWI Legal Metrology system.</p></section></main>;
};
