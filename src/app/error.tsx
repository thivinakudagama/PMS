"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center"
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", maxWidth: "40ch" }}>
            An unexpected error occurred. Please try again, or contact your
            administrator if the problem persists.
          </p>
          {error?.digest && (
            <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>
              Error reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.6rem 1.4rem",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
