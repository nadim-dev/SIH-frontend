import React, { useEffect, useState } from "react";
import {
  approveInspectionApi,
  getApprovedInspectionReportsApi,
  getPendingApprovalInspectionsApi,
} from "../../api/instrumentApi";

const value = (item) => {
  if (item === undefined || item === null) return "—";
  if (typeof item === "object") {
    // Decimal128 values may be serialized by MongoDB as {$numberDecimal: "..."}.
    if (item.$numberDecimal !== undefined) return String(item.$numberDecimal);
    if (item.value !== undefined && typeof item.value !== "object")
      return String(item.value);
  }
  return String(item);
};

const TestRows = ({ title, test }) => {
  const rows = test?.readings || test?.positions || test?.runs || [];
  return (
    <section className="admin-test-section">
      <div className="admin-test-heading">
        <h3>{title}</h3>
        <span className={`admin-result ${test?.passed ? "passed" : "failed"}`}>
          {test?.passed ? "PASS" : "NOT PASSED"}
        </span>
      </div>
      {rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Test case</th>
                <th>Load</th>
                <th>Indicated</th>
                <th>Corrected error</th>
                <th>MPE limit</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${row.stepIndex ?? index}`}>
                  <td>{value(row.stepIndex ?? index + 1)}</td>
                  <td>{value(row.label)}</td>
                  <td>{value(row.load)}</td>
                  <td>{value(row.indicated)}</td>
                  <td>{value(row.correctedErrorEc)}</td>
                  <td>{value(row.mpeLimit)}</td>
                  <td>
                    <span className="admin-row-pass">
                      {row.passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty-test">
          No test-case readings were submitted.
        </p>
      )}
    </section>
  );
};

export const AdminDashbaord = () => {
  const [inspections, setInspections] = useState([]);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  const loadInspections = async () => {
    setLoading(true);
    setError("");
    try {
      const [response, reportResponse] = await Promise.all([
        getPendingApprovalInspectionsApi(),
        getApprovedInspectionReportsApi(),
      ]);
      setInspections(response.data || []);
      setReports(reportResponse.data || []);
    } catch (err) {
      setError(
        err.data?.message || err.message || "Failed to load approval requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const approve = async () => {
    const instrument = selected?.instrumentId;
    if (
      !instrument ||
      selected.allTestsPassed !== true ||
      selected.inspectionStatus !== "PENDING_APPROVAL"
    )
      return;
    setApproving(true);
    setError("");
    try {
      const response = await approveInspectionApi(instrument._id);
      openCertificateReport(
        selected,
        response.certificate,
        response.digitalSignatureToken,
      );
      setSelected(null);
      await loadInspections();
    } catch (err) {
      setError(
        err.data?.message || err.message || "Failed to approve instrument.",
      );
    } finally {
      setApproving(false);
    }
  };

  const openCertificateReport = (inspection, certificate, signature) => {
    const instrument = inspection.instrumentId || {};
    const tests = ["weighingTest", "eccentricityTest", "repeatabilityTest"];
    const rows = tests
      .map(
        (key) =>
          `<tr><td>${key.replace("Test", " test")}</td><td>${inspection[key]?.passed ? "PASS" : "FAIL"}</td></tr>`,
      )
      .join("");
    const verificationUrl = (
      certificate.qrVerificationUrl ||
      `${window.location.origin}/certificate/${certificate.certificateNumber}`
    ).replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
      "https://nawipro12.netlify.app",
    );
    const qrUrl = `https://quickchart.io/qr?size=180&text=${encodeURIComponent(verificationUrl)}`;
    const report = `<!doctype html><html><head><title>${certificate.certificateNumber}</title><style>body{font-family:Arial;color:#172033;max-width:800px;margin:40px auto;padding:25px;border:8px double #17345a}h1{text-align:center;color:#17345a}h2{font-size:18px;border-bottom:1px solid #ddd;padding-bottom:8px}p{line-height:1.6}.label{color:#64748b;font-size:12px}.qr{text-align:center;margin-top:20px}.qr img{width:150px;height:150px}.qr small{display:block;color:#64748b}</style></head><body><h1>LEGAL METROLOGY</h1><h2>Certificate of Instrument Approval</h2><p><span class="label">Certificate number</span><br><strong>${certificate.certificateNumber}</strong></p><p><span class="label">Instrument</span><br><strong>${instrument.manufacturer || "—"} ${instrument.modelNumber || ""}</strong><br>Serial number: ${instrument.serialNumber || "—"}</p><table width="100%" cellpadding="10" border="1" cellspacing="0"><tr><th>Inspection module</th><th>Result</th></tr>${rows}</table><p>Issued: ${new Date(certificate.issueDate).toLocaleDateString()}<br>Valid until: ${new Date(certificate.validUntil).toLocaleDateString()}<br>Approved by: Administrator</p><div class="qr"><img src="${qrUrl}" alt="Certificate verification QR code"><small>Scan to verify this certificate</small></div><script>window.onload=()=>window.print()</script></body></html>`;
    const reportWindow = window.open("", "_blank");
    if (reportWindow) {
      reportWindow.document.write(report);
      reportWindow.document.close();
    }
  };

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION / MAKER-CHECKER</span>
          <h1>Instrument approvals</h1>
          <p>
            Review every passed test case before approving an instrument
            request.
          </p>
        </div>
        <div className="admin-count">
          <strong>{inspections.length}</strong>
          <span>pending requests</span>
        </div>
      </div>
      {error && <div className="testing-error-banner">{error}</div>}
      {loading ? (
        <div className="admin-state">Loading approval requests...</div>
      ) : inspections.length === 0 ? (
        <div className="admin-state">
          <strong>No approval requests</strong>
          <span>Instruments appear here after all physical tests pass.</span>
        </div>
      ) : (
        <div className="admin-layout">
          <aside className="admin-request-list">
            <h2>Pending requests</h2>
            {inspections.map((inspection) => {
              const instrument = inspection.instrumentId;
              return (
                <button
                  key={inspection._id}
                  className={`admin-request ${selected?._id === inspection._id ? "active" : ""}`}
                  onClick={() => setSelected(inspection)}
                >
                  <strong>
                    {instrument?.manufacturer} {instrument?.modelNumber}
                  </strong>
                  <span>Serial: {instrument?.serialNumber}</span>
                  <small>All test cases passed</small>
                </button>
              );
            })}
          </aside>
          {selected && (
            <section className="admin-details">
              <div className="admin-summary">
                <div className="admin-details-top">
                  <div>
                    <span className="eyebrow">INSPECTION DETAILS</span>
                    <h2>
                      {selected.instrumentId?.manufacturer}{" "}
                      {selected.instrumentId?.modelNumber}
                    </h2>
                    <p>
                      Serial number:{" "}
                      <strong>{selected.instrumentId?.serialNumber}</strong>
                    </p>
                  </div>
                  <span className="admin-pending-badge">PENDING APPROVAL</span>
                </div>
                <div className="admin-specs">
                  <span>
                    <small>Instrument type</small>
                    <strong>
                      {value(selected.instrumentId?.instrumentType)}
                    </strong>
                  </span>
                  <span>
                    <small>Accuracy class</small>
                    <strong>
                      {value(selected.instrumentId?.accuracyClass)}
                    </strong>
                  </span>
                  <span>
                    <small>Capacity</small>
                    <strong>
                      {value(selected.instrumentId?.min)}–
                      {value(selected.instrumentId?.max)}{" "}
                      {value(selected.instrumentId?.unit)}
                    </strong>
                  </span>
                  <span>
                    <small>Tested by</small>
                    <strong>{value(selected.testedBy?.officerName)}</strong>
                  </span>
                </div>
                <div className="admin-all-passed">
                  ✓ All physical test modules passed. The request is eligible
                  for administrator approval.
                </div>
              </div>
              <div className="admin-tests">
                <TestRows
                  title="Weighing performance test"
                  test={selected.weighingTest}
                />
                <TestRows
                  title="Eccentricity test"
                  test={selected.eccentricityTest}
                />
                <TestRows
                  title="Repeatability test"
                  test={selected.repeatabilityTest}
                />
              </div>
              <div className="admin-approval-footer">
                <p>
                  Approve only after verifying the submitted readings and
                  results above.
                </p>
                <button
                  onClick={approve}
                  disabled={
                    approving ||
                    selected.allTestsPassed !== true ||
                    selected.inspectionStatus !== "PENDING_APPROVAL"
                  }
                >
                  {approving ? "Approving..." : "Approve instrument request"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
      <section className="admin-reports">
        <div className="admin-reports-heading">
          <div>
            <span className="eyebrow">CERTIFICATES / REPORTS</span>
            <h2>Approved inspection reports</h2>
            <p>Generated certificates remain available here after approval.</p>
          </div>
          <strong>{reports.length} reports</strong>
        </div>
        {reports.length === 0 ? (
          <p className="admin-reports-empty">
            No approved reports have been generated yet.
          </p>
        ) : (
          <div className="admin-report-grid">
            {reports.map((report) => (
              <article className="admin-report-card" key={report._id}>
                <span className="admin-report-status">APPROVED</span>
                <h3>
                  {report.instrumentId?.manufacturer}{" "}
                  {report.instrumentId?.modelNumber}
                </h3>
                <p>Serial number: {report.instrumentId?.serialNumber}</p>
                <div className="admin-report-meta">
                  <span>
                    <small>Certificate</small>
                    <b>{report.certificate?.certificateNumber}</b>
                  </span>
                  <span>
                    <small>Issued</small>
                    <b>
                      {report.certificate?.issueDate
                        ? new Date(
                            report.certificate.issueDate,
                          ).toLocaleDateString()
                        : "—"}
                    </b>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openCertificateReport(
                      report,
                      report.certificate,
                      report.supervisorAudit?.digitalSignatureToken,
                    )
                  }
                >
                  View / print report →
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
