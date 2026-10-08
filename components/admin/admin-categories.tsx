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

import { withAdminShell } from './admin-shell';

function AdminCategoriesPageContent() {
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Categories
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Organize fireworks into sparklers, ground spinners, rockets, and gift combos with live backend images.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="h-12 px-5 font-bold text-sm sm:text-base self-start sm:self-auto cursor-pointer shadow-xs"
          onClick={handleOpenAdd}
        >
          <Plus className="h-5 w-5 mr-1" /> Add Category
        </Button>
      </div>

      {/* Table List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-4">Sort #</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">URL Slug</th>
                  <th className="px-5 py-4">Products</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((cat: CategoryItem) => {
                  const displayImg = cat.image || getCategory3DImage(cat.name);
                  return (
                    <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-base text-muted-foreground">
                        #{cat.sortOrder}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0 shadow-xs">
                            <img
                              src={displayImg}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-base text-foreground">{cat.name}</p>
                            {cat.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-muted-foreground">
                        /{cat.slug}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-muted text-foreground border border-border/50">
                          {cat.productCount} items
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
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
                            size="icon-md"
                            className="h-9 w-9 text-foreground hover:bg-muted"
                            onClick={() => handleOpenEdit(cat)}
                            aria-label="Edit category"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-md"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-muted"
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
                            <Trash2 className="h-4 w-4" />
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
          <FolderTree className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-lg text-foreground">No categories created yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click &ldquo;Add Category&rdquo; to build your catalog tree.
          </p>
        </div>
      )}

      {/* Modal Dialog for Category Edit/Create */}
      {isModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
            <div className="bg-card rounded-2xl border border-border max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-3.5 border-b border-border">
                <h2 className="font-bold text-lg sm:text-xl text-foreground tracking-tight">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground block">
                    Category Live Image
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="h-18 w-18 rounded-xl overflow-hidden bg-muted border border-border shrink-0 shadow-xs flex items-center justify-center relative">
                      {image || name ? (
                        <img
                          src={image || getCategory3DImage(name)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <Input
                        placeholder="Image URL or select preset below..."
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                      />
                      <div className="flex items-center gap-2.5">
                        <label className="cursor-pointer inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-muted hover:bg-muted/80 text-xs sm:text-sm font-semibold text-foreground transition-colors border border-border">
                          <Upload className="h-4 w-4" />
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
                            className="text-xs text-muted-foreground hover:text-destructive underline"
                          >
                            Clear custom image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preset 3D Image Quick Chips */}
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.path}
                          type="button"
                          onClick={() => setImage(preset.path)}
                          className={`text-xs sm:text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                            image === preset.path
                              ? 'bg-brand/10 border-brand text-brand font-bold'
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

                  <label className="flex items-center gap-2.5 pt-5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-brand h-4.5 w-4.5"
                    />
                    <span className="text-sm font-semibold text-foreground">Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" size="lg" className="h-12 px-6 font-bold text-sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="lg"
                  variant="primary"
                  className="h-12 px-6 font-bold text-sm"
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

export default withAdminShell(AdminCategoriesPageContent);

