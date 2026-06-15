import React, { useState, useRef, useEffect } from 'react';
import { InsightData, Transaction, Message } from '../types';
import { Sparkles, MessageSquare, AlertCircle, RefreshCw, Send, ArrowRight, User, GraduationCap, TrendingUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAdvisorProps {
  insights: InsightData | null;
  transactions: Transaction[];
  isLoadingInsights: boolean;
  onRefreshInsights: () => void;
}

// Custom simple markdown formatter to render bold, list items, and paragraph brakes cleanly in React 19
function renderMarkdown(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let cleanLine = line.trim();
    
    // Check for headers (e.g., ### Title)
    if (cleanLine.startsWith('###')) {
      return (
        <h5 key={idx} className="text-xs font-black text-slate-800 tracking-tight mt-3 mb-1 uppercase">
          {cleanLine.replace('###', '').trim()}
        </h5>
      );
    }
    
    // Check for bold titles in points
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      const content = cleanLine.substring(2);
      return (
        <li key={idx} className="text-xs text-slate-600 font-medium leading-relaxed my-1 list-disc ml-4">
          {parseInlineFormatting(content)}
        </li>
      );
    }

    if (cleanLine.startsWith('1. ') || cleanLine.startsWith('2. ') || cleanLine.startsWith('3. ')) {
      const content = cleanLine.substring(3);
      return (
        <li key={idx} className="text-xs text-slate-600 font-medium leading-relaxed my-1 list-decimal ml-4">
          {parseInlineFormatting(content)}
        </li>
      );
    }

    if (cleanLine === '') {
      return <div key={idx} className="h-2" />;
    }

    return (
      <p key={idx} className="text-xs text-slate-600 font-medium leading-relaxed my-1.5Packed">
        {parseInlineFormatting(cleanLine)}
      </p>
    );
  });
}

function parseInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIAdvisor({
  insights,
  transactions,
  isLoadingInsights,
  onRefreshInsights,
}: AIAdvisorProps) {
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am **Centra AI**, your modular financial advisor. I have full context of your logged ledger spreadsheet. You can ask me to write a budget plan, pinpoint your shopping habits, or tell you how to save $100 this week!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [isTypingChat, setIsTypingChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when message logs grow
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTypingChat]);

  // Handle chat submission
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isTypingChat) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: userQuery.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setUserQuery('');
    setIsTypingChat(true);

    try {
      const chatHistory = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          messages: chatHistory,
        }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            role: 'assistant',
            content: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('No reply generated');
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: "Sorry, I stumbled on a network issue. Check if your Express server is running or if your transactions sheet is empty.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTypingChat(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 stroke-emerald-500 fill-emerald-500';
    if (score >= 70) return 'text-amber-500 stroke-amber-500 fill-amber-500';
    return 'text-rose-500 stroke-rose-500 fill-rose-500';
  };

  const scoreColorClass = insights ? getScoreColor(insights.healthScore) : 'text-slate-400';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai_advisor_section_root">
      {/* LEFT: Analytical Insight Diagnostics */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold font-sans text-slate-800 tracking-tight">AI Strategy Recommendations</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Automated financial diagnosis, grading, and optimizations</p>
              </div>

              <button
                onClick={onRefreshInsights}
                disabled={isLoadingInsights}
                className="bg-slate-50 border border-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-slate-100 disabled:opacity-60 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                id="btn_refresh_ai_insights"
              >
                {isLoadingInsights ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Re-Analyze Ledger
                  </>
                )}
              </button>
            </div>

            {/* Main Diagnostics Score and Summary Card */}
            {!insights ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[140px]">
                <Sparkles className="w-6 h-6 text-slate-400 mb-2 animate-bounce" />
                <p className="text-xs text-slate-500 font-semibold mb-2">No analysis report compiled yet.</p>
                <button
                  onClick={onRefreshInsights}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md shadow-blue-900/10"
                >
                  Compile Recommendations Report
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center bg-slate-50/50 border border-slate-100 p-4.5 rounded-2xl mb-6">
                {/* Visual Circle Gauge Score */}
                <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200/60 pb-4 md:pb-0">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Ring Path background */}
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        className="stroke-slate-200"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <motion.circle
                        initial={{ strokeDashoffset: 240 }}
                        animate={{ strokeDashoffset: 240 - (240 * insights.healthScore) / 100 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        cx="48"
                        cy="48"
                        r="38"
                        className={scoreColorClass.includes('emerald') ? 'stroke-emerald-500' : scoreColorClass.includes('amber') ? 'stroke-amber-500' : 'stroke-rose-500'}
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={240}
                      />
                    </svg>
                    <div className="text-center relative z-10 select-none">
                      <span className="text-2xl font-black font-mono block text-slate-800 leading-none">
                        {insights.healthScore}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                        Grade {insights.healthGrade}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide mt-2">
                    Health Index
                  </span>
                </div>

                <div className="md:col-span-3">
                  <div className="flex items-center gap-1 text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">AI Summary Synthesis</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5 select-text">
                    {insights.analysisSummary}
                  </p>
                </div>
              </div>
            )}

            {/* Savings Cards */}
            {insights && (
              <div>
                <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-50 pb-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" /> Actionable Savings Directives
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {insights.savingsTips.map((tip, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 2, scale: 1.005 }}
                      className="flex items-start gap-3 bg-white hover:bg-slate-50/60 p-3 rounded-2xl border border-slate-100 transition-all shadow-xs"
                    >
                      <div className="p-1 px-1.5 font-bold font-sans text-xs bg-blue-10/70 border border-blue-50 text-blue-600 rounded-lg mt-0.5 leading-none shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed select-text mt-0.5">{tip}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Forecast banner */}
                <div className="mt-5 p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block leading-none">Monthly Forecast Model</span>
                    <p className="text-xs text-indigo-800 font-semibold leading-relaxed mt-1 select-text">
                      {insights.forecastText}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Financial Chat Consult Bot */}
      <div className="lg:col-span-5 h-[480px]">
        <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl flex flex-col h-full overflow-hidden relative">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold leading-none tracking-tight">Centra Advisor Concierge</h4>
                <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block leading-none">Synced with active ledger sheet</span>
              </div>
            </div>
            <div className="p-1.5 bg-slate-950/80 rounded-lg text-slate-400 hover:text-white transition-colors cursor-help group relative">
              <HelpCircle className="w-3.5 h-3.5" />
              <div className="absolute right-0 top-7 w-48 text-right bg-slate-950 text-[10px] text-slate-300 p-2 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-800">
                Ask specific transaction breakdowns, custom budget schemas, or target investments.
              </div>
            </div>
          </div>

          {/* Messages window */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 select-text" ref={scrollRef}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs border ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-blue-300 border-slate-700'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble content */}
                <div
                  className={`p-3 rounded-2xl flex flex-col ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-md'
                      : 'bg-slate-950/60 border border-slate-850 text-slate-100 rounded-tl-xs'
                  }`}
                >
                  <div className="text-xs leading-relaxed font-sans font-medium">
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                  </div>
                  <span className="text-[8px] text-slate-400 mt-1 block self-end font-medium leading-none">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTypingChat && (
              <div className="flex gap-3 max-w-[80%] self-start">
                <div className="w-7 h-7 rounded-lg shrink-0 bg-slate-800 text-blue-300 border border-slate-700 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl rounded-tl-xs">
                  <div className="flex items-center gap-1.5 h-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce delay-0" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-850 bg-slate-950/20 shrink-0 flex gap-2">
            <input
              id="chat_advisor_msg_field"
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ask Centra AI strategy or search transactions..."
              className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-hidden placeholder-slate-500"
            />
            <button
              id="btn_chat_send"
              type="submit"
              disabled={isTypingChat || !userQuery.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
