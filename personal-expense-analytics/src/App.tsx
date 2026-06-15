import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, InsightData, DemoScenarioId } from './types';
import { DEMO_SCENARIOS } from './data';
import MetricCard from './components/MetricCard';
import AnalyticsCharts from './components/AnalyticsCharts';
import TransactionForm from './components/TransactionForm';
import AIAdvisor from './components/AIAdvisor';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  X, 
  Database,
  Sparkles,
  Info,
  BadgeAlert,
  ArrowRight,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeScenario, setActiveScenario] = useState<DemoScenarioId>(() => {
    const cachedScenario = localStorage.getItem('pea_active_scenario');
    return (cachedScenario as DemoScenarioId) || 'professional';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const cached = localStorage.getItem('pea_transactions');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Error parsing cached transactions", e);
      }
    }
    // Load default Young Professional scenario by default
    const defaultScenario = DEMO_SCENARIOS[0];
    return defaultScenario.transactions.map((t, idx) => ({
      ...t,
      id: `default-${idx}-${Date.now()}`
    }));
  });

  const [insights, setInsights] = useState<InsightData | null>(() => {
    const cached = localStorage.getItem('pea_insights');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return null;
  });

  const [incomeTarget, setIncomeTarget] = useState<number>(() => {
    const matched = DEMO_SCENARIOS.find(s => s.id === activeScenario);
    return matched ? matched.monthlyIncomeTarget : 5000;
  });

  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightMessage, setInsightMessage] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  
  // Tab controller
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'sheet' | 'advisor'>('sheet');

  // Real-time clock display
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save state back to localStorage on change
  useEffect(() => {
    localStorage.setItem('pea_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (insights) {
      localStorage.setItem('pea_insights', JSON.stringify(insights));
    }
  }, [insights]);

  useEffect(() => {
    localStorage.setItem('pea_active_scenario', activeScenario);
  }, [activeScenario]);

  // Load Scenario Handler
  const handleLoadScenario = (scenarioId: DemoScenarioId) => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    setActiveScenario(scenarioId);
    setIncomeTarget(scenario.monthlyIncomeTarget);
    
    // Convert preset records into real objects with unique IDs
    const formatted = scenario.transactions.map((t, idx) => ({
      ...t,
      id: `scenario-${scenarioId}-${idx}-${Date.now()}`,
    }));

    setTransactions(formatted);
    setInsights(null); // Clear previous insights to trigger re-analysis
    setInsightMessage(null);
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedType('All');
  };

  // Analyze report with server-side Gemini
  const handleAnalyzeLedger = async () => {
    setIsLoadingInsights(true);
    setInsightMessage(null);

    try {
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions,
          localTime: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
        setIsDemoMode(data.isDemo || false);
        if (data.message) {
          setInsightMessage(data.message);
        }
      } else {
        throw new Error(data.error || "Failed to generate report");
      }
    } catch (e: any) {
      console.error(e);
      setInsightMessage(`Analysis calculation failed. Check server status or parameters. (${e.message})`);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Auto trigger analysis on initial load if insights is empty
  useEffect(() => {
    if (!insights && transactions.length > 0) {
      const debounceTimer = setTimeout(() => {
        handleAnalyzeLedger();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [transactions, insights]);

  // Individual record management
  const handleAddTransaction = (newTrans: Omit<Transaction, 'id'>) => {
    const item: Transaction = {
      ...newTrans,
      id: `user-${Date.now()}`
    };
    setTransactions(prev => [item, ...prev]);
  };

  const handleAddBulkTransactions = (items: Omit<Transaction, 'id'>[]) => {
    const parsed = items.map((t, i) => ({
      ...t,
      id: `bulk-${i}-${Date.now()}`
    }));
    setTransactions(prev => [...parsed, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleClearTransactions = () => {
    if (confirm("Are you sure you want to clear all active ledger records?")) {
      setTransactions([]);
      setInsights(null);
    }
  };

  // Financial Calculators
  const financialTotals = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        income += Number(t.amount);
      } else {
        expense += Number(t.amount);
      }
    });

    const netBalance = income - expense;
    const savingsRate = income > 0 ? (netBalance / income) * 100 : 0;
    const budgetEnvelopePct = incomeTarget > 0 ? (expense / incomeTarget) * 100 : 0;

    return {
      income,
      expense,
      netBalance,
      savingsRate,
      budgetEnvelopePct
    };
  }, [transactions, incomeTarget]);

  // Filter accounts record set
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesType = selectedType === 'All' || t.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, searchTerm, selectedCategory, selectedType]);

  // Unique categories for filtering lists
  const categoriesList = ['Groceries', 'Dining', 'Utilities', 'Shopping', 'Transport', 'Entertainment', 'Other'];

  const scenarioDescription = useMemo(() => {
    return DEMO_SCENARIOS.find(s => s.id === activeScenario);
  }, [activeScenario]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* 1. UTILITY NAVIGATION HEADER BAR */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50 shadow-xs" id="app_primary_header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Brand Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md cursor-pointer hover:bg-slate-800 transition-colors">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black font-sans text-slate-900 tracking-tight">Centra Analytics</h1>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full select-none">
                  v2.0-Express
                </span>
              </div>
              <p className="text-xs text-slate-400 font-bold tracking-tight">Personal Expense Analytics Engine & AI Diagnostics Workspace</p>
            </div>
          </div>

          {/* User Email & Dynamic Clock Widget */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="text-right hidden md:block">
              <span className="text-xs font-black text-slate-700 block leading-tight">ratnadipmore2286@gmail.com</span>
              <span className="text-[10px] text-slate-400 font-extrabold flex items-center justify-end gap-1 mt-0.5 uppercase tracking-wider leading-none">
                <Clock className="w-3 h-3 text-slate-400" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} PST
              </span>
            </div>
            
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer relative group">
              <User className="w-4 h-4" />
              <div className="absolute right-0 top-11 bg-slate-900 text-white text-[10px] p-2 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800 font-semibold font-mono">
                ratnadipmore2286@gmail.com
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* 2. CHOOSE PRESET SCENARIO HEADER */}
      <section className="bg-white border-b border-slate-100 px-6 py-3.5" id="presets_row_section">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 max-w-lg">
            <span className="p-2 bg-slate-100 rounded-lg text-slate-600 font-extrabold text-sm mt-0.5 select-none shrink-0 border border-slate-205/30">
              {scenarioDescription?.emoji || '💰'}
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 leading-none">
                Scenario Profile: <span className="text-blue-600">{scenarioDescription?.name}</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-normal mt-1.5 select-text">
                {scenarioDescription?.description}
              </p>
            </div>
          </div>

          {/* Quick Pill Toggles */}
          <div className="flex flex-wrap gap-2">
            {DEMO_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                id={`btn_load_preset_${sc.id}`}
                onClick={() => handleLoadScenario(sc.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold tracking-tight border cursor-pointer transition-all flex items-center gap-1.5 focus:outline-none ${
                  activeScenario === sc.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-100 hover:border-slate-250 hover:bg-slate-50/50'
                }`}
              >
                <span>{sc.emoji}</span>
                <span>{sc.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC BENTO METRICS WIDGET SUMMARY PANEL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Banner Informers if Demo */}
        {insightMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-2xl border flex items-center justify-between gap-4 shadow-xs ${
              isDemoMode 
                ? 'bg-amber-50 text-amber-800 border-amber-100'
                : 'bg-blue-50 text-blue-800 border-blue-105'
            }`}
            id="advisor_telemetry_banner"
          >
            <div className="flex items-center gap-2.5 select-text">
              <Info className="w-4 h-4 shrink-0" />
              <p className="text-[11px] font-semibold leading-normal">{insightMessage}</p>
            </div>
            <button 
              onClick={() => setInsightMessage(null)} 
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="bento_metrics_grid">
          
          {/* Metric 1: Spent Envelope */}
          <MetricCard
            id="metric_card_expense"
            title="Total Period Spend"
            value={`$${financialTotals.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle={`Target Limit: $${incomeTarget.toLocaleString()}`}
            icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
            progress={{
              percentage: financialTotals.budgetEnvelopePct,
              colorClass: financialTotals.budgetEnvelopePct > 80 ? 'bg-rose-500' : financialTotals.budgetEnvelopePct > 50 ? 'bg-amber-500' : 'bg-blue-500'
            }}
            colorTheme={financialTotals.budgetEnvelopePct > 80 ? 'rose' : 'slate'}
          />

          {/* Metric 2: Net Cash Balance */}
          <MetricCard
            id="metric_card_balance"
            title="Logged Net Balance"
            value={`$${financialTotals.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle={`Savings Rate: ${financialTotals.savingsRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            trend={{
              value: `${financialTotals.savingsRate.toFixed(0)}%`,
              isPositive: financialTotals.netBalance >= 0,
              label: 'of income kept'
            }}
            colorTheme={financialTotals.netBalance >= 0 ? 'emerald' : 'rose'}
          />

          {/* Metric 3: Logged Income */}
          <MetricCard
            id="metric_card_income"
            title="Period Logged Income"
            value={`$${financialTotals.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle="Base salary + other inflows"
            icon={<DollarSign className="w-5 h-5 text-blue-500" />}
            colorTheme="blue"
          />

          {/* Metric 4: AI Pulse Alert */}
          <motion.div
            id="bento_metrics_advisory_capsule"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">AI Advisor Snapshot</span>
                <h4 className="text-xs font-bold leading-normal text-slate-700 mt-2 select-text">
                  {insights ? (
                    <>
                      Score is <strong className="text-blue-600">{insights.healthScore}/100</strong>. {insights.savingsTips[0].substring(0, 85)}...
                    </>
                  ) : (
                    'Run report below to fetch strategic advice tailored to your active ledger.'
                  )}
                </h4>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-10/40 text-blue-600 border border-blue-50">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
            </div>

            {insights && (
              <button
                onClick={() => {
                  setActiveWorkspaceTab('advisor');
                  setTimeout(() => {
                    document.getElementById('ai_advisor_section_root')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-3.5 uppercase tracking-wider cursor-pointer"
              >
                Go to Advisor Suite <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </motion.div>

        </div>

        {/* 4. MAIN SIDE-BY-SIDE INTERFACE (Ledger + Advisor vs. Charts Frame) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="dashboard_primary_workbench">
          
          {/* LEFT RUNWAY: Active Worksheet Tabs console */}
          <section className="xl:col-span-7 flex flex-col gap-6">
            
            {/* Control Header Grid */}
            <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                <button
                  id="tab_sheet_view"
                  onClick={() => setActiveWorkspaceTab('sheet')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold select-none transition-all duration-300 ${
                    activeWorkspaceTab === 'sheet'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Spreadsheet Ledger Log
                </button>
                <button
                  id="tab_advisor_view"
                  onClick={() => setActiveWorkspaceTab('advisor')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold select-none transition-all duration-300 flex items-center gap-1.5 ${
                    activeWorkspaceTab === 'advisor'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-505 hover:text-slate-850'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  AI Advisor Suite
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-400 font-extrabold hidden sm:block">
                ACTIVE RECORDS: {transactions.length}
              </span>
            </div>

            {/* TAB WINDOWS VIEWPORT */}
            <div className="min-h-[450px]">
              <AnimatePresence mode="wait">
                {activeWorkspaceTab === 'sheet' ? (
                  <motion.div
                    key="sheet_log"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col gap-6"
                  >
                    
                    {/* Add Transaction Form Panels */}
                    <TransactionForm
                      onAddTransaction={handleAddTransaction}
                      onClearTransactions={handleClearTransactions}
                      onAddBulkTransactions={handleAddBulkTransactions}
                    />

                    {/* Filter & Listing Table Console */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col shadow-xs">
                      
                      {/* Search Bar / Category Filters Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-50">
                        <div>
                          <h3 className="text-base font-bold text-slate-800 tracking-tight">Active Accounts Ledger</h3>
                          <p className="text-xs text-slate-400 font-medium">Verify balances, search transactions, or filter categories</p>
                        </div>

                        {/* Search and Category inputs */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Search Input bar */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-450 absolute left-3 top-2.5" />
                            <input
                              id="tracker_search_field"
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search title..."
                              className="bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-slate-350 focus:bg-white text-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs font-semibold outline-hidden transition-all placeholder-slate-400 w-full sm:w-40"
                            />
                          </div>

                          {/* Category Filter dropdown */}
                          <div className="flex items-center gap-1.5">
                            <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                            <select
                              id="tracker_category_filter"
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="bg-slate-50 border border-slate-100 focus:border-slate-300 text-slate-600 rounded-xl px-2 py-1.5 text-xs font-semibold outline-hidden"
                            >
                              <option value="All">All Categories</option>
                              {categoriesList.map((cat, i) => (
                                <option key={i} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Type filter */}
                          <select
                            id="tracker_type_filter"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="bg-slate-50 border border-slate-100 focus:border-slate-300 text-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-hidden"
                          >
                            <option value="All">All flows</option>
                            <option value="expense">Outflow</option>
                            <option value="income">Inflow</option>
                          </select>
                        </div>
                      </div>

                      {/* Transaction Table List */}
                      <div className="overflow-x-auto mt-4 max-h-[380px] overflow-y-auto">
                        <table className="w-full text-left border-collapse" id="transactions_ledger_table">
                          <thead>
                            <tr className="border-b border-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              <th className="py-2.5 px-3">Title Details</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-right">Value ($)</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-8 text-xs font-medium text-slate-400">
                                  No transaction records found matching active query settings.
                                </td>
                              </tr>
                            ) : (
                              filteredTransactions.map((t) => (
                                <tr
                                  key={t.id}
                                  className="border-b border-slate-5/50 hover:bg-slate-50/50 transition-colors py-1.5"
                                  id={`ledger_row_${t.id}`}
                                >
                                  {/* Title details + Flow badge */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-1.5 h-1.5 shrink-0 rounded-full block ${
                                          t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                                        }`}
                                      />
                                      <span className="text-xs font-bold text-slate-700 block truncate max-w-[180px] select-text">
                                        {t.title}
                                      </span>
                                    </div>
                                  </td>
                                  
                                  {/* Date */}
                                  <td className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 font-mono">
                                    {t.date}
                                  </td>

                                  {/* Category Badge */}
                                  <td className="py-2.5 px-3">
                                    <span className="bg-slate-100 text-slate-650 text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-150/40 select-none">
                                      {t.category}
                                    </span>
                                  </td>

                                  {/* Value Cost */}
                                  <td className="py-2.5 px-3 text-right">
                                    <span
                                      className={`text-xs font-bold font-mono block ${
                                        t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                                      }`}
                                    >
                                      {t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                  </td>

                                  {/* Action Delete */}
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => handleDeleteTransaction(t.id)}
                                      className="text-slate-350 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                      title="Delete record"
                                      id={`btn_delete_record_${t.id}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>

                  </motion.div>
                ) : (
                  <motion.div
                    key="advisor_room"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    <AIAdvisor
                      insights={insights}
                      transactions={transactions}
                      isLoadingInsights={isLoadingInsights}
                      onRefreshInsights={handleAnalyzeLedger}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </section>

          {/* RIGHT RUNWAY: Analytics Charts (Always visible on large screens) */}
          <section className="xl:col-span-5 h-[480px] xl:h-auto">
            <AnalyticsCharts
              transactions={transactions}
              monthlyIncomeTarget={incomeTarget}
              suggestedAllocations={insights?.suggestedBudgetAllocations}
            />
          </section>

        </div>

      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 px-6 mt-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Personal Expense Analytics • Built via Google AI Studio</span>
          <span>© 2026 Centra Finance Tools</span>
        </div>
      </footer>
    </div>
  );
}
