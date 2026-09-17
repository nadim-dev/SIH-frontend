import React, { useEffect, useState } from "react";
import { getApprovedInspectionReportsApi } from "../api/instrumentApi";

export const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getApprovedInspectionReportsApi().then((res) => setReports(res.data || [])).finally(() => setLoading(false)); }, []);
  const printReport = (report) => {
    const i = report.instrumentId || {}; const c = report.certificate || {};
    const w = window.open("", "_blank");
    if (!w) return;
    const verificationUrl = (c.qrVerificationUrl || `${window.location.origin}/certificate/${c.certificateNumber}`).replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "https://nawipro12.netlify.app");
    const qr = `https://quickchart.io/qr?size=180&text=${encodeURIComponent(verificationUrl)}`;
    w.document.write(`<html><head><title>${c.certificateNumber}</title><style>body{font-family:Arial;max-width:760px;margin:40px auto;padding:30px;border:8px double #17345a;color:#172033}h1{text-align:center;color:#17345a}h2{border-bottom:1px solid #ddd;padding-bottom:8px}.qr{text-align:center;margin-top:20px}.qr img{width:150px}</style></head><body><h1>LEGAL METROLOGY</h1><h2>Certificate of Instrument Approval</h2><p><b>Certificate:</b> ${c.certificateNumber}</p><p><b>Instrument:</b> ${i.manufacturer || "—"} ${i.modelNumber || ""}<br><b>Serial number:</b> ${i.serialNumber || "—"}</p><table width="100%" border="1" cellpadding="10"><tr><th>Inspection module</th><th>Result</th></tr><tr><td>Weighing performance</td><td>${report.weighingTest?.passed ? "PASS" : "FAIL"}</td></tr><tr><td>Eccentricity</td><td>${report.eccentricityTest?.passed ? "PASS" : "FAIL"}</td></tr><tr><td>Repeatability</td><td>${report.repeatabilityTest?.passed ? "PASS" : "FAIL"}</td></tr></table><p><b>Issued:</b> ${new Date(c.issueDate).toLocaleDateString()}<br><b>Valid until:</b> ${new Date(c.validUntil).toLocaleDateString()}</p><div class="qr"><img src="${qr}" alt="Certificate verification QR code"><br>Scan to verify this certificate</div><script>window.onload=()=>window.print()</script></body></html>`); w.document.close();
  };
  return <main className="admin-page"><div className="admin-heading"><div><span className="eyebrow">ADMINISTRATION / REPORTS</span><h1>Approved reports</h1><p>Digitally signed inspection certificates generated after approval.</p></div><div className="admin-count"><strong>{reports.length}</strong><span>approved reports</span></div></div>{loading ? <div className="admin-state">Loading reports...</div> : reports.length === 0 ? <div className="admin-state"><strong>No approved reports</strong><span>Reports will appear here after an instrument is approved.</span></div> : <div className="admin-report-grid">{reports.map((r) => <article className="admin-report-card" key={r._id}><span className="admin-report-status">APPROVED</span><h3>{r.instrumentId?.manufacturer} {r.instrumentId?.modelNumber}</h3><p>Serial number: {r.instrumentId?.serialNumber}</p><div className="admin-report-meta"><span><small>Certificate</small><b>{r.certificate?.certificateNumber}</b></span><span><small>Issued</small><b>{r.certificate?.issueDate ? new Date(r.certificate.issueDate).toLocaleDateString() : "—"}</b></span></div><button onClick={() => printReport(r)}>View / print report →</button></article>)}</div>}</main>;
};
