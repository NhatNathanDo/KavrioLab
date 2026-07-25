'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import { AIFoodScanResult } from '@/lib/ai/gemini';
import {
  Sparkles,
  Camera,
  Upload,
  Plus,
  X,
  Flame,
  CheckCircle2,
  AlertCircle,
  Video,
  RefreshCw,
} from 'lucide-react';

export default function AIFoodScannerPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();

  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<AIFoodScanResult | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('LUNCH');
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [logSuccess, setLogSuccess] = useState<boolean>(false);

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      setCameraError(
        language === 'vi'
          ? 'Không thể mở Camera. Vui lòng cho phép quyền truy cập Camera trên trình duyệt.'
          : 'Unable to access camera. Please allow camera permissions in your browser.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      setScanResult(null);
      setLogSuccess(false);
      stopCamera();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setImagePreview(dataUrl);
      setScanResult(null);
      setLogSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleScanImage = async () => {
    if (!imagePreview) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/ai/food-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imagePreview }),
      });

      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
      }
    } catch (err) {
      console.error('Error scanning food image:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogMeal = async () => {
    if (!scanResult) return;
    setIsLogging(true);
    try {
      const res = await fetch('/api/nutrition/daily/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: selectedMealType,
          name: scanResult.dishName,
          servingSizeGrams: scanResult.estimatedWeightGrams,
          calories: scanResult.calories,
          proteinGrams: scanResult.proteinGrams,
          carbsGrams: scanResult.carbsGrams,
          fatGrams: scanResult.fatGrams,
        }),
      });

      if (res.ok) {
        setLogSuccess(true);
        setTimeout(() => {
          router.push('/nutrition/daily');
        }, 1200);
      }
    } catch (err) {
      console.error('Error logging scanned meal:', err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Quét Món Ăn AI Multimodal' : 'Multimodal AI Food Scanner'}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {language === 'vi'
                ? 'Mở Camera trực tiếp hoặc tải ảnh món ăn để AI phân tích Calo/Macros'
                : 'Use live webcam or upload photo to scan calories and macros'}
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 self-stretch sm:self-auto">
          <button
            onClick={() => {
              stopCamera();
              setMode('upload');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'upload' && !isCameraActive
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'vi' ? 'Tải Ảnh Món' : 'Upload Photo'}</span>
          </button>
          <button
            onClick={startCamera}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isCameraActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{language === 'vi' ? 'Mở Camera Web' : 'Open Camera'}</span>
          </button>
        </div>
      </div>

      {/* Camera Permission Error Notice */}
      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">{cameraError}</p>
        </div>
      )}

      {/* Main Scanner Canvas / Viewfinder */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">
        {/* Active Camera Stream Viewfinder */}
        {isCameraActive ? (
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Scanner Grid Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-3xl pointer-events-none flex items-center justify-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                Center Meal in Frame
              </span>
            </div>

            {/* Shutter Controls */}
            <div className="absolute bottom-6 flex items-center gap-4">
              <button
                onClick={stopCamera}
                className="p-3 rounded-2xl bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={handleCapturePhoto}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <span>{language === 'vi' ? 'Chụp Ảnh Món Ăn' : 'Take Photo'}</span>
              </button>
            </div>
          </div>
        ) : imagePreview ? (
          /* Captured Image Preview Canvas */
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            <img src={imagePreview} alt="Food to scan" className="w-full h-full object-cover" />
            <button
              onClick={() => {
                setImagePreview(null);
                setScanResult(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-2xl bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!scanResult && !isScanning && (
              <button
                onClick={handleScanImage}
                className="absolute bottom-6 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'vi' ? 'Phân Tích Món Ăn Bằng AI' : 'Scan Meal with AI'}</span>
              </button>
            )}
          </div>
        ) : (
          /* Default File Upload Box */
          <label className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 rounded-3xl h-64 flex flex-col items-center justify-center p-6 cursor-pointer transition-colors space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block">
                {language === 'vi' ? 'Bấm để Chọn File Ảnh Món Ăn' : 'Click to Upload Food Photo'}
              </span>
              <span className="text-xs text-zinc-400">Hoặc bấm "Mở Camera Web" ở trên để chụp ảnh trực tiếp</span>
            </div>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        )}

        {/* Scanning Loader */}
        {isScanning && (
          <div className="p-8 border border-indigo-500/30 rounded-3xl bg-indigo-500/5 text-center space-y-3 animate-pulse">
            <Sparkles className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
            <h3 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              {language === 'vi' ? 'AI Gemini đang phân tích hình ảnh món ăn...' : 'Gemini AI Vision is analyzing your meal photo...'}
            </h3>
            <p className="text-xs text-zinc-400">Detecting ingredients, volume, calories & macronutrients...</p>
          </div>
        )}

        {/* Scan Result Details Card */}
        {scanResult && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                    {scanResult.dishName}
                  </h3>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    {Math.round(scanResult.confidence * 100)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                  Est. Portion: {scanResult.estimatedWeightGrams}g
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black text-lg">
                <Flame className="w-5 h-5 fill-amber-500" />
                <span>{scanResult.calories} kcal</span>
              </div>
            </div>

            {/* Macros Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Protein</span>
                <span className="text-xl font-extrabold text-indigo-500 block">{scanResult.proteinGrams}g</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Carbs</span>
                <span className="text-xl font-extrabold text-emerald-500 block">{scanResult.carbsGrams}g</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Fat</span>
                <span className="text-xl font-extrabold text-amber-500 block">{scanResult.fatGrams}g</span>
              </div>
            </div>

            {/* Ingredients detected */}
            {scanResult.ingredients?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Detected Ingredients
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {scanResult.ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Type & Log Action */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">Meal:</span>
                <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-700 p-1 rounded-xl">
                  {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMealType(m)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                        selectedMealType === m
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLogMeal}
                disabled={isLogging || logSuccess}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {logSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Logged to Daily Tracker!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{isLogging ? 'Logging...' : 'Log to Daily Nutrition'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
