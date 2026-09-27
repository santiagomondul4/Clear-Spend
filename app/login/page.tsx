import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const initialError = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <AuthForm mode="login" initialError={initialError} />
    </main>
  );
}
