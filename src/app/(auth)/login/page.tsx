import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { signIn } from "../auth-actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-page">
      <div className="auth-logo-wrap">
        <img src="/logo.png" alt="ProjectHub logo" className="auth-logo" />
      </div>

      <div className="auth-shell">
        <section className="auth-card auth-panel">
          <div className="auth-card-head">
            <p className="eyebrow">ProjectHub Workspace</p>
            <h1>Sign In</h1>
            <p className="muted">Access your project management workspace with your assigned account.</p>
          </div>

          {params.error ? <div className="alert error">{params.error}</div> : null}
          {params.message ? <div className="alert success">{params.message}</div> : null}

          <form action={signIn} className="form-stack">
            <label>
              Email Address
              <span className="input-with-icon">
                <Mail size={20} />
                <input name="email" type="email" placeholder="Enter your work email" required />
              </span>
            </label>

            <label>
              Password
              <span className="input-with-icon">
                <Lock size={20} />
                <input name="password" type="password" placeholder="Enter your password" required />
              </span>
            </label>

            <button className="button primary auth-submit" type="submit">
              Continue
            </button>
          </form>

          <p className="muted auth-help">
            <Link href="/forgot-password">Forgot your password?</Link>
          </p>

          <p className="muted auth-help">
            Need access? <Link href="/signup">Contact your administrator</Link>
          </p>
        </section>
      </div>

      <p className="auth-footer">© 2026 ProjectHub. All rights reserved.</p>
    </main>
  );
}
