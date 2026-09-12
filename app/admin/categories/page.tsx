'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Portal } from '@/components/ui/portal';
import { Plus, Edit2, Trash2, FolderTree, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getCategory3DImage } from '@/components/ui/category-icon';

interface CategoryItem {
  id: number;
  name: string;
  nameTa?: string | null;
  slug: string;
  description: string | null;
  descriptionTa?: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

const PRESET_IMAGES = [
  { label: 'Sparklers', path: '/images/3d/cat-sparklers.jpg' },
  { label: 'Flower Pots', path: '/images/3d/cat-flower-pots.jpg' },
  { label: 'Rockets', path: '/images/3d/cat-rockets.jpg' },
  { label: 'Chakras', path: '/images/3d/cat-chakras.jpg' },
  { label: 'Fountains', path: '/images/3d/cat-fountains.jpg' },
  { label: 'Sound Crackers', path: '/images/3d/cat-sound-crackers.jpg' },
  { label: 'Gift Boxes', path: '/images/3d/cat-gift-boxes.jpg' },
  { label: 'Family Packs', path: '/images/3d/cat-family-packs.jpg' },
];

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionTa, setDescriptionTa] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'categories', 'list'],
    queryFn: () => fetch('/api/admin/categories').then((r) => r.json()),
  });

  const categories: CategoryItem[] = data?.categories || [];

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setNameTa('');
    setDescription('');
    setDescriptionTa('');
    setImage('');
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setNameTa(cat.nameTa || '');
    setDescription(cat.description || '');
    setDescriptionTa(cat.descriptionTa || '');
    setImage(cat.image || '');
    setSortOrder(cat.sortOrder);
    setIsActive(cat.isActive);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'categories');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Image upload failed');

      setImage(resData.url);
      toast.success('Category image uploaded successfully');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to upload category image');
    } finally {
      setUploadingImage(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        nameTa: nameTa || null,
        description: description || null,
        descriptionTa: descriptionTa || null,
        image: image || null,
        sortOrder,
        isActive,
      };
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Categories
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize fireworks into sparklers, ground spinners, rockets, and gift combos with live backend images.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="font-medium text-xs self-start sm:self-auto"
          onClick={handleOpenAdd}
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Table List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Sort #</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">URL Slug</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat: CategoryItem) => {
                  const displayImg = cat.image || getCategory3DImage(cat.name);
                  return (
                    <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-muted-foreground">
                        #{cat.sortOrder}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border shrink-0 shadow-xs">
                            <img
                              src={displayImg}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{cat.name}</p>
                            {cat.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        /{cat.slug}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground">
                          {cat.productCount} items
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                                  `Are you sure you want to delete category "${cat.name}"?`
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-2xl border border-border p-8">
          <FolderTree className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold text-foreground">No categories created yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &ldquo;Add Category&rdquo; to build your catalog tree.
          </p>
        </div>
      )}

      {/* Modal Dialog for Category Edit/Create */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
            <div className="bg-card rounded-2xl border border-border max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="font-bold text-base text-foreground tracking-tight">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Category Name (English) *"
                    placeholder="e.g. Sparklers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <Input
                    label="Category Name (Tamil / தமிழ் பெயர்)"
                    placeholder="எ.கா: கம்பி மத்தாப்பு"
                    value={nameTa}
                    onChange={(e) => setNameTa(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Textarea
                    label="Description (English)"
                    placeholder="Brief summary of items in this category..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <Textarea
                    label="Description (Tamil / தமிழ் விளக்கம்)"
                    placeholder="இப்பிரிவில் உள்ள பட்டாசுகள் பற்றிய சிறு விளக்கம்..."
                    rows={2}
                    value={descriptionTa}
                    onChange={(e) => setDescriptionTa(e.target.value)}
                  />
                </div>

                {/* Category Image Selector & Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Category Live Image
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border shrink-0 shadow-xs flex items-center justify-center relative">
                      {image || name ? (
                        <img
                          src={image || getCategory3DImage(name)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Image URL or select preset below..."
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        {image && (
                          <button
                            type="button"
                            onClick={() => setImage('')}
                            className="text-[11px] text-muted-foreground hover:text-destructive underline"
                          >
                            Clear custom image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preset 3D Image Quick Chips */}
                  <div className="pt-1">
                    <p className="text-[11px] text-muted-foreground mb-1.5">Quick Presets:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.path}
                          type="button"
                          onClick={() => setImage(preset.path)}
                          className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                            image === preset.path
                              ? 'bg-brand/10 border-brand text-brand font-medium'
                              : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center pt-1">
                  <Input
                    label="Display Order #"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  />

                  <label className="flex items-center gap-2 pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-brand h-4 w-4"
                    />
                    <span className="text-xs font-medium text-foreground">Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="primary"
                  className="font-medium"
                  onClick={() => saveMutation.mutate()}
                  loading={saveMutation.isPending}
                  disabled={!name.trim() || uploadingImage}
                >
                  Save category
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
