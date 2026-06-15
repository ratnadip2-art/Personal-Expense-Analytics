import { DemoScenario } from './types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'professional',
    name: 'Young Professional',
    emoji: '💼',
    description: 'Tech worker with high food, shopping, and subscription expenses, attempting to set up a proper investment runway.',
    monthlyIncomeTarget: 5800,
    transactions: [
      { title: 'Bi-Weekly Salary Paycheck', amount: 2900, category: 'Other', date: '2026-06-12', type: 'income' },
      { title: 'Organic Market Groceries', amount: 164.50, category: 'Groceries', date: '2026-06-14', type: 'expense' },
      { title: 'Sushi Dinner with friends', amount: 82.00, category: 'Dining', date: '2026-06-13', type: 'expense' },
      { title: 'Ride Sharing Commute', amount: 24.50, category: 'Transport', date: '2026-06-13', type: 'expense' },
      { title: 'Boutique Apparel Shopping', amount: 120.00, category: 'Shopping', date: '2026-06-11', type: 'expense' },
      { title: 'Streaming Video Subscription', amount: 18.99, category: 'Entertainment', date: '2026-06-10', type: 'expense' },
      { title: 'Expressway Gasoline Fill', amount: 45.00, category: 'Transport', date: '2026-06-09', type: 'expense' },
      { title: 'Premium Gym Monthly Dues', amount: 95.00, category: 'Entertainment', date: '2026-06-08', type: 'expense' },
      { title: 'Espresso & Avocado Toast', amount: 16.50, category: 'Dining', date: '2026-06-07', type: 'expense' },
      { title: 'Gigabit Internet Utility', amount: 85.00, category: 'Utilities', date: '2026-06-05', type: 'expense' },
      { title: 'Electric power & HVAC Bill', amount: 142.10, category: 'Utilities', date: '2026-06-04', type: 'expense' },
      { title: 'Weekly Whole Foods Groceries', amount: 148.20, category: 'Groceries', date: '2026-06-03', type: 'expense' },
      { title: 'Acoustic Concert Ticket', amount: 65.00, category: 'Entertainment', date: '2026-06-01', type: 'expense' },
      { title: 'Bi-Weekly Salary Paycheck', amount: 2900, category: 'Other', date: '2026-05-29', type: 'income' },
      { title: 'E-Commerce Gadget buy', amount: 189.00, category: 'Shopping', date: '2026-05-28', type: 'expense' },
      { title: 'Italian Bistro Dinner', amount: 74.00, category: 'Dining', date: '2026-05-26', type: 'expense' },
      { title: 'Weekly Whole Foods Groceries', amount: 135.00, category: 'Groceries', date: '2026-05-25', type: 'expense' },
      { title: 'Public Transit Card Reload', amount: 50.00, category: 'Transport', date: '2026-05-24', type: 'expense' },
      { title: 'Design Magazine Subscription', amount: 9.99, category: 'Entertainment', date: '2026-05-22', type: 'expense' },
      { title: 'Pharm Store Health essentials', amount: 32.40, category: 'Other', date: '2026-05-21', type: 'expense' },
      { title: 'Mobile Phone Plan Bill', amount: 70.00, category: 'Utilities', date: '2026-05-18', type: 'expense' },
      { title: 'Ramen Ramen Lunch', amount: 22.00, category: 'Dining', date: '2026-05-17', type: 'expense' }
    ]
  },
  {
    id: 'student',
    name: 'College Student',
    emoji: '🎓',
    description: 'Surviving on a part-time job and tutoring cash, with tight budgets and high restaurant/social outings.',
    monthlyIncomeTarget: 1400,
    transactions: [
      { title: 'Part-Time Bookstore Wages', amount: 650, category: 'Other', date: '2026-06-12', type: 'income' },
      { title: 'Private Math Tutoring Cash', amount: 120, category: 'Other', date: '2026-06-14', type: 'income' },
      { title: 'Late Night Diner Burger', amount: 14.50, category: 'Dining', date: '2026-06-13', type: 'expense' },
      { title: 'Discount Groceries Mart', amount: 48.90, category: 'Groceries', date: '2026-06-12', type: 'expense' },
      { title: 'College Textbooks (Used)', amount: 110.00, category: 'Shopping', date: '2026-06-10', type: 'expense' },
      { title: 'Library Cafe Coffee & Bagel', amount: 8.50, category: 'Dining', date: '2026-06-08', type: 'expense' },
      { title: 'Video Games Hub Pass', amount: 14.99, category: 'Entertainment', date: '2026-06-07', type: 'expense' },
      { title: 'Bus/Subway Weekly pass', amount: 25.00, category: 'Transport', date: '2026-06-05', type: 'expense' },
      { title: 'Student Housing Internet split', amount: 30.00, category: 'Utilities', date: '2026-06-04', type: 'expense' },
      { title: 'Campus Store Merch', amount: 45.00, category: 'Shopping', date: '2026-06-02', type: 'expense' },
      { title: 'Boba Tea Hangout', amount: 7.20, category: 'Dining', date: '2026-06-01', type: 'expense' },
      { title: 'Part-Time Bookstore Wages', amount: 650, category: 'Other', date: '2026-05-28', type: 'income' },
      { title: 'Campus Concert Entry', amount: 20.00, category: 'Entertainment', date: '2026-05-26', type: 'expense' },
      { title: 'Weekly Groceries Store', amount: 52.40, category: 'Groceries', date: '2026-05-25', type: 'expense' },
      { title: 'Pizza slice & Soda slice', amount: 9.00, category: 'Dining', date: '2026-05-23', type: 'expense' },
      { title: 'Shared House Water/Gas bills', amount: 40.00, category: 'Utilities', date: '2026-05-20', type: 'expense' },
      { title: 'Cinema Movie & Popcorn', amount: 18.50, category: 'Entertainment', date: '2026-05-18', type: 'expense' }
    ]
  },
  {
    id: 'freelancer',
    name: 'Freelancer / Solopreneur',
    emoji: '💻',
    description: 'Variable client invoice schedules, with business expenses like cloud subscriptions, dining, and workspace fees.',
    monthlyIncomeTarget: 6500,
    transactions: [
      { title: 'Invoice: branding project', amount: 4200, category: 'Other', date: '2026-06-11', type: 'income' },
      { title: 'Invoice: web dev milestone', amount: 2500, category: 'Other', date: '2026-06-04', type: 'income' },
      { title: 'Premium Co-Working desk fee', amount: 350.00, category: 'Other', date: '2026-06-14', type: 'expense' },
      { title: 'Cloud server hosting & API keys', amount: 84.50, category: 'Utilities', date: '2026-06-12', type: 'expense' },
      { title: 'Client Lunch Consultation', amount: 112.00, category: 'Dining', date: '2026-06-10', type: 'expense' },
      { title: 'Design software subscription', amount: 54.99, category: 'Entertainment', date: '2026-06-08', type: 'expense' },
      { title: 'Electronics: external monitor', amount: 320.00, category: 'Shopping', date: '2026-06-07', type: 'expense' },
      { title: 'Train to city client presentation', amount: 35.00, category: 'Transport', date: '2026-06-05', type: 'expense' },
      { title: 'Gourmet Coffee shop receipts', amount: 28.50, category: 'Dining', date: '2026-06-04', type: 'expense' },
      { title: 'Weekly Groceries Delivery', amount: 185.00, category: 'Groceries', date: '2026-06-02', type: 'expense' },
      { title: 'Invoice: retainer client', amount: 1200, category: 'Other', date: '2026-05-29', type: 'income' },
      { title: 'Home Office tax accountant fee', amount: 150.00, category: 'Other', date: '2026-05-27', type: 'expense' },
      { title: 'Fast speed fiber internet', amount: 90.00, category: 'Utilities', date: '2026-05-25', type: 'expense' },
      { title: 'Weekly Groceries delivery', amount: 165.00, category: 'Groceries', date: '2026-05-24', type: 'expense' },
      { title: 'Taxi business rides', amount: 44.00, category: 'Transport', date: '2026-05-20', type: 'expense' }
    ]
  },
  {
    id: 'family',
    name: 'Dual Income Family',
    emoji: '🏡',
    description: 'High fixed demands (mortgage equivalent, family healthcare, kids sports) and major recurring groceries.',
    monthlyIncomeTarget: 8200,
    transactions: [
      { title: 'Salary Paycheck A (Biweekly)', amount: 4100, category: 'Other', date: '2026-06-15', type: 'income' },
      { title: 'Salary Paycheck B (Biweekly)', amount: 3200, category: 'Other', date: '2026-06-01', type: 'income' },
      { title: 'Supermarket Stock Groceries', amount: 342.10, category: 'Groceries', date: '2026-06-14', type: 'expense' },
      { title: 'Children Sports Soccer fees', amount: 180.00, category: 'Entertainment', date: '2026-06-13', type: 'expense' },
      { title: 'Family SUV Gas Refuel', amount: 72.00, category: 'Transport', date: '2026-06-12', type: 'expense' },
      { title: 'Local Electric power Coop bill', amount: 215.30, category: 'Utilities', date: '2026-06-11', type: 'expense' },
      { title: 'Household supplies Costco', amount: 289.40, category: 'Shopping', date: '2026-06-10', type: 'expense' },
      { title: 'Kids Medical dental co-pay', amount: 60.00, category: 'Other', date: '2026-06-08', type: 'expense' },
      { title: 'Family Casual Dining Pizza Party', amount: 64.90, category: 'Dining', date: '2026-06-07', type: 'expense' },
      { title: 'Organic Green Groceries', amount: 198.50, category: 'Groceries', date: '2026-06-05', type: 'expense' },
      { title: 'Sewer / Trash Municipal bill', amount: 48.00, category: 'Utilities', date: '2026-06-04', type: 'expense' },
      { title: 'Streaming Video Bundle', amount: 29.99, category: 'Entertainment', date: '2026-06-03', type: 'expense' },
      { title: 'Costco Wholesale Grocery', amount: 310.00, category: 'Groceries', date: '2026-05-28', type: 'expense' },
      { title: 'Car Annual Maintenance', amount: 220.00, category: 'Transport', date: '2026-05-25', type: 'expense' },
      { title: 'High-speed Fiber Web package', amount: 110.00, category: 'Utilities', date: '2026-05-23', type: 'expense' }
    ]
  }
];
