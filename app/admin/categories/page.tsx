'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit2, Trash2, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'categories', 'list'],
    queryFn: () => fetch('/api/admin/categories').then((r) => r.json()),
  });

  const categories: CategoryItem[] = data?.categories || [];

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description, sortOrder, isActive };
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to save category');
      return resData;
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setIsModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to delete category');
      return resData;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Category deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Categories & Collections
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize fireworks into sparklers, ground spinners, rockets, and gift combos.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="font-bold text-xs shadow-md shadow-orange-500/25 self-start sm:self-auto"
          onClick={handleOpenAdd}
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Table List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="rounded-3xl bg-card border border-border/80 luxury-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3.5">Sort #</th>
                  <th className="px-5 py-3.5">Category Name</th>
                  <th className="px-5 py-3.5">URL Slug</th>
                  <th className="px-5 py-3.5">Total Products</th>
                  <th className="px-5 py-3.5">Visibility</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {categories.map((cat: CategoryItem) => (
                  <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-muted-foreground">
                      #{cat.sortOrder}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground">{cat.name}</p>
                      {cat.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {cat.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      /{cat.slug}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
                        {cat.productCount} items
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cat.isActive
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(cat)}
                          aria-label="Edit category"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete category"
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete or disable category "${cat.name}"?`
                              )
                            ) {
                              deleteMutation.mutate(cat.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-3xl border border-border/80 p-8 luxury-card">
          <FolderTree className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground">No categories created yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &ldquo;Add Category&rdquo; to build your catalog tree.
          </p>
        </div>
      )}

      {/* Modal Dialog for Category Edit/Create */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card rounded-3xl border border-border max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl luxury-card">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h2 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Category Name *"
                placeholder="e.g. Sparklers & Bengal Lights"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Textarea
                label="Description"
                placeholder="Brief summary of items in this category..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4 items-center">
                <Input
                  label="Display Order #"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                />

                <label className="flex items-center gap-2.5 pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-primary h-4 w-4"
                  />
                  <span className="text-xs font-bold text-foreground">Active in Store</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
              <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="md"
                variant="primary"
                className="font-bold shadow-sm"
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
                disabled={!name.trim()}
              >
                Save Category
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
