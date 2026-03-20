import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PasswordAuthForm } from "@/components/auth/password-auth-form";
import { getAppBaseUrl, getSupabasePublicEnv } from "@/lib/env";
import { loginWithPassword, signUpWithPassword } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const query = await searchParams;
  const nextPath = Array.isArray(query.next) ? query.next[0] : query.next;
  const { publicKey, url } = getSupabasePublicEnv();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 lg:px-8 lg:py-14">
      <section className="grid gap-6 md:grid-cols-2">
        <PasswordAuthForm
          action={loginWithPassword}
          buttonLabel="Sign in"
          description="Use your existing Progno account."
          nextPath={nextPath ?? "/"}
          title="Sign in"
        />
        <PasswordAuthForm
          action={signUpWithPassword}
          buttonLabel="Sign up"
          description="Create an account and start forecasting immediately."
          nextPath={nextPath ?? "/"}
          title="Sign up"
        />
      </section>

      <section>
        <GoogleAuthButton
          appBaseUrl={getAppBaseUrl()}
          nextPath={nextPath ?? "/"}
          publicKey={publicKey}
          supabaseUrl={url}
        />
      </section>
    </main>
  );
}
