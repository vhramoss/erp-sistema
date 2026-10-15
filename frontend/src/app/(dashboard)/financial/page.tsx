'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, TrendingDown, DollarSign, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { financialApi } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  isPaid: boolean;
  notes?: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

const categoryLabels: Record<string, string> = {
  SALE: 'Venda', PURCHASE: 'Compra', SALARY: 'Salário', RENT: 'Aluguel',
  UTILITIES: 'Utilidades', TAXES: 'Impostos', MAINTENANCE: 'Manutenção',
  MARKETING: 'Marketing', OTHER: 'Outros',
};

const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  description: z.string().min(2, 'Descrição muito curta'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data obrigatória'),
  dueDate: z.string().optional(),
  isPaid: z.boolean(),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

function TransactionModal({ transaction, onClose }: { transaction?: Transaction; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEditing = !!transaction;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: (transaction?.type as 'INCOME' | 'EXPENSE') || 'INCOME',
      category: transaction?.category || 'OTHER',
      description: transaction?.description || '',
      amount: transaction?.amount || 0,
      date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: transaction?.dueDate ? transaction.dueDate.split('T')[0] : '',
      isPaid: transaction?.isPaid ?? true,
      notes: transaction?.notes || '',
    },
  });

  const type = watch('type');

  const mutation = useMutation({
    mutationFn: (data: TransactionForm) =>
      isEditing ? financialApi.update(transaction!.id, data) : financialApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${type === 'INCOME' ? 'bg-emerald-500/15' : 'bg-destructive/15'}`}>
              {type === 'INCOME' ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-red-400" />}
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? 'Editar Transação' : 'Nova Transação'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tipo *</label>
            <div className="flex gap-2">
              {[{ value: 'INCOME', label: 'Receita', color: 'green' }, { value: 'EXPENSE', label: 'Despesa', color: 'red' }].map((opt) => (
                <label key={opt.value} className={`flex items-center gap-2 cursor-pointer flex-1 px-3 py-2.5 rounded-lg border-2 transition ${type === opt.value ? (opt.color === 'green' ? 'border-emerald-500 bg-emerald-500/10' : 'border-destructive bg-destructive/10') : 'border-border'}`}>
                  <input {...register('type')} type="radio" value={opt.value} className="sr-only" />
                  <span className={`text-sm font-medium ${type === opt.value ? (opt.color === 'green' ? 'text-emerald-400' : 'text-red-400') : 'text-muted-foreground'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Descrição *</label>
              <input {...register('description')} placeholder="Ex: Venda de produtos, Aluguel do escritório..." className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none" />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Valor (R$) *</label>
              <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none" />
              {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Categoria *</label>
              <select {...register('category')} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Data *</label>
              <input {...register('date')} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none" />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Vencimento</label>
              <input {...register('dueDate')} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none" />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('isPaid')} type="checkbox" className="w-4 h-4 text-primary rounded" />
                <span className="text-sm text-foreground">Marcar como pago/recebido</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Observações</label>
              <textarea {...register('notes')} rows={2} placeholder="Observações opcionais..." className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none resize-none" />
            </div>
          </div>

          {mutation.isError && <p className="text-red-400 text-sm text-center">Erro ao salvar transação.</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/60 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition">
              {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FinancialPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; transaction?: Transaction }>({ open: false });

  const { data: summary } = useQuery<Summary>({
    queryKey: ['financial-summary'],
    queryFn: () => financialApi.summary() as Promise<Summary>,
  });

  const { data, isLoading } = useQuery<{ data: Transaction[]; meta: { total: number } }>({
    queryKey: ['financial'],
    queryFn: () => financialApi.list({ limit: 50 }) as Promise<{ data: Transaction[]; meta: { total: number } }>,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });

  return (
    <div className="space-y-6">
      {modal.open && <TransactionModal transaction={modal.transaction} onClose={() => setModal({ open: false })} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de receitas e despesas</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Receitas</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary?.totalIncome || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.incomeCount || 0} transações</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Despesas</span>
            <TrendingDown size={18} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(summary?.totalExpense || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.expenseCount || 0} transações</p>
        </div>
        <div className={`rounded-xl border p-5 ${(summary?.balance || 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-destructive/10 border-destructive/40'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Saldo</span>
            <DollarSign size={18} className={(summary?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <p className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(summary?.balance || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Saldo atual</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Transações</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Descrição</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoria</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Valor</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((t) => (
                  <tr key={t.id} className="border-b border-border hover:bg-muted">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-500/100' : 'bg-destructive/100'}`} />
                        <span className="text-foreground">{t.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{categoryLabels[t.category] || t.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.isPaid ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {t.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ open: true, transaction: t })} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"><Edit size={15} /></button>
                        <button onClick={() => { if (confirm('Excluir esta transação?')) deleteMutation.mutate(t.id); }} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-destructive/10 rounded-lg transition"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.data?.length && (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign size={40} className="mx-auto mb-3 opacity-50" />
                <p>Nenhuma transação encontrada</p>
                <button onClick={() => setModal({ open: true })} className="mt-3 text-primary text-sm hover:underline">Registrar primeira transação</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
