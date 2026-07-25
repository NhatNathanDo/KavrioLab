'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import {
  Sparkles,
  Send,
  User,
  Bot,
  ShieldCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-black text-zinc-900 dark:text-zinc-50 px-0.5">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs font-medium leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Dividers
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={i} className="border-t border-zinc-200/80 dark:border-zinc-700/60 my-3" />;
        }

        // Subheaders ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="text-xs font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 pt-2 pb-0.5 uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              {parseBold(trimmed.replace('### ', ''))}
            </h4>
          );
        }

        // Main Headers # / ##
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3 key={i} className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-50 pt-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
              {parseBold(trimmed.replace(/^#+\s*/, ''))}
            </h3>
          );
        }

        // Bullet / List items
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
          const listContent = trimmed.replace(/^(\*|-|\d+\.)\s*/, '');
          return (
            <div key={i} className="flex items-start gap-2 pl-1 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0 mt-1.5" />
              <div className="flex-1 text-zinc-800 dark:text-zinc-200 font-semibold">
                {parseBold(listContent)}
              </div>
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="text-zinc-800 dark:text-zinc-200">
            {parseBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function AICoachChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        language === 'vi'
          ? 'Xin chào! Tôi là AI Coach của KavrioLab. Tôi đã xem qua dữ liệu tập luyện, dinh dưỡng và chỉ số cân nặng của bạn. Hôm nay tôi có thể hỗ trợ gì cho bạn?'
          : "Hello! I'm your KavrioLab AI Coach. I have reviewed your workout volume, nutrition intake, and biometric trends. How can I assist your training today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = (textToSend || inputMessage).trim();
    if (!msgText || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: msgText,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const modelMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: json.content,
        };
        setMessages((prev) => [...prev, modelMsg]);
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    language === 'vi' ? 'Lập thực đơn 2.500 kcal tăng cơ 75kg?' : 'Create 2500 kcal muscle gain diet plan?',
    language === 'vi' ? 'Gợi ý bài tập ngực thay thế khi đông người?' : 'Suggest chest exercise swaps for a crowded gym?',
    language === 'vi' ? 'Làm sao để tăng tiến mức tạ an toàn?' : 'How to progressively overload safely?',
  ];

  return (
    <div className="h-[calc(100vh-100px)] max-w-5xl mx-auto flex flex-col p-4 md:p-6 space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900/80 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              KavrioLab AI Fitness Coach
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              RAG Connected (Workouts, Nutrition & Biometrics)
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 overflow-y-auto space-y-6 shadow-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] p-5 rounded-3xl ${
                msg.role === 'user'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-sm text-xs font-semibold'
                  : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <FormattedMarkdown content={msg.content} />
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              <span>Coach is analyzing context & typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 shrink-0">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:border-indigo-500 hover:text-indigo-500 transition-all shrink-0 cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm shrink-0"
      >
        <input
          type="text"
          placeholder={
            language === 'vi'
              ? 'Hỏi AI Coach về tập luyện, dinh dưỡng hoặc chỉ số...'
              : 'Ask AI Coach about workouts, nutrition, or biometrics...'
          }
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-2 bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={isSending || !inputMessage.trim()}
          className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
