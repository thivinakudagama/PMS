import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/login?message=Self-service sign-up is disabled. Please contact your administrator for an account.");
}
