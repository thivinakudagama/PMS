import Link from "next/link";
import { Lock } from "lucide-react";
import { updatePassword } from "../auth-actions";

type UpdatePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <div className="auth-logo-wrap">
        <img src="/logo.png" alt="ProjectHub logo" className="auth-logo" />
      </div>

      <div className="auth-shell">
        <section className="auth-card auth-panel">
          <div className="auth-card-head">
            <p className="eyebrow">Security</p>
            <h1>Create New Password</h1>
            <p className="muted">Choose a strong new password for your workspace account.</p>
          </div>

          {params.error ? <div className="alert error">{params.error}</div> : null}
          {params.message ? <div className="alert success">{params.message}</div> : null}

          <form action={updatePassword} className="form-stack">
            <label>
              New password
              <span className="input-with-icon">
                <Lock size={20} />
                <input name="password" type="password" minLength={8} placeholder="Minimum 8 characters" required />
              </span>
            </label>

            <label>
              Confirm password
              <span className="input-with-icon">
                <Lock size={20} />
                <input
                  name="confirm_password"
                  type="password"
                  minLength={8}
                  placeholder="Re-enter your new password"
                  required
                />
              </span>
            </label>

            <button className="button primary auth-submit" type="submit">
              Update password
            </button>
          </form>

          <p className="muted auth-help">
            Need to go back? <Link href="/login">Return to sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
