'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authApi.login(data) as { user: { id: string; name: string; email: string; role: string; company: { id: string; name: string } }; accessToken: string; refreshToken: string };
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Credenciais inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_60%_at_50%_0%,hsl(217_91%_60%_/_0.12),transparent)] bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-xl mb-4">
            <Building2 className="text-primary-foreground w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">ERP Sistema</h1>
          <p className="text-muted-foreground mt-1">Entre na sua conta</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/40 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
              placeholder="seu@email.com"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/60 text-primary-foreground font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta?{' '}
          <a href="/register" className="text-primary hover:underline font-medium">
            Cadastre sua empresa
          </a>
        </p>
      </div>
    </div>
  );
}
