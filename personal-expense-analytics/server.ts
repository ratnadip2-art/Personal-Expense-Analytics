import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent crashes if key is omitted
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured. Please add your key in the Settings > Secrets menu of AI Studio.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Healthcheck endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyConfigured: !!process.env.GEMINI_API_KEY });
});

// AI Transaction Parser Endpoint
app.post("/api/gemini/parse-expense", async (req, res) => {
  const { text, localTime } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text statement is required" });
  }

  const timeStr = localTime || new Date().toISOString();

  try {
    const ai = getGeminiClient();
    const prompt = `Parse the following user input into a list of expense/income items. 
Current local time is: ${timeStr}.
User statement: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A clean descriptive name for the transaction (e.g., Starbucks Coffee, Gas, Netflix, Salary)" },
              amount: { type: Type.NUMBER, description: "The numeric cost, cost of expense, or income value" },
              category: { 
                type: Type.STRING, 
                description: "The primary category. MUST be one of: 'Groceries', 'Dining', 'Utilities', 'Shopping', 'Transport', 'Entertainment', 'Other'"
              },
              date: { type: Type.STRING, description: "Date of the transaction in YYYY-MM-DD format. Check relative statements like 'yesterday' based on current date." },
              type: { type: Type.STRING, description: "Must be exactly 'expense' or 'income'." }
            },
            required: ["title", "amount", "category", "date", "type"]
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "[]");
    res.json({ success: true, items: parsedData, isDemo: false });
  } catch (error: any) {
    console.error("Gemini parse-expense error:", error);
    
    // Graceful fallback for demo use if API key is not configured or fails
    const mockItems = fallbackParseOffline(text, timeStr);
    res.json({
      success: true,
      items: mockItems,
      isDemo: true,
      message: error.message?.includes("GEMINI_API_KEY") 
        ? "Demo Mode: Running client-side keyword matching. Set your GEMINI_API_KEY in secrets to enable natural language parsing!"
        : `Fallback active. (Error: ${error.message})`
    });
  }
});

// AI Insights Generator Endpoint
app.post("/api/gemini/insights", async (req, res) => {
  const { transactions, localTime } = req.body;
  const timeStr = localTime || new Date().toISOString();

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: "Transactions array is required" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this list of personal financial transactions and generate deep analytical insights, budget health scores, forecast models, and optimization tips. 
Current local time reference is ${timeStr}.
Transactions list: ${JSON.stringify(transactions)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER, description: "Financial budget health score between 1 and 100 based on savings, budget caps, and essential ratio." },
            healthGrade: { type: Type.STRING, description: "Letter grade corresponding to credit/budget score, e.g., A+, B-, C, D" },
            analysisSummary: { type: Type.STRING, description: "A concise 2-3 sentence summary explaining current spending, top categories, spikes, or overall trends." },
            savingsTips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Exactly 3 highly actionable, specific expense cutting or budget optimization savings tips custom-targeted to their transactions."
            },
            forecastText: { type: Type.STRING, description: "A predictive sentence of how much they will end up spending by month-end based on active daily spending habits." },
            suggestedBudgetAllocations: {
              type: Type.ARRAY,
              description: "A target layout configuration for categories based on standard 50/30/20 budget optimized for their behaviors.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, description: "Category name" },
                  percentage: { type: Type.INTEGER, description: "Suggested budget percentage allocation (integer summing up to 100)" },
                  reasoning: { type: Type.STRING, description: "Detailed optimization justification text for this allocation" }
                },
                required: ["category", "percentage", "reasoning"]
              }
            }
          },
          required: ["healthScore", "healthGrade", "analysisSummary", "savingsTips", "forecastText", "suggestedBudgetAllocations"]
        }
      }
    });

    const parsedInsights = JSON.parse(response.text || "{}");
    res.json({ success: true, insights: parsedInsights, isDemo: false });
  } catch (error: any) {
    console.error("Gemini insights error:", error);
    
    // Graceful fallback for offline/demo use
    const fallback = generateFallbackInsights(transactions);
    res.json({
      success: true,
      insights: fallback,
      isDemo: true,
      message: error.message?.includes("GEMINI_API_KEY")
        ? "Demo Mode: Running Rule-Based Analytical Model. Set your GEMINI_API_KEY in secrets to activate real Gemini AI financial strategy advice!"
        : `Fallback active. (Error: ${error.message})`
    });
  }
});

// Interactive Advisor Chat Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  const { transactions, messages } = req.body;

  if (!transactions || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Transactions database and messages history are required" });
  }

  try {
    const ai = getGeminiClient();
    
    // Format conversation history
    const systemPrompt = `You are "Centra AI", an expert personal financial advisor and metrics consultant. 
You are embedded in the "Personal Expense Analytics" dashboard.
Here is the user's active transaction database:
${JSON.stringify(transactions)}

Your goal is to answer their query accurately, quoting metrics, calculating sums, or suggesting budgeting guidelines where relevant.
Support markdown tags, lists, and bold text. Keep it concise, friendly, and actionable! Do not invent transactions. Reference the given log content strictly.`;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I will act as Centra AI, your personal finance advisor, leveraging your precise transaction list to give metrics-driven, actionable recommendations." }] }
    ];

    // Append last messages
    for (const msg of messages.slice(-6)) { // Keep last 6 turns for context window
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
    });

    res.json({ success: true, text: response.text, isDemo: false });
  } catch (error: any) {
    console.error("Gemini Chat error:", error);
    
    // Mock response for offline/demo use
    const userQuery = messages[messages.length - 1]?.content || "";
    const mockReply = getFallbackChatReply(userQuery, transactions, error.message);
    res.json({
      success: true,
      text: mockReply,
      isDemo: true
    });
  }
});


// ----------------------------------------------------
// HEURISTIC OFFLINE FALLBACKS (Ensure app is ALWAYS flawless)
// ----------------------------------------------------

function fallbackParseOffline(text: string, referenceTime: string): any[] {
  console.log("Using offline fallback parser for:", text);
  const normalized = text.toLowerCase();
  
  // Try to find an amount
  const amountMatch = normalized.match(/(?:\$|usd)?\s*(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 15.00;

  // Try to guess type
  let type: "expense" | "income" = "expense";
  if (normalized.includes("salary") || normalized.includes("paycheck") || normalized.includes("earned") || normalized.includes("income") || normalized.includes("received")) {
    type = "income";
  }

  // Guess category
  let category = "Other";
  let title = "Quick Added Item";

  if (normalized.includes("coffee") || normalized.includes("starbucks") || normalized.includes("cafe") || normalized.includes("tea")) {
    category = "Dining";
    title = "Cafe / Coffee Spend";
  } else if (normalized.includes("burger") || normalized.includes("restaurant") || normalized.includes("pizza") || normalized.includes("lunch") || normalized.includes("dinner") || normalized.includes("food")) {
    category = "Dining";
    title = "Restaurant Dining";
  } else if (normalized.includes("grocery") || normalized.includes("groceries") || normalized.includes("market") || normalized.includes("supermarket") || normalized.includes("walmart") || normalized.includes("whole foods")) {
    category = "Groceries";
    title = "Grocery Store";
  } else if (normalized.includes("electric") || normalized.includes("water") || normalized.includes("gas bill") || normalized.includes("wifi") || normalized.includes("internet") || normalized.includes("utilities") || normalized.includes("phone")) {
    category = "Utilities";
    title = "Monthly Utility Bill";
  } else if (normalized.includes("uber") || normalized.includes("lyft") || normalized.includes("gas") || normalized.includes("subway") || normalized.includes("transit") || normalized.includes("taxi") || normalized.includes("bus")) {
    category = "Transport";
    title = "Transportation / Transit";
  } else if (normalized.includes("ticket") || normalized.includes("movie") || normalized.includes("concert") || normalized.includes("netflix") || normalized.includes("spotify") || normalized.includes("game") || normalized.includes("entertainment")) {
    category = "Entertainment";
    title = "Entertainment Spend";
  } else if (normalized.includes("cloth") || normalized.includes("shoes") || normalized.includes("amazon") || normalized.includes("shopping") || normalized.includes("buy")) {
    category = "Shopping";
    title = "Shopping Store";
  } else if (type === "income") {
    category = "Other";
    title = normalized.includes("paycheck") ? "Bi-Weekly Paycheck" : "General Income";
  }

  // Handle date
  let date = referenceTime.slice(0, 10);
  if (normalized.includes("yesterday")) {
    const d = new Date(referenceTime);
    d.setDate(d.getDate() - 1);
    date = d.toISOString().slice(0, 10);
  }

  return [{
    title,
    amount,
    category,
    date,
    type
  }];
}

function generateFallbackInsights(transactions: any[]): any {
  const expenses = transactions.filter(t => t.type === "expense");
  const income = transactions.filter(t => t.type === "income");

  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  
  // Calculate category totals
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
  });

  // Find topmost category
  let topCategory = "N/A";
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    if (val > topCategoryAmount) {
      topCategory = cat;
      topCategoryAmount = val;
    }
  });

  // Score mapping
  let healthScore = 75;
  if (totalIncome > 0) {
    const savingsRatio = (totalIncome - totalExpense) / totalIncome;
    if (savingsRatio > 0.3) healthScore = 92;
    else if (savingsRatio > 0.15) healthScore = 84;
    else if (savingsRatio > 0) healthScore = 72;
    else healthScore = 48;
  } else if (totalExpense > 1000) {
    healthScore = 55;
  }

  let healthGrade = "C+";
  if (healthScore >= 90) healthGrade = "A";
  else if (healthScore >= 80) healthGrade = "B+";
  else if (healthScore >= 70) healthGrade = "B-";
  else if (healthScore >= 60) healthGrade = "C";
  else if (healthScore >= 50) healthGrade = "D+";
  else healthGrade = "F";

  const numTrans = transactions.length;

  return {
    healthScore,
    healthGrade,
    analysisSummary: `Running custom analytical engine on ${numTrans} active records. Your total logged spending is $${totalExpense.toFixed(2)} against income of $${totalIncome.toFixed(2)}. Spending is primarily driven by your ${topCategory} category, which accounts for $${topCategoryAmount.toFixed(2)}.`,
    savingsTips: [
      `Limit discretionary spending in your highest category (${topCategory}) which amounts to $${topCategoryAmount.toFixed(2)} this month.`,
      `Set up automated weekly alerts or cap your Dining / Shopping categories to maintain your target savings rate.`,
      `Review your small repeat subscriptions. Trimming down dormant streaming channels or subscriptions could save you up to $150 annually.`
    ],
    forecastText: `Based on your average velocity, you are on track to spend approximately $${(totalExpense * 1.12).toFixed(2)} by the end of the month, indicating a stable budget profile.`,
    suggestedBudgetAllocations: [
      { category: "Groceries", percentage: 25, reasoning: "Essential nourishment. Fits standard 50% needs envelope." },
      { category: "Dining", percentage: 15, reasoning: "Allows comfortable casual dining out without overinflating lifestyle creep." },
      { category: "Utilities", percentage: 20, reasoning: "Fixed baseline bills spanning cell phone, internet, and electricity." },
      { category: "Transport", percentage: 10, reasoning: "Covers standard gasoline and public transit commutes." },
      { category: "Shopping", percentage: 12, reasoning: "Discretionary buffer category for clothing and material buys." },
      { category: "Entertainment", percentage: 8, reasoning: "Allocated budget for subscriptions and social outings." },
      { category: "Other", percentage: 10, reasoning: "Reserve cash flow safety net for unforeseen occurrences." }
    ]
  };
}

function getFallbackChatReply(query: string, transactions: any[], originalError: string): string {
  const normalized = query.toLowerCase();
  
  const expenses = transactions.filter(t => t.type === "expense");
  const income = transactions.filter(t => t.type === "income");
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  let reply = `🤖 **Centra AI Assistant (Demo Mode)**\n\n`;
  reply += `*Note: The Gemini API could not be reached directly (${originalError.includes("GEMINI_API_KEY") ? "Missing API Key" : "Connection Issue"}). Running offline rule-based advisor.* \n\n`;

  if (normalized.includes("total") || normalized.includes("spend") || normalized.includes("how much")) {
    reply += `According to your active sheets log:\n`;
    reply += `- **Total Expenses**: $${totalExpense.toFixed(2)}\n`;
    reply += `- **Total Income**: $${totalIncome.toFixed(2)}\n`;
    reply += `- **Net Balance**: $${(totalIncome - totalExpense).toFixed(2)}\n\n`;
    reply += `Would you like me to map out a target budgeting plan based on these values?`;
  } else if (normalized.includes("category") || normalized.includes("highest") || normalized.includes("breakdown")) {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
    });
    
    reply += `Here is your spending broken down by category:\n\n`;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      reply += `- **${cat}**: $${val.toFixed(2)} (${((val / (totalExpense || 1)) * 100).toFixed(0)}%)\n`;
    });
    reply += `\nYour highest cost vertical is **${Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, "None")}**.`;
  } else if (normalized.includes("save") || normalized.includes("budget") || normalized.includes("advice")) {
    reply += `Here are three generic rules to jumpstart your savings immediately:\n\n`;
    reply += `1. **The 50/30/20 Rule**: Allocate 50% of your net income to Needs (Groceries, utilities, rent), 30% to Wants (Dining out, streaming, electronics), and 20% to Savings or Debt reduction.\n`;
    reply += `2. **Cut Subscriptions**: Track recurring utility/SaaS bills down. Cancel any service you have not logged in to in the last 45 days.\n`;
    reply += `3. **Dining Caps**: Put a firm weekly cap of $40 on food delivery apps. Cooking groceries is up to 3x cheaper per meal on average.`;
  } else {
    reply += `I am analyzing your log of **${transactions.length} items**. \n\n`;
    reply += `You can ask me questions like:\n`;
    reply += `- *"How much did I spend in total?"*\n`;
    reply += `- *"What is my highest category breakdown?"*\n`;
    reply += `- *"Give me advice on saving money"* \n\n`;
    reply += `Feel free to try adding a transaction in the prompt above like *"Spent $12 on lunch yesterday"* to see me parse it instantly!`;
  }

  return reply;
}


// ----------------------------------------------------
// VITE OR STATIC FILE PROXYING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // DEV MODE: Integrate Vite dev server middleware
    console.log("Starting server in development mode with Vite HMR middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // PRODUCTION MODE: Serve static assets
    console.log("Starting server in production mode serving static /dist assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully active on http://localhost:${PORT}`);
  });
}

startServer();
