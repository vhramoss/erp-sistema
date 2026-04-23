'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Users, Phone, Mail, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { customersApi } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
}

const customerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

function CustomerModal({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      type: (customer?.type as 'INDIVIDUAL' | 'COMPANY') || 'INDIVIDUAL',
      email: customer?.email || '',
      phone: customer?.phone || '',
      document: customer?.document || '',
      address: customer?.address || '',
      city: customer?.city || '',
      state: customer?.state || '',
      notes: customer?.notes || '',
    },
  });

  const type = watch('type');

  const mutation = useMutation({
    mutationFn: (data: CustomerForm) =>
      isEditing ? customersApi.update(customer!.id, data) : customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <div className="flex gap-2">
              {[{ value: 'INDIVIDUAL', label: 'Pessoa Física' }, { value: 'COMPANY', label: 'Pessoa Jurídica' }].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer flex-1">
                  <input {...register('type')} type="radio" value={opt.value} className="text-blue-600" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input {...register('name')} placeholder={type === 'INDIVIDUAL' ? 'João Silva' : 'Empresa XYZ Ltda'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{type === 'INDIVIDUAL' ? 'CPF' : 'CNPJ'}</label>
              <input {...register('document')} placeholder={type === 'INDIVIDUAL' ? '000.000.000-00' : '00.000.000/0000-00'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input {...register('phone')} placeholder="(11) 99999-9999" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" placeholder="contato@email.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input {...register('address')} placeholder="Rua, número, bairro" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input {...register('city')} placeholder="São Paulo" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input {...register('state')} placeholder="SP" maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea {...register('notes')} rows={2} placeholder="Anotações sobre o cliente..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
          </div>

          {mutation.isError && <p className="text-red-500 text-sm text-center">Erro ao salvar cliente.</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
              {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
              {isEditing ? 'Salvar alterações' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; customer?: Customer }>({ open: false });

  const { data, isLoading } = useQuery<{ data: Customer[]; meta: { total: number } }>({
    queryKey: ['customers', search],
    queryFn: () => customersApi.list({ search: search || undefined, limit: 50 }) as Promise<{ data: Customer[]; meta: { total: number } }>,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  return (
    <div className="space-y-6">
      {modal.open && <CustomerModal customer={modal.customer} onClose={() => setModal({ open: false })} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.meta?.total || 0} clientes cadastrados</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, email..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full max-w-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
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
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Contato</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Tipo</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Pedidos</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Cadastro</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {customer.email && <div className="flex items-center gap-1 text-gray-500 text-xs"><Mail size={11} /> {customer.email}</div>}
                        {customer.phone && <div className="flex items-center gap-1 text-gray-500 text-xs"><Phone size={11} /> {customer.phone}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-500">{customer.type === 'INDIVIDUAL' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{customer._count?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {customer.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ open: true, customer })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={15} /></button>
                        <button onClick={() => { if (confirm(`Excluir "${customer.name}"?`)) deleteMutation.mutate(customer.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.data?.length && (
              <div className="text-center py-12 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <p>Nenhum cliente encontrado</p>
                <button onClick={() => setModal({ open: true })} className="mt-3 text-blue-600 text-sm hover:underline">Cadastrar primeiro cliente</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
