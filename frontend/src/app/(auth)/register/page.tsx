'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2 } from 'lucide-react';
import { authApi } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';

// Valida CNPJ pelo algoritmo dos dígitos verificadores
function isValidCNPJ(cnpj: string): boolean {
  // Remove formatação
  const digits = cnpj.replace(/\D/g, '');

  // Deve ter 14 dígitos
  if (digits.length !== 14) return false;

  // Rejeita sequências iguais (ex: 00000000000000)
  if (/^(\d)\1+$/.test(digits)) return false;

  // Calcula primeiro dígito verificador
  const calc = (d: string, len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };

  const d1 = calc(digits, 12);
  if (d1 !== parseInt(digits[12])) return false;

  const d2 = calc(digits, 13);
  if (d2 !== parseInt(digits[13])) return false;

  return true;
}

const schema = z.object({
  companyName: z.string().min(2, 'Nome muito curto').max(255),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Formato inválido (00.000.000/0000-00)')
    .refine(isValidCNPJ, { message: 'CNPJ inválido' }),
  companyEmail: z.string().email('Email inválido'),
  adminName: z.string().min(2, 'Nome muito curto'),
  adminEmail: z.string().email('Email inválido'),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Senha deve ter maiúscula, minúscula, número e caractere especial',
  }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authApi.register(data) as { user: { id: string; name: string; email: string; role: string; company: { id: string; name: string } }; accessToken: string; refreshToken: string };
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Erro ao cadastrar empresa');
    }
  };

  const fields = [
    { name: 'companyName' as const, label: 'Nome da Empresa', type: 'text', placeholder: 'Empresa XYZ Ltda' },
    { name: 'cnpj' as const, label: 'CNPJ', type: 'text', placeholder: '00.000.000/0000-00' },
    { name: 'companyEmail' as const, label: 'Email da Empresa', type: 'email', placeholder: 'contato@empresa.com' },
    { name: 'adminName' as const, label: 'Seu Nome', type: 'text', placeholder: 'João Silva' },
    { name: 'adminEmail' as const, label: 'Seu Email', type: 'email', placeholder: 'admin@empresa.com' },
    { name: 'password' as const, label: 'Senha', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-4">
            <Building2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastrar Empresa</h1>
          <p className="text-gray-500 mt-1">Crie sua conta no ERP Sistema</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
            {isSubmitting ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">Entrar</a>
        </p>
      </div>
    </div>
  );
}
