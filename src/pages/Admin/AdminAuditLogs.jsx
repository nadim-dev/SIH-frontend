import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export const AdminAuditLogs = () => {
  const { setHeaderContent } = useOutletContext();

  useEffect(() => {
    setHeaderContent({
      title: "Audit logs",
      subtitle: "Track important actions and changes across the NAWI Pro system",
    });
  }, [setHeaderContent]);

  return (
    <main className="admin-page">
      <div className="admin-state">
        <strong>No audit logs yet</strong>
        <span>Administrative activity will appear here once audit logging is enabled.</span>
      </div>
    </main>
  );
};
