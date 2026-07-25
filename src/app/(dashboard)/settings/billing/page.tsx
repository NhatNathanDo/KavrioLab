'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  DollarSign,
} from 'lucide-react';

interface BillingInvoice {
  id: string;
  amountPaid: number;
  currency: string;
  status: string;
  description: string;
  paidAt: string;
}

interface BillingUser {
  id: string;
  email: string;
  isPro: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: string | null;
  billingInvoices?: BillingInvoice[];
}

export default function BillingSettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useTranslation();

  const [user, setUser] = useState<BillingUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setNotification('🎉 Thank you for upgrading! Your KavrioLab Pro membership is now active.');
    } else if (searchParams.get('simulated') === 'true') {
      setNotification('⚡ Simulated KavrioLab Pro membership activated for development mode.');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch('/api/user/billing');
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
        }
      } catch (err) {
        console.error('Failed to fetch billing status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBilling();
    }
  }, [status]);

  const handleCheckout = async () => {
    setIsRedirecting(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          window.location.href = json.url;
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handlePortal = async () => {
    setIsRedirecting(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.url && !json.url.endsWith('/settings/billing')) {
          window.location.href = json.url;
        } else if (json.message) {
          setNotification(`ℹ️ ${json.message}`);
        }
      }
    } catch (err) {
      console.error('Portal error:', err);
    } finally {
      setIsRedirecting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-8 animate-pulse max-w-5xl mx-auto">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
      </div>
    );
  }

  const isPro = Boolean(user?.isPro);
  const periodEndFormatted = user?.stripeCurrentPeriodEnd
    ? new Date(user.stripeCurrentPeriodEnd).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-indigo-500" />
          {(t('billing.title' as any) || 'Subscription & Billing') as string}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {(t('billing.desc' as any) || 'Manage your membership tier, view payment invoice receipts, and update Pro feature access.') as string}
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Active Subscription Status Banner */}
      <div className="p-6 md:p-8 bg-zinc-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {(t('billing.currentPlan' as any) || 'Current Plan') as string}
              </span>
              {isPro ? (
                <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-indigo-400 text-zinc-950 font-black text-xs rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" /> {(t('billing.proMember' as any) || 'PRO MEMBER') as string}
                </span>
              ) : (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-full">
                  {(t('billing.freeTier' as any) || 'FREE TIER') as string}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {isPro ? ((t('billing.proTitle' as any) || 'KavrioLab Pro OS') as string) : ((t('billing.freeTitle' as any) || 'KavrioLab Standard') as string)}
            </h2>

            <p className="text-xs text-zinc-400 max-w-lg">
              {isPro
                ? ((t('billing.proDesc' as any) || 'Active subscription. Full access to AI food scanner, dynamic TDEE engine, RAG coach chat, and advanced analytics.') as string)
                : ((t('billing.freeDesc' as any) || 'Upgrade to Pro to unlock unlimited Gemini AI food scans, adaptive macro engine, exercise substitution, and full analytics.') as string)}
            </p>

            {periodEndFormatted && (
              <div className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {(t('billing.renewsOn' as any) || 'Renews on') as string} {periodEndFormatted}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            {isPro ? (
              <button
                onClick={handlePortal}
                disabled={isRedirecting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-2xl transition-all border border-zinc-700 disabled:opacity-50 cursor-pointer"
              >
                {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {(t('billing.manageBilling' as any) || 'Manage Stripe Billing') as string}
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={isRedirecting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-600 hover:to-amber-600 text-white font-bold text-xs rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                {(t('billing.upgradePro' as any) || 'Upgrade to Pro — $9.99/mo') as string}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="p-6 md:p-8 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            {(t('billing.matrixTitle' as any) || 'Feature Comparison Matrix') as string}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {(t('billing.matrixDesc' as any) || 'Compare capabilities between KavrioLab Standard and Pro membership tiers.') as string}
          </p>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
          {[
            {
              feature: language === 'vi' ? 'Quét ảnh món ăn AI đa thức' : 'Multimodal AI Food Photo Scanner',
              free: language === 'vi' ? '3 lượt / ngày' : '3 Scans / day',
              pro: language === 'vi' ? 'Không giới hạn' : 'Unlimited Scans',
            },
            {
              feature: language === 'vi' ? 'Thuật toán TDEE & Macro tự điều chỉnh' : 'Dynamic AI TDEE & Adaptive Macro Engine',
              free: language === 'vi' ? 'Cập nhật thủ công' : 'Manual updates',
              pro: language === 'vi' ? 'Tự động theo EMA 14 ngày' : 'Automated 14-day EMA',
            },
            {
              feature: language === 'vi' ? 'Trợ lý AI Fitness Coach (Ngữ cảnh RAG)' : 'AI Fitness Coach Chat (RAG Context Injection)',
              free: language === 'vi' ? 'Hỏi đáp cơ bản' : 'Basic prompts',
              pro: language === 'vi' ? 'Hỏi đáp chuyên sâu không giới hạn' : 'Unlimited context-aware chat',
            },
            {
              feature: language === 'vi' ? 'Phân tích tiến trình & Dự báo 1RM' : 'Progression Analytics & e1RM Projection',
              free: language === 'vi' ? 'Biểu đồ volume cơ bản' : 'Basic volume chart',
              pro: language === 'vi' ? 'Biểu đồ 1RM & Phân bổ nhóm cơ' : 'Full Recharts & 1RM curves',
            },
            {
              feature: language === 'vi' ? 'Đề xuất tăng tạ tự động (Progressive Overload)' : 'Automated Progressive Overload Engine',
              free: language === 'vi' ? 'Ghi chép tiêu chuẩn' : 'Standard logs',
              pro: language === 'vi' ? 'Dự báo & Đề xuất mức tạ' : 'Projections & target weights',
            },
            {
              feature: language === 'vi' ? 'Kho ảnh tiến trình & Bảo mật EXIF' : 'Progress Photo Vault & Exif Scrubbing',
              free: language === 'vi' ? 'Tối đa 10 ảnh' : 'Up to 10 photos',
              pro: language === 'vi' ? 'Không giới hạn kho ảnh' : 'Unlimited photo vault',
            },
            {
              feature: language === 'vi' ? 'Thông báo đẩy Web & Biểu đồ thói quen' : 'System Web Push Notifications & Habit Heatmaps',
              free: language === 'vi' ? 'Bao gồm' : 'Included',
              pro: language === 'vi' ? 'Bao gồm' : 'Included',
            },
          ].map((item) => (
            <div key={item.feature} className="py-3.5 grid grid-cols-12 gap-2 items-center">
              <span className="col-span-6 font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {item.feature}
              </span>
              <span className="col-span-3 text-zinc-500 dark:text-zinc-400 text-center">{item.free}</span>
              <span className="col-span-3 font-bold text-indigo-600 dark:text-indigo-400 text-center">{item.pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Receipts & Invoice History */}
      <div className="p-6 md:p-8 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            {(t('billing.historyTitle' as any) || 'Billing History & Receipts') as string}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {(t('billing.historyDesc' as any) || 'View completed membership payments and invoice statements.') as string}
          </p>
        </div>

        {user?.billingInvoices && user.billingInvoices.length > 0 ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {user.billingInvoices.map((inv) => (
              <div key={inv.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{inv.description}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Paid on {new Date(inv.paidAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100">${Number(inv.amountPaid).toFixed(2)} USD</div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md">
                    {(t('billing.paidStatus' as any) || 'PAID') as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            {(t('billing.noReceipts' as any) || 'No payment receipts on record yet.') as string}
          </div>
        )}
      </div>
    </div>
  );
}
