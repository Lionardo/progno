import { PasswordAuthPanel } from "@/components/auth/password-auth-panel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const query = await searchParams;
  const nextPath = Array.isArray(query.next) ? query.next[0] : query.next;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10 lg:px-8 lg:py-14">
      <PasswordAuthPanel nextPath={nextPath ?? "/"} />
      {/* TODO - add Google auth back in, but need to figure out how to handle the redirect flow with Next.js 13 app directory first */}
      {/* <section>
        <GoogleAuthButton
          appBaseUrl={getAppBaseUrl()}
          nextPath={nextPath ?? "/"}
          publicKey={publicKey}
          supabaseUrl={url}
        />
      </section> */}
    </main>
  );
}
