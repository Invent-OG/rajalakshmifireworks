'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Plus,
  Play,
  Film,
  Sparkles,
  Link as LinkIcon,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface ProductMediaItem {
  id?: number;
  type: 'image' | 'video';
  url: string;
  alt?: string | null;
  sortOrder: number;
}

interface ProductMediaManagerProps {
  productId?: number;
  media: ProductMediaItem[];
  onChange?: (media: ProductMediaItem[]) => void;
}

export function ProductMediaManager({
  productId,
  media = [],
  onChange,
}: ProductMediaManagerProps) {
  const [mediaList, setMediaList] = useState<ProductMediaItem[]>(media);
  const [uploading, setUploading] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<ProductMediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const currentList = mediaList;

  function updateList(newList: ProductMediaItem[]) {
    setMediaList(newList);
    if (onChange) {
      onChange(newList);
    }
  }

  async function handleFileUpload(file: File, typeOverride?: 'image' | 'video') {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Upload failed');
        return;
      }

      const detectedType = typeOverride || data.type || (file.type.startsWith('video/') ? 'video' : 'image');
      const newMediaItem: ProductMediaItem = {
        type: detectedType,
        url: data.url,
        alt: file.name,
        sortOrder: currentList.length,
      };

      if (productId) {
        const apiRes = await fetch(`/api/admin/products/${productId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMediaItem),
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          newMediaItem.id = apiData.media.id;
        }
      }

      const updated = [...currentList, newMediaItem];
      updateList(updated);
      toast.success(`${detectedType === 'video' ? 'Demo video' : 'Image'} uploaded`);
    } catch {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await handleFileUpload(files[i], type);
    }
    e.target.value = '';
  }

  async function handleAddVideoUrl() {
    if (!videoUrlInput.trim()) return;

    const url = videoUrlInput.trim();
    const newMediaItem: ProductMediaItem = {
      type: 'video',
      url,
      alt: 'Product Demo Video',
      sortOrder: currentList.length,
    };

    if (productId) {
      try {
        const res = await fetch(`/api/admin/products/${productId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMediaItem),
        });

        if (res.ok) {
          const data = await res.json();
          newMediaItem.id = data.media.id;
        }
      } catch {
        toast.error('Failed to save demo video');
        return;
      }
    }

    updateList([...currentList, newMediaItem]);
    setVideoUrlInput('');
    setShowVideoModal(false);
    toast.success('Demo video attached');
  }

  async function handleDelete(index: number) {
    const target = currentList[index];

    if (productId && target.id) {
      try {
        const res = await fetch(`/api/admin/products/${productId}/media?mediaId=${target.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          toast.error('Failed to delete media');
          return;
        }
      } catch {
        toast.error('Error deleting media');
        return;
      }
    }

    const filtered = currentList.filter((_, i) => i !== index);
    updateList(filtered);
    toast.success('Media removed');
  }

  return (
    <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-foreground" />
            Media & Demo Videos
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Attach high quality product photos and demo burst videos.
          </p>
        </div>

        {/* Upload Action Triggers */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e, 'image')}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs font-medium"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload photos</span>
          </Button>

          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            className="hidden"
            onChange={(e) => handleFilesSelected(e, 'video')}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="text-xs font-medium"
            onClick={() => setShowVideoModal(true)}
            disabled={uploading}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Add video</span>
          </Button>
        </div>
      </div>

      {uploading && (
        <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex items-center gap-3 animate-pulse">
          <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />
          <span className="text-xs text-muted-foreground">
            Uploading media to storage...
          </span>
        </div>
      )}

      {/* Media Tiles Grid */}
      {currentList.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-8 text-center space-y-3 bg-muted/20">
          <div className="h-10 w-10 rounded-xl bg-muted text-foreground-secondary flex items-center justify-center mx-auto border border-border">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-foreground">No media attached yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add clear packaging photos and customer demo videos.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-medium"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Upload photos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-medium"
              onClick={() => setShowVideoModal(true)}
            >
              <Video className="h-3.5 w-3.5 mr-1" />
              Add video
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {currentList.map((item, index) => {
            const isVideo = item.type === 'video';
            const isCover = index === 0;

            return (
              <div
                key={item.id || item.url || index}
                className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all flex flex-col"
              >
                {/* Media Container */}
                <div className="relative aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                  {isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-white p-3 text-center">
                      <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center shadow-md">
                        <Play className="h-4 w-4 fill-current ml-0.5 text-white" />
                      </div>
                      <span className="text-[10px] font-medium mt-1.5 text-neutral-300 truncate max-w-full px-2">
                        Demo Video
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.alt || 'Product media'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {isCover && (
                      <span className="px-2 py-0.5 rounded-md bg-foreground text-background text-[10px] font-semibold flex items-center gap-1">
                        Cover
                      </span>
                    )}
                  </div>

                  {/* Action Overlays */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewMedia(item)}
                      className="h-7 w-7 rounded-lg bg-card text-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-xs cursor-pointer"
                      title="Preview Media"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      className="h-7 w-7 rounded-lg bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-xs cursor-pointer"
                      title="Delete Media"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer details */}
                <div className="p-2 bg-muted/20 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate max-w-[100px]" title={item.url}>
                    {item.url.split('/').pop()}
                  </span>
                  <span className="font-mono">#{index + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Upload & URL Modal Dialog */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-lg animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Attach Demo Video</h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Option 1: File Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                Upload video file (.mp4, .webm)
              </label>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full gap-2 justify-center border-dashed"
                onClick={() => {
                  setShowVideoModal(false);
                  videoFileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4" />
                <span>Choose video from device</span>
              </Button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-border w-full" />
              <span className="bg-card px-2 text-[10px] uppercase font-semibold text-muted-foreground absolute">
                or
              </span>
            </div>

            {/* Option 2: Video URL */}
            <div className="space-y-3">
              <Input
                label="Paste video URL (YouTube, Vimeo, MP4)"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                icon={<LinkIcon className="h-4 w-4" />}
              />
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full font-medium"
                onClick={handleAddVideoUrl}
                disabled={!videoUrlInput.trim()}
              >
                Attach video URL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border p-4 max-w-2xl w-full overflow-hidden shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                {previewMedia.type === 'video' ? 'Demo Video Preview' : 'Image Preview'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="aspect-video bg-neutral-900 rounded-xl overflow-hidden flex items-center justify-center">
              {previewMedia.type === 'video' ? (
                previewMedia.url.includes('youtube.com') || previewMedia.url.includes('youtu.be') ? (
                  <iframe
                    src={getYoutubeEmbedUrl(previewMedia.url)}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={previewMedia.url} controls autoPlay className="w-full h-full object-contain" />
                )
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewMedia.url} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getYoutubeEmbedUrl(url: string): string {
  try {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get('v');
    if (id) {
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
  } catch {
    // Return original url if parsing fails
  }
  return url;
}
