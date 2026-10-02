import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyCertificateApi } from "../api/instrumentApi";

export const CertificateVerification = () => {
  const { number } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    verifyCertificateApi(number)
      .then(setData)
      .catch((e) =>
        setError(e.data?.message || "Certificate could not be verified."),
      );
  }, [number]);
  if (error)
    return (
      <main className="certificate-page">
        <section className="certificate-card">
          <h1>Certificate not found</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  if (!data)
    return (
      <main className="certificate-page">
        <section className="certificate-card">
          <p>Verifying certificate...</p>
        </section>
      </main>
    );
  const i = data.instrument;
  const c = data.certificate;
  return (
    <main className="certificate-page">
      <section className="certificate-card">
        <span className={`certificate-valid ${data.valid ? "" : "invalid"}`}>
          {data.valid ? "✓ VALID CERTIFICATE" : "✕ EXPIRED CERTIFICATE"}
        </span>
        <h1>Legal Metrology Certificate</h1>
        <p className="certificate-number">{c.certificateNumber}</p>
        <div className="certificate-info">
          <p>
            <small>Instrument</small>
            <strong>
              {i.manufacturer} {i.modelNumber}
            </strong>
          </p>
          <p>
            <small>Serial number</small>
            <strong>{i.serialNumber}</strong>
          </p>
          <p>
            <small>Issued</small>
            <strong>{new Date(c.issueDate).toLocaleDateString()}</strong>
          </p>
          <p>
            <small>Valid until</small>
            <strong>{new Date(c.validUntil).toLocaleDateString()}</strong>
          </p>
        </div>
        <h2>Inspection results</h2>
        {Object.entries(data.tests).map(([name, passed]) => (
          <div className="certificate-test" key={name}>
            <span>{name}</span>
            <strong>{passed ? "PASS" : "FAIL"}</strong>
          </div>
        ))}
        <p className="certificate-note">
          This certificate was digitally issued by the NAWI Legal Metrology
          system.
        </p>
      </section>
    </main>
  );
};
