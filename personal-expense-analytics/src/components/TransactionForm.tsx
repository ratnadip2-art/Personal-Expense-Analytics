import React, { useState } from 'react';
import { TransactionCategory, Transaction } from '../types';
import { PlusCircle, Sparkles, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onClearTransactions: () => void;
  onAddBulkTransactions: (items: Omit<Transaction, 'id'>[]) => void;
}

const CATEGORIES: TransactionCategory[] = [
  'Groceries',
  'Dining',
  'Utilities',
  'Shopping',
  'Transport',
  'Entertainment',
  'Other',
];

export default function TransactionForm({
  onAddTransaction,
  onClearTransactions,
  onAddBulkTransactions,
}: TransactionFormProps) {
  // Manual form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Groceries');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<'expense' | 'income'>('expense');

  // AI Parser state
  const [aiText, setAiText] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Manual submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddTransaction({
      title: title.trim(),
      amount: parsedAmount,
      category,
      date,
      type,
    });

    // Reset simple values
    setTitle('');
    setAmount('');
  };

  // AI Command submission
  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim()) return;

    setIsProcessingAi(true);
    setAiMessage(null);

    try {
      const res = await fetch('/api/gemini/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiText,
          localTime: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success && data.items && data.items.length > 0) {
        onAddBulkTransactions(data.items);
        setAiText('');
        setAiMessage({
          text: `Successfully parsed and logged ${data.items.length} items! ${data.message || ''}`,
          isError: false,
        });
      } else {
        setAiMessage({
          text: data.error || "Could not recognize any items in your statement. Try: 'Spent $12 on pizza yesterday'",
          isError: true,
        });
      }
    } catch (err: any) {
      setAiMessage({
        text: 'Network issue connecting to the AI parsing engine.',
        isError: true,
      });
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleShortcutText = (text: string) => {
    setAiText(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="add_transactions_module">
      {/* 1. Natural Language AI Parser */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-44 h-44 bg-pink-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-sans tracking-tight">AI Financial Quick-Add</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Type or voice fluid statements, instantly parsed by Gemini</p>
            </div>
          </div>

          <form onSubmit={handleAiParse} className="mt-5">
            <textarea
              id="ai_natural_grammar_input"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="e.g. Spent $34 at Trader Joe's for weekly groceries yesterday afternoon"
              rows={3}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-2xl p-4 text-xs font-medium text-slate-200 placeholder-slate-500 outline-hidden resize-none transition-all leading-relaxed"
            />

            <div className="flex items-center justify-between gap-4 mt-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Powered by Gemini 3.5 Flash
              </span>
              <button
                id="btn_ai_parse"
                type="submit"
                disabled={isProcessingAi || !aiText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/10"
              >
                {isProcessingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Analysing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Process Statement
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Prompt Suggestions */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mb-2">Try quick shortcuts</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleShortcutText('Spent $14.50 on organic sushi delivery today')}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 transition-colors border border-slate-800/50 px-2.5 py-1.5 rounded-lg font-semibold"
              >
                "Spent $14.50 on sushi today"
              </button>
              <button
                onClick={() => handleShortcutText('Paid $154 for Wi-Fi and electricity utility bill yesterday')}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 transition-colors border border-slate-800/50 px-2.5 py-1.5 rounded-lg font-semibold"
              >
                "Paid $154 wifi and electricity bill"
              </button>
              <button
                onClick={() => handleShortcutText('earned $500 cash tutoring computer science')}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 transition-colors border border-slate-800/50 px-2.5 py-1.5 rounded-lg font-semibold"
              >
                "earned $500 tutoring"
              </button>
            </div>
          </div>

          {/* AI Banner Alerts */}
          <AnimatePresence>
            {aiMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-4 p-3 rounded-xl border flex items-start gap-2.5 ${
                  aiMessage.isError
                    ? 'bg-rose-950/40 text-rose-200 border-rose-900/50'
                    : 'bg-emerald-950/40 text-emerald-250 border-emerald-900/50'
                }`}
              >
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${aiMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`} />
                <p className="text-[10px] leading-relaxed font-semibold">{aiMessage.text}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Structured Manual Entry Desk */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <div>
              <h3 className="text-lg font-bold font-sans text-slate-800 tracking-tight">Logs Manual Ledger</h3>
              <p className="text-xs text-slate-400 font-medium">Log entries with fine-grained parameters</p>
            </div>
            <button
              onClick={onClearTransactions}
              className="text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 hover:bg-rose-50/50 p-2 rounded-xl transition-all cursor-pointer"
              title="Clear active sheet ledger"
              id="btn_clear_ledger"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-3.5 mt-5">
            {/* Title */}
            <div className="col-span-12 sm:col-span-8">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Transaction Title</label>
              <input
                id="manual_field_title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Target Supermarket purchase"
                className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-hidden transition-all"
                required
              />
            </div>

            {/* Amount */}
            <div className="col-span-12 sm:col-span-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Amount ($)</label>
              <input
                id="manual_field_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 placeholder-slate-400 outline-hidden transition-all font-mono"
                required
              />
            </div>

            {/* Category */}
            <div className="col-span-12 md:col-span-5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Category</label>
              <select
                id="manual_field_category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 outline-hidden transition-all"
              >
                {CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="col-span-12 md:col-span-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Date</label>
              <input
                id="manual_field_date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-hidden transition-all"
                required
              />
            </div>

            {/* Type Toggle */}
            <div className="col-span-12 md:col-span-3">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">Flow Type</label>
              <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold text-center tracking-tight transition-all ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Out
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 rounded-lg text-[10px] font-bold text-center tracking-tight transition-all ${
                    type === 'income'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  In
                </button>
              </div>
            </div>

            {/* Form submit button */}
            <div className="col-span-12 mt-2">
              <button
                id="btn_add_manual"
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Add Record to Sheet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
