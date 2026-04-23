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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'}`}>
              {type === 'INCOME' ? <TrendingUp size={18} className="text-green-600" /> : <TrendingDown size={18} className="text-red-600" />}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar Transação' : 'Nova Transação'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <div className="flex gap-2">
              {[{ value: 'INCOME', label: 'Receita', color: 'green' }, { value: 'EXPENSE', label: 'Despesa', color: 'red' }].map((opt) => (
                <label key={opt.value} className={`flex items-center gap-2 cursor-pointer flex-1 px-3 py-2.5 rounded-lg border-2 transition ${type === opt.value ? (opt.color === 'green' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-200'}`}>
                  <input {...register('type')} type="radio" value={opt.value} className="sr-only" />
                  <span className={`text-sm font-medium ${type === opt.value ? (opt.color === 'green' ? 'text-green-700' : 'text-red-700') : 'text-gray-600'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
              <input {...register('description')} placeholder="Ex: Venda de produtos, Aluguel do escritório..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select {...register('category')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input {...register('date')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
              <input {...register('dueDate')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('isPaid')} type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Marcar como pago/recebido</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea {...register('notes')} rows={2} placeholder="Observações opcionais..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          </div>

          {mutation.isError && <p className="text-red-500 text-sm text-center">Erro ao salvar transação.</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
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
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Controle de receitas e despesas</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Nova Transação
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Receitas</span>
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary?.incomeCount || 0} transações</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Despesas</span>
            <TrendingDown size={18} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense || 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{summary?.expenseCount || 0} transações</p>
        </div>
        <div className={`rounded-xl border p-5 ${(summary?.balance || 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Saldo</span>
            <DollarSign size={18} className={(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
          <p className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(summary?.balance || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Saldo atual</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transações</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Descrição</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Categoria</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Valor</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${t.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-gray-900">{t.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{categoryLabels[t.category] || t.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {t.isPaid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ open: true, transaction: t })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={15} /></button>
                        <button onClick={() => { if (confirm('Excluir esta transação?')) deleteMutation.mutate(t.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.data?.length && (
              <div className="text-center py-12 text-gray-400">
                <DollarSign size={40} className="mx-auto mb-3 opacity-50" />
                <p>Nenhuma transação encontrada</p>
                <button onClick={() => setModal({ open: true })} className="mt-3 text-blue-600 text-sm hover:underline">Registrar primeira transação</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
