'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { productsApi } from '../../../lib/api';
import { formatCurrency } from '../../../lib/utils';

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
  category?: { name: string };
}

// Schema de validação do formulário
const productSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(255),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, 'Preço deve ser maior que zero'),
  cost: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0, 'Estoque não pode ser negativo'),
  minStock: z.coerce.number().int().min(0),
  unit: z.string().min(1),
});

type ProductForm = z.infer<typeof productSchema>;

// Modal de criação/edição
function ProductModal({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      description: product?.description || '',
      price: product?.price || 0,
      cost: product?.cost || 0,
      stock: product?.stock ?? 0,
      minStock: product?.minStock ?? 0,
      unit: product?.unit || 'un',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ProductForm) =>
      isEditing
        ? productsApi.update(product!.id, data)
        : productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const fields = [
    { name: 'name' as const, label: 'Nome do Produto *', type: 'text', placeholder: 'Ex: Camiseta Polo', col: 2 },
    { name: 'sku' as const, label: 'SKU', type: 'text', placeholder: 'Ex: CAM-001', col: 1 },
    { name: 'unit' as const, label: 'Unidade', type: 'text', placeholder: 'un, kg, cx...', col: 1 },
    { name: 'price' as const, label: 'Preço de Venda (R$) *', type: 'number', placeholder: '0.00', col: 1 },
    { name: 'cost' as const, label: 'Custo (R$)', type: 'number', placeholder: '0.00', col: 1 },
    { name: 'stock' as const, label: 'Estoque Atual', type: 'number', placeholder: '0', col: 1 },
    { name: 'minStock' as const, label: 'Estoque Mínimo', type: 'number', placeholder: '0', col: 1 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ name, label, type, placeholder, col }) => (
              <div key={name} className={col === 2 ? 'col-span-2' : 'col-span-1'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  {...register(name)}
                  type={type}
                  step={type === 'number' ? '0.01' : undefined}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                {errors[name] && (
                  <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
                )}
              </div>
            ))}

            {/* Descrição */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Descrição opcional do produto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Erro da mutation */}
          {mutation.isError && (
            <p className="text-red-500 text-sm text-center">Erro ao salvar produto. Tente novamente.</p>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              {(isSubmitting || mutation.isPending) && <Loader2 size={15} className="animate-spin" />}
              {isEditing ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({ open: false });

  const { data, isLoading } = useQuery<{ data: Product[]; meta: { total: number } }>({
    queryKey: ['products', search],
    queryFn: () =>
      productsApi.list({ search: search || undefined, limit: 50 }) as Promise<{
        data: Product[];
        meta: { total: number };
      }>,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const handleDelete = (product: Product) => {
    if (confirm(`Deseja excluir "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal */}
      {modal.open && (
        <ProductModal
          product={modal.product}
          onClose={() => setModal({ open: false })}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.meta?.total || 0} produtos cadastrados</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, SKU..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full max-w-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
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
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Produto</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">SKU</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Categoria</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Preço</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Estoque</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {product.stock <= product.minStock && (
                          <AlertTriangle size={14} className="text-red-500" />
                        )}
                        <span className={product.stock <= product.minStock ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                          {product.stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {product.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ open: true, product })}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.data?.length && (
              <div className="text-center py-12 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-50" />
                <p>Nenhum produto encontrado</p>
                <button
                  onClick={() => setModal({ open: true })}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Cadastrar primeiro produto
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
