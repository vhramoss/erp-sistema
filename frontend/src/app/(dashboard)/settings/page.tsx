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
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações da sua conta e empresa</p>
      </div>

      {/* Company info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <Building2 size={20} className="text-primary" />
          <h2 className="font-semibold text-foreground">Empresa</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Nome</span>
            <span className="text-sm font-medium text-foreground">{user?.company?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">ID da Empresa</span>
            <span className="text-xs font-mono text-muted-foreground">{user?.company?.id}</span>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <User size={20} className="text-primary" />
          <h2 className="font-semibold text-foreground">Minha Conta</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Nome</span>
            <span className="text-sm font-medium text-foreground">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm text-foreground">{user?.email}</span>
          </div>
        </div>
        <button className="mt-4 w-full border border-border hover:bg-muted text-foreground py-2 rounded-lg text-sm font-medium transition">
          Alterar Senha
        </button>
      </div>

      {/* Permissions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield size={20} className="text-primary" />
          <h2 className="font-semibold text-foreground">Permissões</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-muted-foreground">Nível de acesso</span>
          <span className="px-3 py-1 bg-primary/15 text-primary rounded-full text-xs font-medium">
            {roleLabels[user?.role || ''] || user?.role}
          </span>
        </div>
      </div>
    </div>
  );
}
