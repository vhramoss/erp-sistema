'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingCart, Plus, X, Loader2, Trash2 } from 'lucide-react';
import { ordersApi, productsApi, customersApi } from '../../../lib/api';
import { formatCurrency, formatDate } from '../../../lib/utils';

interface Order {
  id: string;
  number: number;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  customer?: { name: string };
  _count: { items: number };
}

interface Product { id: string; name: string; price: number; stock: number; }
interface Customer { id: string; name: string; }

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400', CONFIRMED: 'bg-primary/15 text-primary',
  PROCESSING: 'bg-violet-500/15 text-violet-400', SHIPPED: 'bg-indigo-500/15 text-indigo-400',
  DELIVERED: 'bg-emerald-500/15 text-emerald-400', CANCELLED: 'bg-destructive/15 text-red-400',
  REFUNDED: 'bg-muted text-foreground',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente', CONFIRMED: 'Confirmado', PROCESSING: 'Processando',
  SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado', REFUNDED: 'Estornado',
};

const paymentLabels: Record<string, string> = {
  CASH: 'Dinheiro', CREDIT_CARD: 'Cartão Crédito', DEBIT_CARD: 'Cartão Débito',
  PIX: 'PIX', BANK_TRANSFER: 'Transferência', BOLETO: 'Boleto',
};

const orderSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
  discount: z.coerce.number().min(0).default(0),
  items: z.array(z.object({
    productId: z.string().min(1, 'Selecione um produto'),
    quantity: z.coerce.number().int().min(1, 'Mínimo 1'),
    price: z.coerce.number().min(0.01),
    discount: z.coerce.number().min(0).default(0),
  })).min(1, 'Adicione pelo menos um item'),
});

type OrderForm = z.infer<typeof orderSchema>;

function OrderModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ['products-select'],
    queryFn: () => productsApi.list({ limit: 100 }) as Promise<{ data: Product[] }>,
  });

  const { data: customersData } = useQuery<{ data: Customer[] }>({
    queryKey: ['customers-select'],
    queryFn: () => customersApi.list({ limit: 100 }) as Promise<{ data: Customer[] }>,
  });

  const products = productsData?.data || [];
  const customers = customersData?.data || [];

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: '',
      paymentMethod: 'CASH',
      notes: '',
      discount: 0,
      items: [{ productId: '', quantity: 1, price: 0, discount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchDiscount = watch('discount');

  const subtotal = watchItems?.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity)) - Number(item.discount || 0);
  }, 0) || 0;
  const total = Math.max(0, subtotal - Number(watchDiscount || 0));

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) setValue(`items.${index}.price`, product.price);
  };

  const mutation = useMutation({
    mutationFn: (data: OrderForm) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/15 rounded-lg flex items-center justify-center">
              <ShoppingCart size={18} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Novo Pedido</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Cliente</label>
              <select {...register('customerId')} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none">
                <option value="">Consumidor final</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pagamento *</label>
              <select {...register('paymentMethod')} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none">
                {Object.entries(paymentLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Itens do Pedido *</label>
              <button type="button" onClick={() => append({ productId: '', quantity: 1, price: 0, discount: 0 })} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus size={12} /> Adicionar item
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => {
                const itemTotal = (Number(watchItems?.[index]?.price || 0) * Number(watchItems?.[index]?.quantity || 0)) - Number(watchItems?.[index]?.discount || 0);
                return (
                  <div key={field.id} className="bg-background rounded-lg p-3">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select
                          {...register(`items.${index}.productId`)}
                          onChange={(e) => { register(`items.${index}.productId`).onChange(e); handleProductChange(index, e.target.value); }}
                          className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:ring-2 focus:ring-ring outline-none"
                        >
                          <option value="">Selecionar produto</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Estq: {p.stock})</option>)}
                        </select>
                        {errors.items?.[index]?.productId && <p className="text-red-400 text-xs mt-0.5">{errors.items[index]?.productId?.message}</p>}
                      </div>
                      <div className="col-span-2">
                        <input {...register(`items.${index}.quantity`)} type="number" min="1" placeholder="Qtd" className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:ring-2 focus:ring-ring outline-none" />
                      </div>
                      <div className="col-span-2">
                        <input {...register(`items.${index}.price`)} type="number" step="0.01" placeholder="Preço" className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:ring-2 focus:ring-ring outline-none" />
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-xs font-semibold text-foreground">{formatCurrency(Math.max(0, itemTotal))}</span>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-red-400 transition"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Desconto Geral (R$)</label>
              <input {...register('discount')} type="number" step="0.01" min="0" placeholder="0.00" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Observações</label>
              <input {...register('notes')} placeholder="Opcional" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-ring outline-none" />
            </div>
          </div>

          {/* Totais */}
          <div className="bg-background rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {Number(watchDiscount) > 0 && <div className="flex justify-between text-red-400"><span>Desconto</span><span>- {formatCurrency(Number(watchDiscount))}</span></div>}
            <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2 mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>

          {mutation.isError && (
            <p className="text-red-400 text-sm text-center">
              {(mutation.error as any)?.response?.data?.message ||
               (mutation.error as any)?.message ||
               "Erro ao criar pedido. Verifique os dados."}
            </p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/60 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition">
              {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
              Criar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);

  const { data, isLoading } = useQuery<{ data: Order[]; meta: { total: number } }>({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.list({ status: statusFilter || undefined, limit: 50 }) as Promise<{ data: Order[]; meta: { total: number } }>,
  });

  return (
    <div className="space-y-6">
      {modal && <OrderModal onClose={() => setModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.meta?.total || 0} pedidos no total</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Novo Pedido
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border flex gap-2 flex-wrap">
          <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!statusFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>Todos</button>
          {Object.entries(statusLabels).map(([s, label]) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>{label}</button>
          ))}
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
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cliente</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Itens</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pagamento</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Total</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">#{order.number}</td>
                    <td className="px-4 py-3 text-foreground">{order.customer?.name || 'Consumidor final'}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{order._count?.items ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{paymentLabels[order.paymentMethod] || order.paymentMethod}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.data?.length && (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-50" />
                <p>Nenhum pedido encontrado</p>
                <button onClick={() => setModal(true)} className="mt-3 text-primary text-sm hover:underline">Criar primeiro pedido</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
