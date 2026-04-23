'use client';

import { useAuthStore } from '../../../store/auth.store';
import { Building2, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    USER: 'Usuário',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie as configurações da sua conta e empresa</p>
      </div>

      {/* Company info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Building2 size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Empresa</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Nome</span>
            <span className="text-sm font-medium text-gray-900">{user?.company?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">ID da Empresa</span>
            <span className="text-xs font-mono text-gray-500">{user?.company?.id}</span>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <User size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Minha Conta</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Nome</span>
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm text-gray-900">{user?.email}</span>
          </div>
        </div>
        <button className="mt-4 w-full border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition">
          Alterar Senha
        </button>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">Permissões</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-500">Nível de acesso</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {roleLabels[user?.role || ''] || user?.role}
          </span>
        </div>
      </div>
    </div>
  );
}
