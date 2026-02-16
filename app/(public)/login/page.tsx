import { auth, signIn, signOut } from "@/auth";
import SubmitButton from "@/components/ui/submit-button";
import { isEmailAllowed } from "@/lib/auth/access";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session && isEmailAllowed(session.user?.email)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard";
  const authError = typeof params.error === "string" ? params.error : "";
  const showAccessDenied = authError === "AccessDenied";

  return (
    <main className="container" style={{ display: "grid", placeItems: "center" }}>
      <section className="card" style={{ width: "min(100%, 420px)" }}>
        <h1 style={{ marginTop: 0 }}>Attendance Tracker</h1>
        <p className="muted">Sign in with Google to continue.</p>
        {showAccessDenied ? (
          <div className="inline-alert error">
            <strong>Access denied.</strong> This account is not allowlisted for this app.
          </div>
        ) : null}

        {session && !isEmailAllowed(session.user?.email) ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            style={{ marginBottom: 12 }}
          >
            <SubmitButton className="button secondary" pendingText="Signing out..." style={{ width: "100%" }}>
              Sign out restricted account
            </SubmitButton>
          </form>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <SubmitButton className="button" pendingText="Signing in..." style={{ width: "100%" }}>
            Sign in with Google
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
