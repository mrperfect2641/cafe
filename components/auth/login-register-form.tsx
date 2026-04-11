'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthMarketingPanel, AuthSplitShell } from '@/components/auth/auth-split-shell';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Enter your name').max(80),
  email: z.string().email('Enter a valid email').max(120),
  password: z.string().min(6, 'At least 6 characters').max(72),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const inputClass =
  'border-0 bg-[#222] text-white shadow-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-[#ff9800]/50';

type Mode = 'login' | 'register';

function postLoginPath(role: string): string {
  if (role === 'ADMIN' || role === 'MANAGER') return '/dashboard';
  return '/billing';
}

export function LoginRegisterForm({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [submitting, setSubmitting] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: useMemo(() => ({ email: '', password: '' }), []),
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: useMemo(() => ({ name: '', email: '', password: '' }), []),
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.role) return;
    router.replace(postLoginPath(session.user.role));
  }, [router, session?.user?.role, status]);

  async function onLogin(values: LoginValues) {
    setSubmitting(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      if (!res?.ok) {
        toast.error('Invalid email or password.');
        return;
      }
      toast.success('Signed in');
    } finally {
      setSubmitting(false);
    }
  }

  async function onRegister(values: RegisterValues) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(json?.error ?? 'Registration failed.');
        return;
      }
      toast.success('Account created — you can sign in now.');
      registerForm.reset();
      setMode('login');
    } catch {
      toast.error('Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitShell>
      <AuthMarketingPanel />

      <div className="flex w-full flex-col justify-center px-8 py-10 md:w-[55%] md:px-12 md:py-12">
        {/* Login */}
        <div className={cn('flex flex-col', mode !== 'login' && 'hidden')}>
          <h2 className="mb-6 text-xl font-semibold">Login</h2>
          <form className="flex flex-col gap-4" onSubmit={loginForm.handleSubmit(onLogin)}>
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                className={inputClass}
                {...loginForm.register('email')}
              />
              {loginForm.formState.errors.email ? (
                <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-zinc-300">
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                className={inputClass}
                {...loginForm.register('password')}
              />
              {loginForm.formState.errors.password ? (
                <p className="text-sm text-red-400">
                  {loginForm.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={submitting || status === 'loading'}
              className="mt-2 w-full bg-[#ff9800] font-semibold text-black hover:bg-[#ff5722]"
            >
              Login
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 cursor-pointer text-center text-sm text-[#ff9800] hover:underline"
            onClick={() => setMode('register')}
          >
            Create Account
          </button>
        </div>

        {/* Register */}
        <div className={cn('flex flex-col', mode !== 'register' && 'hidden')}>
          <h2 className="mb-6 text-xl font-semibold">Register</h2>
          <p className="mb-4 text-xs text-zinc-400">
            New accounts are created as <strong className="text-zinc-300">Staff</strong>. Contact an
            admin for Admin or Manager access.
          </p>
          <form className="flex flex-col gap-4" onSubmit={registerForm.handleSubmit(onRegister)}>
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-zinc-300">
                Full Name
              </Label>
              <Input
                id="reg-name"
                placeholder="Full Name"
                className={inputClass}
                {...registerForm.register('name')}
              />
              {registerForm.formState.errors.name ? (
                <p className="text-sm text-red-400">{registerForm.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                className={inputClass}
                {...registerForm.register('email')}
              />
              {registerForm.formState.errors.email ? (
                <p className="text-sm text-red-400">
                  {registerForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-zinc-300">
                Password
              </Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="Password"
                className={inputClass}
                {...registerForm.register('password')}
              />
              {registerForm.formState.errors.password ? (
                <p className="text-sm text-red-400">
                  {registerForm.formState.errors.password.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-[#ff9800] font-semibold text-black hover:bg-[#ff5722]"
            >
              Register
            </Button>
          </form>
          <button
            type="button"
            className="mt-4 cursor-pointer text-center text-sm text-[#ff9800] hover:underline"
            onClick={() => setMode('login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    </AuthSplitShell>
  );
}
