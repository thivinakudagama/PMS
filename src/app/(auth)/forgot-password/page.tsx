import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "../auth-actions";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <div className="auth-logo-wrap">
        <img src="/logo.png" alt="ProjectHub logo" className="auth-logo" />
      </div>

      <div className="auth-shell">
        <section className="auth-card auth-panel">
          <div className="auth-card-head">
            <p className="eyebrow">Account recovery</p>
            <h1>Reset Password</h1>
            <p className="muted">Enter your work email and we’ll send you a secure password reset link.</p>
          </div>

          {params.error ? <div className="alert error">{params.error}</div> : null}
          {params.message ? <div className="alert success">{params.message}</div> : null}

          <form action={requestPasswordReset} className="form-stack">
            <label>
              Email Address
              <span className="input-with-icon">
                <Mail size={20} />
                <input name="email" type="email" placeholder="Enter your work email" required />
              </span>
            </label>

            <button className="button primary auth-submit" type="submit">
              Send reset link
            </button>
          </form>

          <p className="muted auth-help">
            Remembered it? <Link href="/login">Back to sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
