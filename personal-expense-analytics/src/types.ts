export type TransactionCategory =
  | 'Groceries'
  | 'Dining'
  | 'Utilities'
  | 'Shopping'
  | 'Transport'
  | 'Entertainment'
  | 'Other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: TransactionCategory;
  date: string; // YYYY-MM-DD
  type: 'expense' | 'income';
}

export interface BudgetAllocation {
  category: string;
  percentage: number;
  reasoning: string;
}

export interface InsightData {
  healthScore: number;
  healthGrade: string;
  analysisSummary: string;
  savingsTips: string[];
  forecastText: string;
  suggestedBudgetAllocations: BudgetAllocation[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type DemoScenarioId = 'professional' | 'student' | 'freelancer' | 'family';

export interface DemoScenario {
  id: DemoScenarioId;
  name: string;
  description: string;
  emoji: string;
  monthlyIncomeTarget: number;
  transactions: Omit<Transaction, 'id'>[];
}
