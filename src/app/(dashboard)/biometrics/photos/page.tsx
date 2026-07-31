'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { stripExifFromDataUrl } from '@/lib/utils/exif';
import { PhotoComparisonSlider } from '@/components/biometrics/PhotoComparisonSlider';
import {
  Camera,
  Plus,
  Trash2,
  X,
  Sparkles,
  SlidersHorizontal,
  Grid,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface ProgressPhotoItem {
  id: string;
  imageUrl: string;
  angle: 'FRONT' | 'SIDE' | 'BACK';
  notes: string | null;
  loggedAt: string;
  createdAt: string;
}

export default function ProgressPhotoVaultPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language, t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'gallery' | 'compare'>('gallery');
  const [angleFilter, setAngleFilter] = useState<'ALL' | 'FRONT' | 'SIDE' | 'BACK'>('ALL');
  const [photos, setPhotos] = useState<ProgressPhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<ProgressPhotoItem | null>(null);

  // Compare mode selections
  const [beforePhotoId, setBeforePhotoId] = useState<string | null>(null);
  const [afterPhotoId, setAfterPhotoId] = useState<string | null>(null);

  // Form state
  const [uploadImagePreview, setUploadImagePreview] = useState<string | null>(null);
  const [uploadAngle, setUploadAngle] = useState<'FRONT' | 'SIDE' | 'BACK'>('FRONT');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [uploadDate, setUploadDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const url =
        angleFilter !== 'ALL'
          ? `/api/biometrics/photos?angle=${angleFilter}`
          : '/api/biometrics/photos';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPhotos(json.photos || []);
        if (json.photos?.length >= 2) {
          if (!beforePhotoId) setBeforePhotoId(json.photos[json.photos.length - 1].id);
          if (!afterPhotoId) setAfterPhotoId(json.photos[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading progress photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [angleFilter, beforePhotoId, afterPhotoId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchPhotos();
    }
  }, [status, router, fetchPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const rawDataUrl = evt.target?.result as string;
      try {
        // Strip EXIF metadata
        const cleanDataUrl = await stripExifFromDataUrl(rawDataUrl);
        setUploadImagePreview(cleanDataUrl);
      } catch {
        setUploadImagePreview(rawDataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadImagePreview) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/biometrics/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadImagePreview,
          angle: uploadAngle,
          notes: uploadNotes.trim() || undefined,
          loggedAt: uploadDate ? new Date(uploadDate).toISOString() : new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setShowUploadModal(false);
        setUploadImagePreview(null);
        setUploadNotes('');
        fetchPhotos();
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const handleConfirmDeletePhoto = async () => {
    if (!deletePhotoId) return;
    setIsDeletingPhoto(true);
    try {
      const res = await fetch(`/api/biometrics/photos?id=${deletePhotoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchPhotos();
      }
    } catch (err) {
      console.error('Error deleting photo:', err);
    } finally {
      setIsDeletingPhoto(false);
      setDeletePhotoId(null);
    }
  };

  const beforePhoto = photos.find((p) => p.id === beforePhotoId) || photos[photos.length - 1];
  const afterPhoto = photos.find((p) => p.id === afterPhotoId) || photos[0];

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {(t('photos.title' as any) || 'Progress Photo Vault & Transformation Slider') as string}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                EXIF Scrubbed & Private
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{(t('photos.uploadPhoto' as any) || 'Upload Photo') as string}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>{(t('photos.galleryTab' as any) || 'Photo Gallery') as string}</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{(t('photos.compareTab' as any) || 'Before / After Compare') as string}</span>
          </button>
        </div>

        {/* Angle Filter Pills (Active in Gallery Tab) */}
        {activeTab === 'gallery' && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {(['ALL', 'FRONT', 'SIDE', 'BACK'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAngleFilter(a)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase transition-all ${
                  angleFilter === a
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: Photo Gallery Grid */}
      {activeTab === 'gallery' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="h-72 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Camera className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                No progress photos logged yet
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-all"
              >
                Upload First Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all space-y-3 p-3"
                >
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950">
                    <img
                      src={photo.imageUrl}
                      alt={`Progress Photo ${photo.angle}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Angle Badge */}
                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-xl border border-white/20">
                      {photo.angle}
                    </span>

                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setSelectedPhotoForZoom(photo)}
                        className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all"
                        aria-label="Zoom Photo"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletePhotoId(photo.id)}
                        className="p-2.5 rounded-2xl bg-red-500/30 backdrop-blur-md text-red-200 hover:bg-red-500/50 transition-all"
                        aria-label="Delete Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="px-1 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      <span>{new Date(photo.loggedAt).toLocaleDateString()}</span>
                    </div>
                    {photo.notes && (
                      <p className="text-[11px] font-normal text-zinc-400 italic truncate">
                        "{photo.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Before / After Slider Compare */}
      {activeTab === 'compare' && (
        <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-8">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Before / After Transformation Comparison
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {(t('photos.compareInstructions' as any) || 'Drag the split divider handle horizontally to visually compare physical transformations over time.') as string}
            </p>
          </div>

          {/* Photo Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="select-before-photo" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {(t('photos.selectBeforePhoto' as any) || 'Select Baseline (Before)') as string}
              </label>
              <select
                id="select-before-photo"
                value={beforePhotoId || ''}
                onChange={(e) => setBeforePhotoId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-xs text-zinc-900 dark:text-zinc-100"
              >
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {new Date(p.loggedAt).toLocaleDateString()} — {p.angle} Angle {p.notes ? `(${p.notes})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="select-after-photo" className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {(t('photos.selectAfterPhoto' as any) || 'Select Recent (After)') as string}
              </label>
              <select
                id="select-after-photo"
                value={afterPhotoId || ''}
                onChange={(e) => setAfterPhotoId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-xs text-zinc-900 dark:text-zinc-100"
              >
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {new Date(p.loggedAt).toLocaleDateString()} — {p.angle} Angle {p.notes ? `(${p.notes})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Split Canvas Slider */}
          {beforePhoto && afterPhoto ? (
            <PhotoComparisonSlider
              beforeImage={beforePhoto.imageUrl}
              afterImage={afterPhoto.imageUrl}
              beforeLabel={`Before (${new Date(beforePhoto.loggedAt).toLocaleDateString()})`}
              afterLabel={`After (${new Date(afterPhoto.loggedAt).toLocaleDateString()})`}
              className="h-[520px] max-w-4xl mx-auto shadow-2xl"
            />
          ) : (
            <div className="h-72 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-2">
              <p className="text-xs font-bold text-zinc-400">
                Please upload at least 2 progress photos to use the comparison slider.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      <PortalModal
        isOpen={!!selectedPhotoForZoom}
        onClose={() => setSelectedPhotoForZoom(null)}
        unstyled
        backdropClassName="bg-black/90 backdrop-blur-md"
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
      >
        {selectedPhotoForZoom && (
          <>
            <button
              onClick={() => setSelectedPhotoForZoom(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhotoForZoom.imageUrl}
              alt="Zoomed Progress Photo"
              className="max-h-[85vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white space-y-1 font-bold text-sm">
              <p>{new Date(selectedPhotoForZoom.loggedAt).toLocaleDateString()} — {selectedPhotoForZoom.angle} Angle</p>
              {selectedPhotoForZoom.notes && (
                <p className="text-xs font-normal text-zinc-400 italic">"{selectedPhotoForZoom.notes}"</p>
              )}
            </div>
          </>
        )}
      </PortalModal>

      {/* Upload Photo Modal */}
      <PortalModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadImagePreview(null);
        }}
        maxWidth="md"
        className="space-y-6"
      >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                  Upload Progress Photo
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadImagePreview(null);
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              {/* File Upload / Camera Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Photo File
                </label>
                {uploadImagePreview ? (
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
                    <img src={uploadImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setUploadImagePreview(null)}
                      className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/60 text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 rounded-2xl h-48 flex flex-col items-center justify-center p-4 cursor-pointer transition-colors space-y-2">
                    <Camera className="w-8 h-8 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-500">
                      Click to choose or take photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Angle Tag Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Pose / Angle Tag
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FRONT', 'SIDE', 'BACK'] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setUploadAngle(a)}
                      className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                        uploadAngle === a
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label htmlFor="upload-photo-date" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Log Date
                </label>
                <input
                  id="upload-photo-date"
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="upload-photo-notes" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Notes (Optional)
                </label>
                <input
                  id="upload-photo-notes"
                  type="text"
                  placeholder="e.g. Fasted morning shape, week 4..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadImagePreview}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Save Photo'}
                </button>
              </div>
            </form>
      </PortalModal>

      <ConfirmModal
        isOpen={!!deletePhotoId}
        onClose={() => setDeletePhotoId(null)}
        onConfirm={handleConfirmDeletePhoto}
        isLoading={isDeletingPhoto}
        title="Xóa ảnh tiến trình này?"
        description="Hành động này sẽ xóa vĩnh viễn bức ảnh tiến trình khỏi bộ sưu tập của bạn và không thể hoàn tác."
        confirmText="Xóa ngay"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
