import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Transaction, BudgetAllocation } from '../types';
import { Library, AlertCircle } from 'lucide-react';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  suggestedAllocations?: BudgetAllocation[];
  monthlyIncomeTarget: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10B981',     // emerald-500
  Dining: '#F59E0B',        // amber-500
  Utilities: '#3B82F6',     // blue-500
  Shopping: '#EC4899',      // pink-500
  Transport: '#8B5CF6',     // purple-500
  Entertainment: '#F43F5E',  // rose-500
  Other: '#64748B',         // slate-500
};

export default function AnalyticsCharts({
  transactions,
  suggestedAllocations = [],
  monthlyIncomeTarget,
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'categories' | 'budget'>('timeline');

  // 1. Process Timeline Data (Grouped by Date)
  const timelineData = useMemo(() => {
    if (transactions.length === 0) return [];

    // Sort transactions by date ascending
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group sums by date
    const dateMap: Record<string, { date: string; income: number; expense: number }> = {};
    sorted.forEach((t) => {
      const dateStr = t.date;
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dateMap[dateStr].income += Number(t.amount);
      } else {
        dateMap[dateStr].expense += Number(t.amount);
      }
    });

    // Create cumulative metrics for timeline flow representation
    const result: any[] = [];
    let cumIncome = 0;
    let cumExpense = 0;

    Object.keys(dateMap)
      .sort()
      .forEach((dateKey) => {
        const item = dateMap[dateKey];
        cumIncome += item.income;
        cumExpense += item.expense;

        // Custom friendly format: e.g. "Jun 12"
        let formattedDate = dateKey;
        try {
          const parts = dateKey.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          if (parts.length === 3) {
            formattedDate = `${monthNames[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
          }
        } catch (e) {
          formattedDate = dateKey;
        }

        result.push({
          rawDate: dateKey,
          date: formattedDate,
          Income: Number(item.income.toFixed(2)),
          Expense: Number(item.expense.toFixed(2)),
          'Cumulative Income': Number(cumIncome.toFixed(2)),
          'Cumulative Expense': Number(cumExpense.toFixed(2)),
        });
      });

    return result;
  }, [transactions]);

  // 2. Process Categories Data
  const categoriesData = useMemo(() => {
    const totals: Record<string, number> = {
      Groceries: 0,
      Dining: 0,
      Utilities: 0,
      Shopping: 0,
      Transport: 0,
      Entertainment: 0,
      Other: 0,
    };

    let totalExpense = 0;
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
        totalExpense += Number(t.amount);
      }
    });

    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        percentage: totalExpense > 0 ? Number(((value / totalExpense) * 100).toFixed(1)) : 0,
      }))
      .filter((item) => item.value > 0);
  }, [transactions]);

  // 3. Process budget compare actual vs recommended allocations
  const budgetCompareData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalActualExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    const actualMap: Record<string, number> = {};
    expenses.forEach((t) => {
      actualMap[t.category] = (actualMap[t.category] || 0) + Number(t.amount);
    });

    const categoriesList = [
      'Groceries',
      'Dining',
      'Utilities',
      'Shopping',
      'Transport',
      'Entertainment',
      'Other',
    ];

    return categoriesList.map((cat) => {
      const actualCost = actualMap[cat] || 0;
      // Actual share out of current total expense
      const actualPct = totalActualExpense > 0 ? (actualCost / totalActualExpense) * 100 : 0;

      // Find suggested allocation share
      const matchedSuggest = suggestedAllocations.find(
        (sa) => sa.category.toLowerCase() === cat.toLowerCase()
      );
      const suggestedPct = matchedSuggest ? matchedSuggest.percentage : 14.3; // Equal spread default if unspecified

      return {
        category: cat,
        'Your Actual %': Number(actualPct.toFixed(1)),
        'AI Recommended %': Number(suggestedPct.toFixed(1)),
        'Actual Spent ($)': Number(actualCost.toFixed(2)),
      };
    });
  }, [transactions, suggestedAllocations]);

  const totalExpenseSum = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  // Simple custom tooltips to style in accordance to visual philosophy
  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs border border-slate-800 shadow-xl font-sans leading-relaxed">
          <p className="font-bold text-slate-300 mb-1">{payload[0].payload.date}</p>
          {payload.map((item: any, i: number) => (
            <p key={i} className="flex items-center gap-1.5 mt-1 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}: <span className="font-semibold text-white">${item.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs border border-slate-800 shadow-xl font-sans">
          <p className="font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.fill }} />
            {data.name}: <span className="font-bold text-white">${data.value.toLocaleString()} ({data.percentage}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 mb-4">
          <Library className="w-8 h-8" />
        </div>
        <h4 className="text-lg font-bold font-sans text-slate-700">No Analytics Loaded</h4>
        <p className="text-sm text-slate-400 max-w-sm mt-1 leading-relaxed">
          Select one of our starting budget templates or add a quick transaction above to construct dynamic data charts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col h-full" id="visual_analytics_panel">
      {/* Chart Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800 tracking-tight">Visual Financial Analytics</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Explore timelines, categories, and AI budgeting grids</p>
        </div>

        {/* Tab Switchers */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            id="tab_timeline"
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-300 ${
              activeTab === 'timeline'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cash Flow Timeline
          </button>
          <button
            id="tab_categories"
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-300 ${
              activeTab === 'categories'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Categories Breakdown
          </button>
          <button
            id="tab_budget"
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-300 ${
              activeTab === 'budget'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-505 hover:text-slate-800'
            }`}
          >
            Budget Optimization
          </button>
        </div>
      </div>

      {/* Chart Content Container */}
      <div className="flex-1 min-h-[300px] w-full">
        {activeTab === 'timeline' && (
          <div className="w-full h-full min-h-[280px]">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EE4646" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#EE4646" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  stroke="#94A3B8"
                  fontSize={10}
                  fontWeight={550}
                  dy={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="#94A3B8"
                  fontSize={10}
                  fontWeight={550}
                  dx={-5}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTimelineTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 500 }} />
                <Area
                  type="monotone"
                  name="Cumulative Income"
                  dataKey="Cumulative Income"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorInc)"
                />
                <Area
                  type="monotone"
                  name="Cumulative Expense"
                  dataKey="Cumulative Expense"
                  stroke="#EE4646"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 h-full">
            <div className="md:col-span-7 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#64748B'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Pie Legend Lists */}
            <div className="md:col-span-5 flex flex-col gap-2 p-1.5 self-center max-h-[280px] overflow-y-auto">
              {categoriesData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-slate-55/40 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-md shrink-0 block"
                      style={{ backgroundColor: CATEGORY_COLORS[item.name] }}
                    />
                    <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 font-mono block">
                      ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="w-full h-full min-h-[290px] flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={budgetCompareData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    stroke="#94A3B8"
                    fontSize={10}
                    fontWeight={550}
                    dy={5}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#94A3B8"
                    fontSize={10}
                    fontWeight={550}
                    tickFormatter={(val) => `${val}%`}
                    dx={-5}
                  />
                  <Tooltip
                    formatter={(val, name, props) => {
                      if (name === 'Your Actual %') {
                        return [`${val}% ($${props.payload['Actual Spent ($)'].toLocaleString()})`, name];
                      }
                      return [`${val}%`, name];
                    }}
                    contentStyle={{ borderRadius: 12, backgroundColor: '#0F172A', color: '#FFF', fontSize: 11 }}
                  />
                  <Legend verticalAlign="top" iconSize={8} iconType="circle" height={36} wrapperStyle={{ fontSize: 11, fontWeight: 500 }} />
                  <Bar dataKey="Your Actual %" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="AI Recommended %" fill="#94a3b8" opacity={0.6} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Warning if spending is highly skewed */}
            {totalExpenseSum > 0 && suggestedAllocations.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
                  <strong>Advice Alert:</strong> Compare pink blocks (your historical spend ratio) to gray shadow grids (standards). Large variances represent optimization zones, especially in variables like Dining.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
