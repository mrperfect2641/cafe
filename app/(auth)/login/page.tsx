import { LoginRegisterForm } from '@/components/auth/login-register-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const sp = await searchParams;
  const initialMode = sp.mode === 'register' ? 'register' : 'login';

  return <LoginRegisterForm initialMode={initialMode} />;
}
