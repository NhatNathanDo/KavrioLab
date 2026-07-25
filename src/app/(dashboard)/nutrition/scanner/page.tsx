'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import {
  ScanLine,
  Search,
  CheckCircle2,
  AlertCircle,
  Camera,
  Plus,
  Globe,
  ArrowLeft,
} from 'lucide-react';

interface ScannedFoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize?: string;
  calories: number;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  barcode?: string;
  verified?: boolean;
}

export default function BarcodeScannerPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();

  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<{
    found: boolean;
    source?: string;
    item?: ScannedFoodItem;
    message?: string;
  } | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string>('Breakfast');
  const [servingQty, setServingQty] = useState<number>(1);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);

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
      console.error('Barcode camera access error:', err);
      setCameraActive(false);
      setCameraError(
        language === 'vi'
          ? 'Không thể truy cập Camera. Vui lòng cấp quyền mở Camera trên trình duyệt.'
          : 'Unable to access camera. Please allow camera permissions in your browser.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleScanBarcode = async (codeToScan?: string) => {
    const code = (codeToScan || barcodeInput).trim();
    if (!code) return;

    setIsScanning(true);
    setScannedResult(null);
    setLogSuccessMessage(null);

    try {
      const res = await fetch(`/api/nutrition/barcode?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      setScannedResult(data);
      if (data.found && data.item) {
        setBarcodeInput(code);
      }
    } catch (e) {
      console.error('Barcode scan error:', e);
      setScannedResult({ found: false, message: 'Network error communicating with barcode API' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogToDaily = async () => {
    if (!scannedResult?.item || !scannedResult.found) return;
    setIsLogging(true);
    setLogSuccessMessage(null);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const dailyRes = await fetch(`/api/nutrition/daily?date=${todayStr}`);
      const dailyData = await dailyRes.json();

      if (!dailyData.dailyLogId) throw new Error('Could not get daily log ID');

      const logRes = await fetch('/api/nutrition/daily/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLogId: dailyData.dailyLogId,
          mealName: selectedMeal,
          foodItemId: scannedResult.item.id,
          servingQuantity: servingQty,
          unit: 'serving',
        }),
      });

      if (logRes.ok) {
        setLogSuccessMessage(
          language === 'vi'
            ? `Đã ghi nhận ${scannedResult.item.name} vào ${selectedMeal}!`
            : `Logged ${scannedResult.item.name} to Today's ${selectedMeal}!`
        );
      }
    } catch (e) {
      console.error('Error logging scanned item:', e);
    } finally {
      setIsLogging(false);
    }
  };

  const sampleBarcodes = [
    { code: '3017624010701', label: 'Nutella Ferrero (OpenFoodFacts v3)' },
    { code: '8410000000001', label: 'Chicken Breast (Local Verified)' },
    { code: '8410000000021', label: 'Whey Isolate Powder (Local Verified)' },
    { code: '8000500310427', label: 'Kinder Bueno (OpenFoodFacts Global)' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/nutrition')}
            aria-label="Back to nutrition search"
            className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <ScanLine className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Quét mã vạch & Tra cứu nhanh' : 'Web Barcode Scanner & Lookup'}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {language === 'vi'
                ? 'Mở Camera quét trực tiếp mã vạch sản phẩm với kho dữ liệu OpenFoodFacts API v3'
                : 'Decode barcodes using live webcam & OpenFoodFacts API v3 index'}
            </p>
          </div>
        </div>
      </div>

      {/* Camera Permission Error Notice */}
      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold">{cameraError}</p>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Scanner Control Box */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Nhập mã vạch hoặc Quét trực tiếp' : 'Enter Barcode or Scan Camera'}
            </h2>
            <button
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                cameraActive
                  ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{cameraActive ? (language === 'vi' ? 'Tắt Camera' : 'Close Camera') : (language === 'vi' ? 'Mở Camera Web' : 'Open Camera')}</span>
            </button>
          </div>

          {/* Active Live Webcam Stream */}
          {cameraActive ? (
            <div className="relative aspect-video rounded-2xl bg-zinc-950 border-2 border-dashed border-indigo-500/40 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Laser Scanning Line Animation */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-indigo-500 shadow-[0_0_12px_#6366f1] animate-pulse" />
              </div>
              <div className="absolute bottom-3 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-300 backdrop-blur-md">
                {language === 'vi' ? 'Di chuyển camera canh mã vạch vào vạch đỏ' : 'Align barcode in red target box'}
              </div>
            </div>
          ) : null}

          {/* Manual Barcode Input Form */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="e.g. 3017624010701, 8410000000001..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanBarcode()}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => handleScanBarcode()}
                disabled={isScanning || !barcodeInput.trim()}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{isScanning ? 'Decoding...' : 'Lookup'}</span>
              </button>
            </div>
          </div>

          {/* Quick Test Barcodes */}
          <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              {language === 'vi' ? 'Hoặc thử mã vạch mẫu 1-chạm:' : 'Or Try Instant Sample Barcodes:'}
            </span>
            <div className="grid grid-cols-1 gap-2">
              {sampleBarcodes.map((sb) => (
                <button
                  key={sb.code}
                  onClick={() => {
                    setBarcodeInput(sb.code);
                    handleScanBarcode(sb.code);
                  }}
                  className="text-left px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-zinc-200/60 dark:border-zinc-700/60 transition-all flex items-center justify-between text-xs cursor-pointer"
                >
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sb.label}</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{sb.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Scanned Result Card */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between min-h-[380px]">
          {isScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                {language === 'vi' ? 'Đang truy vấn OpenFoodFacts v3...' : 'Querying OpenFoodFacts v3 barcode database...'}
              </p>
            </div>
          ) : !scannedResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-zinc-400 space-y-2">
              <ScanLine className="w-12 h-12 stroke-1 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs font-semibold">
                {language === 'vi'
                  ? 'Quét hoặc nhập mã vạch bên trái để hiển thị hồ sơ dinh dưỡng'
                  : 'Scan or enter a barcode on the left to inspect product profile'}
              </p>
            </div>
          ) : !scannedResult.found || !scannedResult.item ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {language === 'vi' ? 'Không tìm thấy sản phẩm' : 'Barcode Profile Not Found'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs">{scannedResult.message || 'No matching product found in OpenFoodFacts v3 or local DB.'}</p>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase mb-2">
                      <Globe className="w-3 h-3" />
                      <span>{scannedResult.source?.toUpperCase() || 'OFF_V3'}</span>
                    </span>
                    <h3 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-50 line-clamp-2">
                      {scannedResult.item.name}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {scannedResult.item.brand || 'Generic'} • {scannedResult.item.servingSize || '100g'}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
                    {scannedResult.item.barcode || barcodeInput}
                  </span>
                </div>

                {/* Macro breakdown */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center">
                    <span className="block text-[10px] font-bold text-orange-600 uppercase">Calo</span>
                    <span className="text-base font-extrabold text-orange-600">{scannedResult.item.calories}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="block text-[10px] font-bold text-emerald-600 uppercase">Đạm</span>
                    <span className="text-base font-extrabold text-emerald-600">{scannedResult.item.protein}g</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="block text-[10px] font-bold text-amber-600 uppercase">Tinh bột</span>
                    <span className="text-base font-extrabold text-amber-600">{scannedResult.item.carbs}g</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                    <span className="block text-[10px] font-bold text-indigo-600 uppercase">Chất béo</span>
                    <span className="text-base font-extrabold text-indigo-600">{scannedResult.item.fat}g</span>
                  </div>
                </div>
              </div>

              {/* Log to Daily Meal Box */}
              <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  {language === 'vi' ? 'Ghi nhanh vào nhật ký hôm nay:' : 'Quick Log to Today\'s Meals:'}
                </span>

                {logSuccessMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{logSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedMeal}
                    onChange={(e) => setSelectedMeal(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Breakfast">{language === 'vi' ? 'Bữa Sáng (Breakfast)' : 'Breakfast'}</option>
                    <option value="Lunch">{language === 'vi' ? 'Bữa Trưa (Lunch)' : 'Lunch'}</option>
                    <option value="Dinner">{language === 'vi' ? 'Bữa Tối (Dinner)' : 'Dinner'}</option>
                    <option value="Snacks">{language === 'vi' ? 'Bữa Nhẹ (Snacks)' : 'Snacks'}</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={servingQty}
                      onChange={(e) => setServingQty(Math.max(0.5, parseFloat(e.target.value) || 1))}
                      className="w-16 px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-center"
                    />
                    <span className="text-xs font-semibold text-zinc-500">servings</span>
                  </div>
                </div>

                <button
                  onClick={handleLogToDaily}
                  disabled={isLogging}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isLogging
                      ? 'Logging...'
                      : language === 'vi'
                        ? `Ghi vào ${selectedMeal}`
                        : `Log to ${selectedMeal}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
