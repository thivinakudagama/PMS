"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an external monitoring service here if needed
  }, [error]);

  return (
    <div className="page-stack" style={{ alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
      <div className="card" style={{ maxWidth: "480px", textAlign: "center", padding: "2.5rem" }}>
        <p className="eyebrow">Error</p>
        <h1 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>
          Something went wrong
        </h1>
        <p className="muted" style={{ marginBottom: "1.5rem" }}>
          {error?.message
            ? error.message
            : "An unexpected error occurred. Please try again or contact your administrator."}
        </p>
        {error?.digest && (
          <p className="muted" style={{ fontSize: "0.75rem", marginBottom: "1rem" }}>
            Reference: {error.digest}
          </p>
        )}
        <button onClick={reset} className="button primary">
          Try again
        </button>
      </div>
    </div>
  );
}
