import { useState, useEffect, FormEvent } from "react";
import { initialAppState } from "./data";
import { AppState, Goal, Transaction, SavingsRecord } from "./types";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Send,
  User,
  Settings,
  Bell,
  Fingerprint,
  Globe,
  LogOut,
  ChevronRight,
  Database,
  Trash2,
  PieChart,
  Lightbulb,
  Heart,
  Briefcase,
  Moon,
  Sun,
  Palette,
  CheckCircle,
  HelpCircle,
  PiggyBank,
  Rocket,
  LayoutDashboard,
  Receipt,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Info,
  AlertTriangle,
  Sliders
} from "lucide-react";

// Robust parsing of free-form and ISO dates to standard Monthly Key and label
export function getMonthKeyAndLabel(dateStr: string): { key: string; label: string; sortVal: number } {
  if (!dateStr) {
    return { key: "2026-05", label: "Mayo 2026", sortVal: 202605 };
  }
  const dStr = dateStr.trim().toLowerCase();
  
  // Format 1: "Hoy, 14:30" or "Ayer, 09:15"
  if (dStr.startsWith("hoy") || dStr.startsWith("ayer")) {
    return { key: "2026-05", label: "Mayo 2026", sortVal: 202605 };
  }

  // Support direct standard ISO strings like "2026-05-15" (e.g. from type="date")
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (isoMatch) {
    const isoYear = isoMatch[1];
    const isoMonth = isoMatch[2];
    const monthIndex = parseInt(isoMonth, 10);
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return {
      key: `${isoYear}-${isoMonth}`,
      label: `${months[monthIndex - 1]} ${isoYear}`,
      sortVal: parseInt(isoYear, 10) * 100 + monthIndex
    };
  }

  let year = 2026; // Default to 2026 for generic entries without standard years
  const yearMatch = dateStr.match(/\b(202\d)\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  let monthKey = "05";
  let monthLabel = "Mayo";

  if (dStr.includes("ene") || dStr.includes("jan")) {
    monthKey = "01";
    monthLabel = "Enero";
  } else if (dStr.includes("feb")) {
    monthKey = "02";
    monthLabel = "Febrero";
  } else if (dStr.includes("mar")) {
    monthKey = "03";
    monthLabel = "Marzo";
  } else if (dStr.includes("abr") || dStr.includes("apr")) {
    monthKey = "04";
    monthLabel = "Abril";
  } else if (dStr.includes("may")) {
    monthKey = "05";
    monthLabel = "Mayo";
  } else if (dStr.includes("jun")) {
    monthKey = "06";
    monthLabel = "Junio";
  } else if (dStr.includes("jul")) {
    monthKey = "07";
    monthLabel = "Julio";
  } else if (dStr.includes("ago") || dStr.includes("aug")) {
    monthKey = "08";
    monthLabel = "Agosto";
  } else if (dStr.includes("sep")) {
    monthKey = "09";
    monthLabel = "Septiembre";
  } else if (dStr.includes("oct")) {
    monthKey = "10";
    monthLabel = "Octubre";
  } else if (dStr.includes("nov")) {
    monthKey = "11";
    monthLabel = "Noviembre";
  } else if (dStr.includes("dic") || dStr.includes("dec")) {
    monthKey = "12";
    monthLabel = "Diciembre";
  }

  return {
    key: `${year}-${monthKey}`,
    label: `${monthLabel} ${year}`,
    sortVal: year * 100 + parseInt(monthKey, 10)
  };
}

export function formatDateToShow(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes(",") || dateStr.match(/[a-zA-Z]/)) {
    return dateStr; // already formatted or is text
  }
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const monthsShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${day} ${monthsShort[monthIndex - 1]} ${year}`;
  }
  return dateStr;
}

export default function App() {
  // Load state from local storage or use initial data
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("ordena_finanzas_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.monthlyExpenseLimit === undefined) {
          parsed.monthlyExpenseLimit = initialAppState.monthlyExpenseLimit;
        }
        if (!parsed.categoryLimits) {
          parsed.categoryLimits = initialAppState.categoryLimits;
        }
        return parsed;
      } catch (e) {
        return initialAppState;
      }
    }
    return initialAppState;
  });

  // Current selected screen
  const [currentScreen, setCurrentScreen] = useState<"inicio" | "movimientos" | "analisis" | "ahorros" | "metas">("inicio");
  
  // Settings modal status
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectionsModalOpen, setIsProjectionsModalOpen] = useState(false);
  const [projectionYears, setProjectionYears] = useState(5);
  const [projectionInterestRate, setProjectionInterestRate] = useState(8.2);

  // Show welcome notification on app load
  const [showWelcomeToast, setShowWelcomeToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeToast(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Theme details
  const [softColorTone, setSoftColorTone] = useState<"celeste" | "verde" | "rosa" | "crema">("celeste");

  // Chat message & AI list
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: `¡Hola ${state.profile.name}! Soy tu asesor financiero de Ordena Tus Finanzas. ¿En qué puedo apoyarte hoy con tu flujo de caja o metas?` }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form states
  const [newTransaction, setNewTransaction] = useState<{
    description: string;
    category: string;
    amount: string;
    type: "gasto" | "ingreso";
    date: string;
  }>({
    description: "",
    category: "Alimentación",
    amount: "",
    type: "gasto",
    date: new Date().toISOString().split("T")[0]
  });

  const [savingContribution, setSavingContribution] = useState<{
    amount: string;
    date: string;
    concept: string;
  }>({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    concept: "Ahorro Adicional"
  });

  const [newGoal, setNewGoal] = useState<{
    name: string;
    target: string;
    category: "vivienda" | "comida" | "viaje" | "estudio" | "vehiculo" | "general";
    daysLeft: string;
  }>({
    name: "",
    target: "",
    category: "general",
    daysLeft: "300"
  });

  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<string | null>(null);
  const [contributionAmountToGoal, setContributionAmountToGoal] = useState("");

  const [filterCategory, setFilterCategory] = useState<string>("todas");
  const [filterMonth, setFilterMonth] = useState<string>("todos");

  // Save state to local storage when changed
  useEffect(() => {
    localStorage.setItem("ordena_finanzas_state", JSON.stringify(state));
  }, [state]);

  // Handle transaction submission
  const handleAddTransaction = (e: FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newTransaction.amount);
    if (!newTransaction.description || isNaN(amountVal) || amountVal <= 0) {
      alert("Por favor introduce una descripción válida y un monto mayor a cero.");
      return;
    }

    const t: Transaction = {
      id: "t_" + Date.now(),
      description: newTransaction.description,
      category: newTransaction.category,
      date: newTransaction.date,
      amount: amountVal,
      type: newTransaction.type
    };

    // Calculate details
    let newNetWorth = state.netWorth;
    let newExpenses = state.expenses;
    let newIncome = state.income;

    if (newTransaction.type === "gasto") {
      newNetWorth -= amountVal;
      newExpenses += amountVal;

      // Check budget limits for dynamic warning alerts
      const limitCategory = state.categoryLimits[newTransaction.category] || 500;
      const currentCatSpent = state.transactions
        .filter(tx => tx.type === "gasto" && tx.category === newTransaction.category)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const projectedCatSpent = currentCatSpent + amountVal;
      const categoryPercentage = (projectedCatSpent / limitCategory) * 100;

      const currentTotalSpent = state.transactions
        .filter(tx => tx.type === "gasto")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const projectedTotalSpent = currentTotalSpent + amountVal;
      const totalPercentage = (projectedTotalSpent / state.monthlyExpenseLimit) * 100;

      if (categoryPercentage >= 100) {
        alert(`🚨 ¡ALERTA DE PRESUPUESTO EXCEDIDO! Has superado el límite de gasto para la categoría '${newTransaction.category}' ($${projectedCatSpent.toFixed(2)} de un límite de $${limitCategory.toFixed(2)}).`);
      } else if (categoryPercentage >= 75) {
        alert(`⚠️ ¡ATENCIÓN! Estás muy cerca de agotar el límite de gasto en la categoría '${newTransaction.category}' ($${projectedCatSpent.toFixed(2)} de $${limitCategory.toFixed(2)}, un ${Math.round(categoryPercentage)}% gastado).`);
      }

      if (totalPercentage >= 100) {
        alert(`🚨 ¡ALERTA GLOBAL DE PRESUPUESTO! Has superado el límite total de gasto mensual de $${state.monthlyExpenseLimit.toFixed(2)} ($${projectedTotalSpent.toFixed(2)} de $${state.monthlyExpenseLimit.toFixed(2)}).`);
      } else if (totalPercentage >= 75) {
        alert(`⚠️ ¡ADVERTENCIA GLOBAL! El total de tus gastos ha alcanzado el ${Math.round(totalPercentage)}% de tu límite general mensual ($${projectedTotalSpent.toFixed(2)} gastados de un tope de $${state.monthlyExpenseLimit.toFixed(2)}).`);
      }
    } else {
      newNetWorth += amountVal;
      newIncome += amountVal;
    }

    setState(prev => ({
      ...prev,
      netWorth: newNetWorth,
      expenses: newExpenses,
      income: newIncome,
      transactions: [t, ...prev.transactions]
    }));

    // Reset input fields
    setNewTransaction({
      description: "",
      category: "Alimentación",
      amount: "",
      type: "gasto",
      date: new Date().toISOString().split("T")[0]
    });

    alert("¡Movimiento registrado con éxito!");
  };

  // State modifiers for interactive budget settings
  const handleUpdateCategoryLimit = (category: string, limit: number) => {
    setState(prev => ({
      ...prev,
      categoryLimits: {
        ...prev.categoryLimits,
        [category]: Math.max(0, limit)
      }
    }));
  };

  const handleUpdateMonthlyLimit = (limit: number) => {
    setState(prev => ({
      ...prev,
      monthlyExpenseLimit: Math.max(0, limit)
    }));
  };

  const handleUpdateIncomeValue = (income: number) => {
    setState(prev => ({
      ...prev,
      income: Math.max(0, income)
    }));
  };

  // Add savings contribution
  const handleAddSavings = (e: FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(savingContribution.amount);
    if (isNaN(amountVal) || amountVal <= 0 || !savingContribution.concept) {
      alert("Por favor ingresa un monto válido y un concepto para el depósito.");
      return;
    }

    const record: SavingsRecord = {
      id: "s_" + Date.now(),
      concept: savingContribution.concept,
      date: new Date(savingContribution.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
      amount: amountVal,
      type: "extraordinario"
    };

    setState(prev => ({
      ...prev,
      savingsTotal: prev.savingsTotal + amountVal,
      netWorth: prev.netWorth + amountVal,
      savingsHistory: [record, ...prev.savingsHistory]
    }));

    // Reset fields
    setNewSavingsForm();
    alert("¡Depósito para ahorro quincenal confirmado exitosamente!");
  };

  const setNewSavingsForm = () => {
    setSavingContribution({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      concept: "Ahorro Adicional"
    });
  };

  // Delete a transaction safely
  const handleDeleteTransaction = (id: string) => {
    const transaction = state.transactions.find(t => t.id === id);
    if (!transaction) return;

    let newNetWorth = state.netWorth;
    let newExpenses = state.expenses;
    let newIncome = state.income;

    if (transaction.type === "gasto") {
      newNetWorth += transaction.amount;
      newExpenses -= transaction.amount;
    } else {
      newNetWorth -= transaction.amount;
      newIncome -= transaction.amount;
    }

    setState(prev => ({
      ...prev,
      netWorth: Math.max(0, newNetWorth),
      expenses: Math.max(0, newExpenses),
      income: Math.max(0, newIncome),
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  // Add goal contribution
  const handleGoalContribution = (goalId: string, amount: number) => {
    if (isNaN(amount) || amount <= 0) {
      alert("Introduce un monto válido.");
      return;
    }

    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    if (state.savingsTotal < amount) {
      // Suggest transferring to project and subtract from general savings if user has enough, else add anyway
      if (!confirm(`¿Deseas transferir $${amount} desde tu fondo de ahorro general de $${state.savingsTotal} hacia tu meta '${goal.name}'?`)) {
        return;
      }
    }

    setState(prev => {
      const updatedGoals = prev.goals.map(g => {
        if (g.id === goalId) {
          return { ...g, saved: Math.min(g.target, g.saved + amount) };
        }
        return g;
      });

      return {
        ...prev,
        savingsTotal: Math.max(0, prev.savingsTotal - amount),
        goals: updatedGoals
      };
    });

    setContributionAmountToGoal("");
    setSelectedGoalForContribution(null);
    alert(`Se agregaron $${amount} correctamente a '${goal.name}'`);
  };

  // Add brand new financial saving goal
  const handleCreateGoal = (e: FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(newGoal.target);
    if (!newGoal.name || isNaN(targetVal) || targetVal <= 0) {
      alert("Por favor introduce los datos requeridos para la meta.");
      return;
    }

    const goal: Goal = {
      id: "g_" + Date.now(),
      name: newGoal.name,
      saved: 0,
      target: targetVal,
      daysLeft: parseInt(newGoal.daysLeft) || 365,
      status: "tiempo",
      category: newGoal.category
    };

    setState(prev => ({
      ...prev,
      goals: [...prev.goals, goal]
    }));

    setNewGoal({
      name: "",
      target: "",
      category: "general",
      daysLeft: "300"
    });

    alert("¡Nueva meta financiera agregada!");
  };

  const handleDeleteGoal = (id: string) => {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;

    if (confirm(`¿Estás seguro de que deseas eliminar el proyecto '${goal.name}'?`)) {
      setState(prev => ({
        ...prev,
        goals: prev.goals.filter(g => g.id !== id)
      }));
    }
  };

  const handleDeleteSaving = (id: string) => {
    const record = state.savingsHistory.find(s => s.id === id);
    if (!record) return;

    if (confirm(`¿Estás seguro de que deseas eliminar este depósito de ahorro de $${record.amount}?`)) {
      setState(prev => ({
        ...prev,
        savingsTotal: Math.max(0, prev.savingsTotal - record.amount),
        netWorth: Math.max(0, prev.netWorth - record.amount),
        savingsHistory: prev.savingsHistory.filter(s => s.id !== id)
      }));
    }
  };

  // Call server-side Gemini API
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const featuredGoalObj = state.goals[0];
      const activeState = {
        netWorth: state.netWorth,
        income: state.income,
        expenses: state.expenses,
        savingsTotal: state.savingsTotal,
        featuredGoal: featuredGoalObj?.name || "Sin metas activas",
        featuredGoalSaved: featuredGoalObj?.saved || 0,
        featuredGoalTarget: featuredGoalObj?.target || 0
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, activeState })
      });

      if (!res.ok) {
        throw new Error("Respuesta no satisfactoria.");
      }

      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: "ai", text: data.text }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: `${state.profile.name}, lo siento, tuve problemas para conectar con mi módulo de inteligencia artificial. Recuerda que puedes optimizar tus finanzas reduciendo un 10% en tus gastos mensuales de alimentación de $1,280.`
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Shortcut queries for Chatbot
  const handleShortcutQuery = (query: string) => {
    setChatInput(query);
  };

  // Quick state overrides to prove and demonstrate high responsiveness:
  const adjustNetWorth = (mult: number) => {
    setState(prev => ({ ...prev, netWorth: Math.round(prev.netWorth * mult * 100) / 100 }));
  };

  // Soft theme properties
  const isDark = state.theme === "oscuro";

  // Base Class mappings based on clear state properties
  const bgClass = isDark ? "bg-[#050508] text-[#e3e1e9]" : "bg-[#f4f7f9] text-[#1c2a38]";
  const headerClass = isDark 
    ? "bg-[#0A0B10]/90 border-b border-white/10" 
    : "bg-white/95 border-b border-slate-200/80 shadow-xs";
  
  const bottomNavClass = isDark 
    ? "bg-[#0a0b10]/90 border-t border-white/10" 
    : "bg-white/95 border-t border-slate-200/80 shadow-lg shadow-slate-100";

  const cardClass = isDark 
    ? "bg-[#121318]/90 border border-white/5" 
    : "bg-white border border-slate-200/80 shadow-xs";

  const bannerClass = isDark
    ? "bg-gradient-to-r from-teal-950/20 to-cyan-900/10 border-l-4 border-[#00f0ff] text-white"
    : "bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-[#1291a1] text-slate-800";

  // Customize layout accent tags
  let accentColor = "#00f0ff"; // default celeste
  let accentText = "text-cyan-500";
  let accentBg = "bg-cyan-500/10";
  let accentButton = "bg-cyan-500 text-white hover:bg-cyan-600";
  let accentBorder = "border-cyan-500/30";

  if (softColorTone === "verde") {
    accentColor = "#22c55e";
    accentText = "text-emerald-500";
    accentBg = "bg-emerald-500/10";
    accentButton = "bg-emerald-500 text-white hover:bg-emerald-600";
    accentBorder = "border-emerald-500/30";
  } else if (softColorTone === "rosa") {
    accentColor = "#ec4899";
    accentText = "text-pink-500";
    accentBg = "bg-pink-500/10";
    accentButton = "bg-pink-500 text-white hover:bg-pink-600";
    accentBorder = "border-pink-500/30";
  } else if (softColorTone === "crema") {
    accentColor = "#f59e0b";
    accentText = "text-amber-500";
    accentBg = "bg-amber-500/10";
    accentButton = "bg-amber-500 text-white hover:bg-amber-600";
    accentBorder = "border-amber-500/30";
  }

  // Calculate Health score dynamically based on savings/income & delayed status
  const totalTargetGoals = state.goals.reduce((acc, g) => acc + g.target, 0);
  const totalSavedGoals = state.goals.reduce((acc, g) => acc + g.saved, 0);
  const goalsRatio = totalTargetGoals > 0 ? (totalSavedGoals / totalTargetGoals) : 0.5;
  const savingsIncomeRatio = Math.min(1, state.savingsTotal / Math.max(1, state.income * 2));
  const healthScore = Math.min(99, Math.round(50 + (savingsIncomeRatio * 25) + (goalsRatio * 25) - (state.goals.filter(g => g.status === "retrasado").length * 5)));

  // Dynamic budget and automatic expense control logic
  const totalSpent = state.transactions
    .filter(t => t.type === "gasto")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLimit = state.monthlyExpenseLimit || 5000;
  const totalSpentPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const budgetCategories = [
    "Alimentación",
    "Transporte",
    "Entretenimiento",
    "Servicios",
    "Salud",
    "Educación",
    "Otros"
  ];

  const categorySpentMap: Record<string, number> = {};
  budgetCategories.forEach(cat => {
    categorySpentMap[cat] = state.transactions
      .filter(t => t.type === "gasto" && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
  });

  // Unique months unified registry
  const uniqueMonthsMap = Array.from(
    new Set([
      ...state.transactions.map(t => {
        const parsed = getMonthKeyAndLabel(t.date);
        return JSON.stringify({ key: parsed.key, label: parsed.label, sortVal: parsed.sortVal });
      }),
      ...state.savingsHistory.map(s => {
        const parsed = getMonthKeyAndLabel(s.date);
        return JSON.stringify({ key: parsed.key, label: parsed.label, sortVal: parsed.sortVal });
      })
    ])
  )
    .map(str => JSON.parse(str as string) as { key: string; label: string; sortVal: number })
    .sort((a, b) => b.sortVal - a.sortVal);

  const monthlyComparisonData = uniqueMonthsMap.map(m => {
    const rx = state.transactions.filter(t => getMonthKeyAndLabel(t.date).key === m.key);
    const sx = state.savingsHistory.filter(s => getMonthKeyAndLabel(s.date).key === m.key);

    const totalIncome = rx.filter(t => t.type === "ingreso").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = rx.filter(t => t.type === "gasto").reduce((sum, t) => sum + t.amount, 0);
    const totalSavings = sx.reduce((sum, s) => sum + s.amount, 0);

    const categoryBreakdown: Record<string, number> = {};
    budgetCategories.forEach(cat => {
      categoryBreakdown[cat] = rx
        .filter(t => t.type === "gasto" && t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return {
      key: m.key,
      label: m.label,
      totalIncome,
      totalExpenses,
      totalSavings,
      categoryBreakdown
    };
  });

  let highestExpensesMonthKey = "";
  let highestExpensesAmount = 0;
  monthlyComparisonData.forEach(row => {
    if (row.totalExpenses > highestExpensesAmount) {
      highestExpensesAmount = row.totalExpenses;
      highestExpensesMonthKey = row.key;
    }
  });

  let highestSavingsMonthKey = "";
  let highestSavingsAmount = 0;
  monthlyComparisonData.forEach(row => {
    if (row.totalSavings > highestSavingsAmount) {
      highestSavingsAmount = row.totalSavings;
      highestSavingsMonthKey = row.key;
    }
  });

  // Calculate dynamic alerts list live for user feedback
  interface BudgetAlertItem {
    id: string;
    type: "danger" | "warning";
    message: string;
    category?: string;
    percentage: number;
    spent: number;
    limit: number;
  }

  const activeBudgetAlerts: BudgetAlertItem[] = [];

  if (totalSpentPercentage >= 90) {
    activeBudgetAlerts.push({
      id: "global-danger",
      type: "danger",
      message: `¡ALERTA CRÍTICA GLOBAL! Has consumido el ${totalSpentPercentage}% de tu presupuesto límite de gastos general ($${totalSpent.toLocaleString(undefined, {minimumFractionDigits:2})} gastados de un tope de $${totalLimit.toLocaleString(undefined, {minimumFractionDigits:2})}).`,
      percentage: totalSpentPercentage,
      spent: totalSpent,
      limit: totalLimit
    });
  } else if (totalSpentPercentage >= 75) {
    activeBudgetAlerts.push({
      id: "global-warning",
      type: "warning",
      message: `¡Advertencia de Gasto Total! Has cubierto el ${totalSpentPercentage}% de tu presupuesto global mensual ($${totalSpent.toLocaleString(undefined, {minimumFractionDigits:2})} consumidos de $${totalLimit.toLocaleString(undefined, {minimumFractionDigits:2})}). Modera tus salidas de capital.`,
      percentage: totalSpentPercentage,
      spent: totalSpent,
      limit: totalLimit
    });
  }

  budgetCategories.forEach(cat => {
    const spentValue = categorySpentMap[cat] || 0;
    const limitValue = state.categoryLimits[cat] || 500;
    const catPercent = limitValue > 0 ? Math.round((spentValue / limitValue) * 100) : 0;

    if (catPercent >= 90) {
      activeBudgetAlerts.push({
        id: `cat-danger-${cat}`,
        type: "danger",
        message: `¡ALERTA MÁXIMA EN ${cat.toUpperCase()}! Consumo al ${catPercent}% del límite mensual. Gastado: $${spentValue.toLocaleString(undefined, {minimumFractionDigits:2})} de un tope de $${limitValue.toLocaleString(undefined, {minimumFractionDigits:2})}.`,
        category: cat,
        percentage: catPercent,
        spent: spentValue,
        limit: limitValue
      });
    } else if (catPercent >= 75) {
      activeBudgetAlerts.push({
        id: `cat-warning-${cat}`,
        type: "warning",
        message: `Presupuesto en riesgo en ${cat}. Consumo al ${catPercent}% del límite mensual ($${spentValue.toLocaleString(undefined, {minimumFractionDigits:2})} de $${limitValue.toLocaleString(undefined, {minimumFractionDigits:2})}).`,
        category: cat,
        percentage: catPercent,
        spent: spentValue,
        limit: limitValue
      });
    }
  });

  return (
    <div id="finance-app-root" className={`min-h-screen ${bgClass} font-sans flex flex-col transition-colors duration-300`}>
      
      {/* PERSONALIZED WELCOME TOAST ON LOAD */}
      {showWelcomeToast && (
        <div id="welcome-floating-toast" className="fixed top-20 left-1/2 -translate-x-1/2 z-55 w-full max-w-sm px-4 animate-fade-in">
          <div className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 relative overflow-hidden transition-all duration-300 backdrop-blur-md ${
            isDark 
              ? 'bg-[#121318]/90 border-cyan-500/30 text-white shadow-cyan-500/10' 
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/40'
          }`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 flex-shrink-0 animate-pulse">
              <Sparkles size={18} className="text-yellow-400" />
            </div>
            <div className="space-y-1 flex-grow pr-6 pl-1">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest font-display text-slate-400 select-none">
                Acceso Confirmado
              </h4>
              <p className="text-sm font-black font-display tracking-tight text-slate-900 dark:text-cyan-400 select-none">
                ¡Hola, {state.profile.name}! 👋
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300 leading-normal">
                ¡Qué bueno verte por aquí! Tu panel personal de control financiero y ahorro está completamente listo.
              </p>
              <div className="flex gap-2.5 mt-2">
                <button 
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setShowWelcomeToast(false);
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider font-display text-cyan-500 hover:underline cursor-pointer"
                >
                  Cambiar Nombre
                </button>
                <span className="text-slate-500/50 text-[10px] select-none">•</span>
                <button 
                  onClick={() => setShowWelcomeToast(false)}
                  className="text-[10px] font-bold uppercase tracking-wider font-display text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowWelcomeToast(false)}
              className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-500/10 transition-colors text-lg font-bold cursor-pointer"
              title="Cerrar"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className={`fixed top-0 left-0 right-0 z-40 ${headerClass} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          
          <div className="flex items-center gap-2">
            <button 
              id="brand-logo-trigger"
              onClick={() => setCurrentScreen("inicio")} 
              className={`p-1.5 rounded-lg ${isDark ? 'text-cyan-400 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100'} transition-all`}
            >
              <LayoutDashboard size={22} />
            </button>
            <h1 className="text-base md:text-lg font-black tracking-widest uppercase font-display flex items-center gap-1">
              <span className={accentText}>ORDENA TUS FINANZAS</span>
              {isAiLoading && <Sparkles className="animate-pulse inline text-yellow-400" size={16} />}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Tone Indicator / Theme shortcuts shown inside header */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2 px-2 py-1 rounded bg-slate-500/5 border border-slate-500/10 text-xs">
              <span className="font-mono text-slate-400">CARLOS_SYSTEM_01</span>
            </div>

            {/* Config & Theme adjustments trigger button */}
            <button 
              id="settings-trigger-btn"
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg transition-all border flex items-center justify-center gap-1 ${
                isDark 
                  ? 'bg-slate-800 border-white/5 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Ajustes de Interfaz y Colores"
            >
              <Settings size={18} className="animate-spin-slow text-slate-500" />
              <span className="text-xs font-bold hidden md:inline">Ajustes</span>
            </button>

            {/* Profile Avatar Trigger also opens settings for direct UX */}
            <button 
              id="profile-trigger-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full border border-slate-500/20 shadow-sm p-0.5 overflow-hidden active:scale-95 transition-transform"
            >
              <img 
                alt="User Profile" 
                className="w-full h-full rounded-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3SRW2a0Cly_Y5O3LNzVkTF3cvpSIqQALSe6UDizgzBcbBSdmsMQjst7tqUOAArUBau2XqxK1PyQ1jOy10d8hPxvI2zAKYPpC1Q98rofoqf1jGynzM3yLL5mfOrfu8aziuilAe20USCmWOGB-jCMKLY-v_MqxiggbSVr8kBaYPpHQH9He4AVv8EV9YcOaZxrT1uRgfyW4KbfsYWKluKpXVzoz7m9Po-tZiLHxOC_SRx0EPeYlbm5HyAalvFErDoLjlvsHsLq11LT7I"
              />
            </button>
          </div>

        </div>
      </header>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-grow pt-20 pb-28 px-4 max-w-7xl w-full mx-auto">
        
        {/* TAB 1: INICIO (Main Landing Screen & Quick Navigator) */}
        {currentScreen === "inicio" && (
          <div id="screen-inicio" className="space-y-6 fade-in animate-fade-in">
            
            {/* Hero Welcome Unit */}
            <section className={`rounded-2xl p-6 text-center ${cardClass} relative overflow-hidden transition-all duration-300`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/5 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative mb-4 flex justify-center">
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center p-3 relative bg-slate-500/5`}>
                  <img 
                    alt="Logo OTF" 
                    className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(34,211,238,0.2)]" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmhEifuST00FP6CQVqH5u1X1JsYFnw7W3Cp2wN9rPJUEYu9jbynh8IqHDqIx-xLJgHaNhM2HCCybXbuYZk0ZglU8ODEmCrXyH5hNKJ-M790hS1moCScAl1JwCmKqJU-LCaugZQb_7w7pGw0dR9gx8w6uRYGNJrmDXHWeafPPSLXt3fSOUwGBrk7Prrpz10WGNGmELEjzcdCyA5AfpMU0mDCgce7GgRMBT7aim7og7XsmmMHpawT68D8_dl6auoogc-sR9hDX8u9bMt"
                  />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">¡Bienvenido, {state.profile.name}! 👋</h2>
              <p className={`text-xs uppercase font-display tracking-widest mt-1 font-bold ${accentText}`}>
                Optimización activa y control del flujo de caja
              </p>

              {/* Tonal tweaks based on user's theme selection */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 font-mono">
                  SISTEMA LISTO 
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-blue-500/10 text-blue-500 font-mono">
                  TEMA ACTUAL: {isDark ? "OSCURO NEÓN" : "CLARO SUAVE"}
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-purple-500/10 text-purple-500 font-mono">
                  TONO: {softColorTone.toUpperCase()}
                </span>
              </div>
            </section>

            {/* Quick Interactive Summary Banner */}
            <div className={`p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 ${bannerClass}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-700/10">
                  <TrendingUp className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm md:text-base">Patrimonio Neto Total</h4>
                  <p className="text-xs opacity-75">Sincronizado en tiempo real con transacciones y fondos</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl md:text-2xl font-black font-display tracking-tight text-emerald-500">
                  ${state.netWorth.toLocaleString()}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => adjustNetWorth(1.05)} className="px-2 py-1 text-xs bg-emerald-500/25 rounded hover:bg-emerald-500/40 text-emerald-500 font-bold" title="Aumentar Simulación">+5%</button>
                  <button onClick={() => adjustNetWorth(0.95)} className="px-2 py-1 text-xs bg-rose-500/25 rounded hover:bg-rose-500/40 text-rose-500 font-bold" title="Disminuir Simulación">-5%</button>
                </div>
              </div>
            </div>

            {/* BENTO GRID MODULE NAVIGATOR */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Panel de Control Dashboard (Navs to Analisis) */}
              <button 
                id="btn-navigate-analisis"
                onClick={() => setCurrentScreen("analisis")}
                className={`md:col-span-8 group relative overflow-hidden rounded-xl p-5 flex flex-col justify-between items-start text-left hover:border-cyan-400/50 hover:shadow-md transition-all duration-300 ${cardClass}`}
              >
                <div className="flex justify-between w-full">
                  <span className={`p-2.5 rounded-lg ${accentBg} ${accentText} group-hover:scale-110 transition-transform`}>
                    <BarChart3 size={28} />
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-500/70 bg-cyan-500/10 px-2 py-1 rounded">
                    ANALIZAR SALUD ({healthScore} pts)
                  </span>
                </div>
                <div className="mt-8 relative z-10">
                  <h3 className="text-lg md:text-xl font-bold">Panel de Control & Inteligencia</h3>
                  <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-lg">
                    Visualiza la distribución de gastos fijos y variables, estado de salud crediticio y hábitos mensuales con IA.
                  </p>
                </div>
                <div className="absolute right-2 bottom-2 opacity-5 pointer-events-none translate-x-1/4 translate-y-1/4">
                  <TrendingUp className="text-[120px]" size={140} />
                </div>
              </button>

              {/* Quick Add Transaction Block (Navs to Movimientos and sets Type to gasto) */}
              <button 
                id="btn-navigate-movimientos"
                onClick={() => {
                  setCurrentScreen("movimientos");
                  setNewTransaction(prev => ({ ...prev, type: "gasto" }));
                }}
                className={`md:col-span-4 group rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-all duration-300 ${cardClass}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${accentBg} ${accentText} group-hover:bg-cyan-500 group-hover:text-white transition-all`}>
                  <Plus size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Registrar Movimiento</h3>
                  <p className="text-xs text-slate-500 uppercase font-display tracking-widest mt-0.5">Entrada / Salida</p>
                </div>
              </button>

              {/* Analysis shortcut */}
              <button 
                onClick={() => setCurrentScreen("analisis")}
                className={`md:col-span-4 group p-5 rounded-xl text-left hover:border-emerald-500/40 transition-all ${cardClass}`}
              >
                <Lightbulb className="text-emerald-500 mb-3" size={24} />
                <h4 className="font-bold text-sm md:text-base text-emerald-500">Análisis y Tips IA</h4>
                <p className="text-slate-500 text-xs mt-1">
                  Inteligencia artificial aplicada a tus hábitos de consumo y presupuesto.
                </p>
              </button>

              {/* Savings Shortcut */}
              <button 
                onClick={() => setCurrentScreen("ahorros")}
                className={`md:col-span-4 group p-5 rounded-xl text-left hover:border-cyan-500/40 transition-all ${cardClass}`}
              >
                <PiggyBank className="text-cyan-500 mb-3" size={24} />
                <h4 className="font-bold text-sm md:text-base text-cyan-500">Ahorro Quincenal</h4>
                <p className="text-slate-500 text-xs mt-1">
                  Configuración automática y registro de reservas para tu fondo disponible.
                </p>
              </button>

              {/* Metas Shortcut */}
              <button 
                onClick={() => setCurrentScreen("metas")}
                className={`md:col-span-4 group p-5 rounded-xl text-left hover:border-pink-500/40 transition-all ${cardClass}`}
              >
                <Rocket className="text-pink-500 mb-3" size={24} />
                <h4 className="font-bold text-sm md:text-base text-pink-500">Metas de Proyectos</h4>
                <p className="text-slate-500 text-xs mt-1">
                  Hitos y proyecciones de crecimiento para tus objetivos a largo plazo.
                </p>
              </button>

            </section>

            {/* FLOATING DIRECT DEPOSIT ASSISTANT & CHATBOT MANDO */}
            <section className={`rounded-xl p-5 ${cardClass} relative overflow-hidden shadow-sm`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
                  <Sparkles size={20} className="text-yellow-400" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-500">ASISTENTE DE INTELIGENCIA FINANCIERA</span>
                  <h4 className="font-bold text-base">¿En qué puedo optimizar tu capital financiero hoy?</h4>
                </div>
              </div>

              {/* Message loop */}
              <div className={`p-4 rounded-xl max-h-48 overflow-y-auto space-y-3 mb-4 scrollbar-thin ${isDark ? 'bg-black/30' : 'bg-slate-100/60'}`}>
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xl p-3 rounded-xl text-xs md:text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-cyan-600 text-white rounded-tr-none"
                        : isDark ? "bg-[#1e1f25] text-slate-100 rounded-tl-none border border-white/5" : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                    }`}>
                      <p className="font-bold text-[10px] opacity-60 mb-1">
                        {msg.sender === "user" ? state.profile.name.toUpperCase() : "SISTEMA OTF"}
                      </p>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${isDark ? 'bg-[#1e1f25]' : 'bg-white'}`}>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-75" />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-150" />
                      <span className="text-slate-400">Analizando tu presupuesto...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat form */}
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Escribe tu consulta financiera (ej: ¿Cómo optimizar mis ahorros?)..."
                  className={`flex-grow px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${
                    isDark 
                      ? 'bg-black/20 border-white/10 text-white focus:border-cyan-400' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                  }`}
                />
                <button 
                  onClick={handleSendMessage}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center transition-all ${accentButton}`}
                >
                  <Send size={16} />
                </button>
              </div>

              {/* Fast presets buttons */}
              <div className="mt-3 flex flex-wrap gap-1.5 justify-start">
                <button 
                  onClick={() => handleShortcutQuery("¿Cómo puedo optimizar mi ahorro quincenal para el viaje a Japón?")}
                  className="text-[10px] uppercase font-display bg-slate-500/5 hover:bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/10 transition-all font-bold text-slate-500"
                >
                  ¿OPTIMIZAR JAPÓN?
                </button>
                <button 
                  onClick={() => handleShortcutQuery("¿Cuál es el diagnóstico de mis gastos mensuales de $4120?")}
                  className="text-[10px] uppercase font-display bg-slate-500/5 hover:bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/10 transition-all font-bold text-slate-500"
                >
                  DIAGNÓSTICO GASTOS
                </button>
                <button 
                  onClick={() => handleShortcutQuery("Dame un tip de ahorro basado en mi saldo de ahorro actual")}
                  className="text-[10px] uppercase font-display bg-slate-500/5 hover:bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/10 transition-all font-bold text-slate-500"
                >
                  ESTRATEGIA AHORRO
                </button>
              </div>
            </section>

          </div>
        )}

        {/* TAB 2: MOVIMIENTOS (Interactive transaction listings) */}
        {currentScreen === "movimientos" && (
          <div id="screen-movimientos" className="space-y-6 animate-fade-in">
            
            <header className="mb-4">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Presupuesto y Movimientos</h2>
              <p className="text-slate-500 text-xs md:text-sm">Configura tus límites de gastos mensuales por categoría y controla tus alertas en tiempo real.</p>
            </header>

            {/* ALERTS CONTROL MODULE */}
            <div id="alerts-control-section" className="space-y-3">
              {activeBudgetAlerts.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 font-display">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                    <span>Alertas de Gastos Críticas y Advertencias ({activeBudgetAlerts.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeBudgetAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        className={`flex gap-3 items-start p-4 rounded-xl border transition-all ${
                          alert.type === "danger"
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200 shadow-md shadow-rose-500/5'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${alert.type === "danger" ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-400"}`}>
                          <AlertTriangle size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold leading-tight uppercase font-display select-none">
                            {alert.type === "danger" ? "Límite Crítico Excedido" : "Presupuesto Comprometido"}
                          </p>
                          <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                          {alert.category && (
                            <span className="inline-block text-[9px] font-mono font-bold bg-slate-500/10 px-2 py-0.5 rounded select-none mt-1">
                              CATEGORÍA: {alert.category.toUpperCase()} ({alert.percentage}%)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider">¡Presupuesto Saludable!</h4>
                    <p className="text-xs opacity-90 mt-0.5">{state.profile.name}, todas tus categorías de gasto están en la zona verde (menos del 75%). ¡Excelente autocontrol!</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Add form & budget center */}
              <div className="md:col-span-5 space-y-6">
                
                {/* TRANSACTION REGISTRATION form */}
                <form onSubmit={handleAddTransaction} className={`rounded-xl p-5 space-y-4 shadow-xs ${cardClass}`}>
                  <h3 className="text-sm font-bold border-b pb-2 uppercase tracking-wider font-display text-slate-400">
                    Nuevo Movimiento
                  </h3>

                  {/* Type switch */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2 font-display">Tipo de transacción</label>
                    <div className="flex bg-slate-500/10 p-1 rounded-lg gap-1">
                      <button
                        type="button"
                        onClick={() => setNewTransaction(prev => ({ ...prev, type: "gasto" }))}
                        className={`flex-1 py-2 rounded-md justify-center items-center gap-1.5 flex transition-all text-xs font-bold ${
                          newTransaction.type === "gasto"
                            ? "bg-rose-500 text-white shadow-xs"
                            : "text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        <TrendingDown size={14} /> Gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTransaction(prev => ({ ...prev, type: "ingreso" }))}
                        className={`flex-1 py-2 rounded-md justify-center items-center gap-1.5 flex transition-all text-xs font-bold ${
                          newTransaction.type === "ingreso"
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        <TrendingUp size={14} /> Ingreso
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-display">Monto ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                        className={`w-full pl-8 pr-3 py-2.5 rounded-lg text-sm font-mono border focus:outline-none ${
                          isDark 
                            ? 'bg-black/20 border-white/10 text-white focus:border-cyan-400' 
                            : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Description name */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-display">Descripción</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Súper, Gasolina, Netfix..."
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-cyan-400' 
                          : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                      }`}
                    />
                  </div>

                  {/* Date of Transaction */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-display">Fecha de Transacción</label>
                    <input 
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-cyan-400' 
                          : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                      }`}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-display">Categoría</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${
                        isDark 
                          ? 'bg-neutral-800 border-white/10 text-white focus:border-cyan-400' 
                          : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                      }`}
                    >
                      <option value="Alimentación">Alimentación</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Entretenimiento">Entretenimiento</option>
                      <option value="Servicios">Servicios</option>
                      <option value="Salud">Salud</option>
                      <option value="Educación">Educación</option>
                      <option value="Otros">Otros</option>
                      <option value="Salario">Salario (Ingreso)</option>
                      <option value="Inversiones">Inversiones</option>
                    </select>
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit"
                    className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-display flex items-center justify-center gap-1.5 transition-all ${accentButton}`}
                  >
                    <Plus size={16} /> Guardar Movimiento
                  </button>
                </form>

                {/* CONFIGURACIÓN DE PRESUPUESTO GENERAL */}
                <div className={`p-5 rounded-xl space-y-4 shadow-xs ${cardClass}`}>
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Sliders className={accentText} size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider font-display text-slate-400">
                      Control de Presupuesto
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* INGRESO MENSUAL */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-slate-400 uppercase tracking-wider">Ingreso Mensual ($)</label>
                        <span className="text-emerald-500 font-mono font-bold">${state.income.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="range"
                          min="1000"
                          max="20000"
                          step="100"
                          value={state.income}
                          onChange={(e) => handleUpdateIncomeValue(parseFloat(e.target.value))}
                          className="flex-grow accent-emerald-500 cursor-ew-resize bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none h-1.5"
                        />
                        <input 
                          type="number"
                          value={state.income}
                          onChange={(e) => handleUpdateIncomeValue(parseFloat(e.target.value) || 0)}
                          className={`w-20 px-2 py-1 rounded text-xs text-right font-mono border focus:outline-none ${
                            isDark ? 'bg-black/25 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    {/* TOPE MÁXIMO DE GASTOS */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-slate-400 uppercase tracking-wider">Tope Máximo de Gastos ($)</label>
                        <span className="text-rose-500 font-mono font-bold">${state.monthlyExpenseLimit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="range"
                          min="500"
                          max="15000"
                          step="100"
                          value={state.monthlyExpenseLimit}
                          onChange={(e) => handleUpdateMonthlyLimit(parseFloat(e.target.value))}
                          className="flex-grow accent-rose-500 cursor-ew-resize bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none h-1.5"
                        />
                        <input 
                          type="number"
                          value={state.monthlyExpenseLimit}
                          onChange={(e) => handleUpdateMonthlyLimit(parseFloat(e.target.value) || 0)}
                          className={`w-20 px-2 py-1 rounded text-xs text-right font-mono border focus:outline-none ${
                            isDark ? 'bg-black/25 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Categories limits control & historical items list */}
              <div className="md:col-span-7 space-y-6">
                
                {/* LÍMITES POR CATEGORÍA EN TIEMPO REAL */}
                <div className={`p-5 rounded-xl space-y-4 ${cardClass}`}>
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      <PieChart className={accentText} size={18} />
                      <h3 className="text-sm font-bold uppercase tracking-wider font-display text-slate-400">
                        Límites por Categoría
                      </h3>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono bg-slate-500/10 px-2 py-0.5 rounded uppercase font-display">
                      Control Automático
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {budgetCategories.map(cat => {
                      const spent = categorySpentMap[cat] || 0;
                      const limit = state.categoryLimits[cat] || 500;
                      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                      
                      // Status colors
                      let barColor = "bg-emerald-500";
                      let textColor = "text-emerald-500";
                      let lightBgClass = "bg-emerald-500/10";
                      if (percentage >= 90) {
                        barColor = "bg-rose-500 animate-pulse";
                        textColor = "text-rose-500";
                        lightBgClass = "bg-rose-500/10";
                      } else if (percentage >= 75) {
                        barColor = "bg-amber-500";
                        textColor = "text-amber-500";
                        lightBgClass = "bg-amber-500/10";
                      }

                      return (
                        <div key={cat} className={`p-3 rounded-lg border flex flex-col justify-between ${
                          isDark ? 'bg-white/2 border-white/5' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{cat}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${textColor} ${lightBgClass}`}>
                                {percentage}%
                              </span>
                            </div>

                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Consumido: ${spent.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                              <span>Tope: ${limit.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                            </div>

                            {/* Progress Indicator line */}
                            <div className="w-full h-1.5 bg-slate-500/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                          </div>

                          {/* Dynamic slider adjustment and input counter */}
                          <div className="mt-3 flex items-center gap-2">
                            <Sliders size={12} className="text-slate-450 flex-shrink-0" />
                            <input 
                              type="range"
                              min="100"
                              max="3000"
                              step="50"
                              value={limit}
                              onChange={(e) => handleUpdateCategoryLimit(cat, parseFloat(e.target.value))}
                              className="flex-grow cursor-ew-resize h-1 bg-slate-500/15 accent-slate-400 rounded-lg appearance-none"
                              title={`Límite de ${cat}`}
                            />
                            <input
                              type="number"
                              value={limit}
                              onChange={(e) => handleUpdateCategoryLimit(cat, parseFloat(e.target.value) || 0)}
                              className={`w-14 text-center font-mono text-[10px] py-0.5 border rounded focus:outline-none ${
                                isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transactions list container */}
                <div className={`p-5 rounded-xl space-y-4 ${cardClass}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                    <h3 className="font-extrabold text-base">Historial de Transacciones</h3>
                    
                    {/* Inline Filter chips & Month Dropdown Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {["todas", "gasto", "ingreso"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border transition-all ${
                              filterCategory === cat
                                ? `${accentBg} ${accentText} ${accentBorder}`
                                : isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Month Selector */}
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                          isDark 
                            ? 'bg-[#181920] border-white/10 text-white focus:border-cyan-400' 
                            : 'bg-white border-slate-200 text-slate-700 focus:border-cyan-500'
                        }`}
                      >
                        <option value="todos">📅 TODOS LOS MESES</option>
                        {Array.from(
                          new Set(
                            state.transactions.map((t) => {
                              const parsed = getMonthKeyAndLabel(t.date);
                              return JSON.stringify({ key: parsed.key, label: parsed.label.toUpperCase(), sortVal: parsed.sortVal });
                            })
                          )
                        )
                          .map((str) => JSON.parse(str as string) as { key: string; label: string; sortVal: number })
                          .sort((a, b) => b.sortVal - a.sortVal)
                          .map((m) => (
                            <option key={m.key} value={m.key}>
                              {m.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* List container */}
                  <div className="space-y-2">
                    {state.transactions
                      .filter(t => filterCategory === "todas" || t.type === filterCategory)
                      .filter(t => filterMonth === "todos" || getMonthKeyAndLabel(t.date).key === filterMonth)
                      .map((t) => (
                        <div 
                          key={t.id}
                          className={`flex justify-between items-center p-3 rounded-lg border transition-all ${
                            isDark 
                              ? 'bg-white/2 hover:bg-white/5 border-white/5 hover:border-white/10' 
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border text-xs font-bold ${
                              t.type === "gasto"
                                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            }`}>
                              {t.type === "gasto" ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                            </div>

                            <div>
                              <h4 className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200">{t.description}</h4>
                              <p className="text-[10px] uppercase font-display text-slate-400 mt-0.5">
                                {formatDateToShow(t.date)} • {t.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`font-mono text-xs md:text-sm font-bold ${
                              t.type === "gasto" ? "text-rose-500" : "text-emerald-500"
                            }`}>
                              {t.type === "gasto" ? "-" : "+"}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>

                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="text-slate-400 hover:text-rose-500 text-xs p-1 rounded transition-colors"
                              title="Eliminar registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}

                    {state.transactions.filter(t => filterCategory === "todas" || t.type === filterCategory).filter(t => filterMonth === "todos" || getMonthKeyAndLabel(t.date).key === filterMonth).length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-xs text-slate-400">
                        No hay transacciones registradas que coincidan con la categoría o mes seleccionado.
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: ANÁLISIS (Financial diagnostics, donuts chart and suggestions) */}
        {currentScreen === "analisis" && (
          <div id="screen-analisis" className="space-y-6 animate-fade-in">
            
            <header className="mb-4">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Análisis y Diagnóstico</h2>
              <p className="text-slate-500 text-xs md:text-sm">Tu salud financiera analizada por Inteligencia Artificial.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Health Score circle widget */}
              <div className={`md:col-span-5 rounded-xl p-5 flex flex-col items-center justify-center text-center ${cardClass}`}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-display">
                  Puntuación de Salud
                </span>

                <div className="relative w-44 h-44 flex items-center justify-center">
                  
                  {/* Neon Circular progress ring */}
                  <svg className="w-full h-full -rotate-90">
                    <circle 
                      className={isDark ? "text-slate-800" : "text-slate-200"}
                      cx="88" 
                      cy="88" 
                      fill="transparent" 
                      r="70" 
                      stroke="currentColor" 
                      strokeWidth="10" 
                    />
                    <circle 
                      cx="88" 
                      cy="88" 
                      fill="transparent" 
                      r="70" 
                      stroke={accentColor} 
                      strokeDasharray="439.8" 
                      strokeDashoffset={439.8 - (439.8 * (healthScore / 100))} 
                      strokeLinecap="round" 
                      strokeWidth="10" 
                      className="transition-all duration-1000"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-extrabold leading-none">{healthScore}</span>
                    <span className={`text-[10px] uppercase font-bold font-display tracking-widest mt-1.5 ${accentText}`}>
                      {healthScore > 80 ? "EXCELENTE" : healthScore > 60 ? "SALUDABLE" : "COMPROMETIDA"}
                    </span>
                  </div>

                </div>

                <p className="mt-4 text-xs text-slate-500 max-w-xs leading-relaxed">
                  Has ahorrado un 15% más que el mes anterior. Sigue así para optimizar un 42% tu fondo de emergencia.
                </p>
              </div>

              {/* Conic donut chart simulation for expense categories */}
              <div className={`md:col-span-7 rounded-xl p-5 ${cardClass} flex flex-col justify-between`}>
                <div>
                  <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 font-display">
                    Distribución de Gastos
                  </h3>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    
                    {/* Ring simulation */}
                    <div className="relative w-36 h-36 flex-shrink-0">
                      <div 
                        className="w-full h-full rounded-full transition-all" 
                        style={{
                          background: `conic-gradient(${accentColor} 0% 40%, #10b981 40% 70%, #f43f5e 70% 90%, #f59e0b 90% 100%)`
                        }}
                      >
                        <div className={`absolute inset-4 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-[#121318]' : 'bg-white'
                        }`}>
                          <span className="text-base font-bold font-mono">
                            ${state.expenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown indices values */}
                    <div className="flex-grow w-full space-y-2 text-xs">
                      
                      <div className="flex justify-between items-center border-b pb-1.5 border-slate-500/10">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                          <span className="text-slate-600 dark:text-slate-300 font-bold">Vivienda y Alquiler</span>
                        </div>
                        <span className="font-mono text-slate-400 font-bold">40%</span>
                      </div>

                      <div className="flex justify-between items-center border-b pb-1.5 border-slate-500/10">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          <span className="text-slate-600 dark:text-slate-300 font-bold">Alimentación</span>
                        </div>
                        <span className="font-mono text-slate-400 font-bold">30%</span>
                      </div>

                      <div className="flex justify-between items-center border-b pb-1.5 border-slate-500/10">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                          <span className="text-slate-600 dark:text-slate-300 font-bold">Ocio / Suscripciones</span>
                        </div>
                        <span className="font-mono text-slate-400 font-bold">20%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                          <span className="text-slate-600 dark:text-slate-300 font-bold">Otros</span>
                        </div>
                        <span className="font-mono text-slate-400 font-bold">10%</span>
                      </div>

                    </div>

                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2.5 ${isDark ? 'bg-black/20' : 'bg-slate-50'}`}>
                  <Info className="text-cyan-500" size={16} />
                  <p className="text-slate-500">
                    Cambia a tono color <strong>Rosa</strong>, <strong>Verde</strong> o <strong>Crema</strong> en el menú de Ajustes situado en la barra superior.
                  </p>
                </div>
              </div>

              {/* Automated Pro-Tip Section */}
              <div className={`md:col-span-12 rounded-xl p-5 border flex flex-col sm:flex-row items-center gap-4 ${
                isDark 
                  ? 'border-yellow-500/10 bg-yellow-500/5' 
                  : 'border-yellow-500/20 bg-yellow-500/5'
              }`}>
                <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                  <Lightbulb size={24} />
                </div>
                <div className="flex-grow space-y-1 text-center sm:text-left">
                  <h4 className="font-extrabold text-sm text-yellow-600 dark:text-yellow-400">Pro Tip de Optimización de Capital</h4>
                  <p className="text-xs text-slate-500">
                    Detectamos una variación en alimentación. {state.profile.name}, reduciendo un <strong>12%</strong> tus salidas recurrentes al restaurante "La Mesa" ahorrarías un aproximado de <strong className="text-emerald-500 font-mono">$45.00</strong> adicionales al mes.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const curLimit = state.categoryLimits["Alimentación"] || 1200;
                    const newLimit = Math.round(curLimit * 0.88 * 100) / 100;
                    const optSavings: SavingsRecord = {
                      id: "s_opt_" + Date.now(),
                      concept: "Optimización Restaurante 'La Mesa'",
                      date: new Date().toISOString().split("T")[0],
                      amount: 45.00,
                      type: "extraordinario"
                    };
                    setState(prev => ({
                      ...prev,
                      categoryLimits: {
                        ...prev.categoryLimits,
                        "Alimentación": newLimit
                      },
                      savingsTotal: prev.savingsTotal + 45,
                      netWorth: prev.netWorth + 45,
                      savingsHistory: [optSavings, ...prev.savingsHistory]
                    }));
                    alert(`🎉 ¡Optimización Confirmada! Se ha reducido tu límite mensual de 'Alimentación' a $${newLimit.toFixed(2)} (-12%) y se ha aportado un ahorro de $45.00.`);
                  }}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider font-display transition-all"
                >
                  Confirmar Optimización
                </button>
              </div>

              {/* CUADRO COMPARATIVO MENSUAL */}
              <div id="monthly-comparison-card" className={`md:col-span-12 rounded-xl p-5 border space-y-4 shadow-xs ${cardClass}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
                  <div>
                    <h3 className="font-extrabold text-base flex items-center gap-2">
                       <BarChart3 className={accentText} size={20} /> Balance y Comparativa Mensual de Gastos y Ahorro
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Desglose de ingresos, depósitos y egresos clasificados por categorías de todos los meses de tu cuenta.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 select-none">
                      🚨 Mayor Gasto
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 select-none">
                      💎 Mayor Ahorro
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-500/10 backdrop-blur-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`${isDark ? 'bg-black/40' : 'bg-slate-50'} font-bold border-b border-slate-500/10`}>
                        <th className="p-3 font-display uppercase tracking-wider text-slate-400 font-extrabold select-none">Mes</th>
                        <th className="p-3 font-display uppercase tracking-wider text-slate-400 font-extrabold text-right select-none text-emerald-500">Ingresos</th>
                        <th className="p-3 font-display uppercase tracking-wider text-slate-400 font-extrabold text-right select-none text-cyan-400">Ahorros</th>
                        {budgetCategories.map(cat => (
                          <th key={cat} className="p-3 font-display uppercase tracking-wider text-slate-400 font-extrabold text-right select-none opacity-80 whitespace-nowrap">
                            {cat}
                          </th>
                        ))}
                        <th className="p-3 font-display uppercase tracking-wider text-slate-400 font-extrabold text-right select-none text-rose-500 whitespace-nowrap">Total Gastos</th>
                        <th className="p-3 font-display uppercase tracking-wider text-slate-400 font-extrabold text-center select-none whitespace-nowrap">Actividad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/10">
                      {monthlyComparisonData.map((row) => {
                        const isHighestExpense = row.key === highestExpensesMonthKey;
                        const isHighestSavings = row.key === highestSavingsMonthKey;

                        return (
                          <tr 
                            key={row.key} 
                            className={`transition-all hover:bg-slate-500/5 ${
                              isHighestExpense 
                                ? 'bg-rose-500/5 border-l-4 border-l-rose-500' 
                                : isHighestSavings 
                                ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500' 
                                : ''
                            }`}
                          >
                            <td className="p-3 font-extrabold uppercase text-slate-800 dark:text-slate-100 whitespace-nowrap font-display">
                              {row.label}
                            </td>
                            <td className="p-3 font-mono font-bold text-right text-emerald-500 whitespace-nowrap">
                              ${row.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 font-mono font-bold text-right text-cyan-400 whitespace-nowrap">
                              ${row.totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            {budgetCategories.map(cat => {
                              const amt = row.categoryBreakdown[cat] || 0;
                              return (
                                <td key={cat} className="p-3 font-mono text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {amt > 0 ? `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (
                                    <span className="opacity-25">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-3 font-mono font-bold text-right text-rose-500 whitespace-nowrap">
                              ${row.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex gap-1 justify-center">
                                {isHighestExpense && (
                                  <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-md animate-pulse">
                                    🔥 Máx Gasto
                                  </span>
                                )}
                                {isHighestSavings && (
                                  <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md animate-pulse">
                                    ⭐ Máx Ahorro
                                  </span>
                                )}
                                {!isHighestExpense && !isHighestSavings && (
                                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-500/10 text-slate-400 dark:text-slate-500 rounded-md">
                                    Estable
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {monthlyComparisonData.length === 0 && (
                        <tr>
                          <td colSpan={budgetCategories.length + 5} className="p-8 text-center text-slate-400 text-xs">
                            No hay histórico de meses disponible para realizar la comparativa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial diagnosis listings card */}
              <div className={`md:col-span-12 rounded-xl ${cardClass} overflow-hidden`}>
                <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-500/5">
                  <h3 className="font-extrabold text-xs uppercase font-display tracking-wider text-slate-400">Diagnóstico de Gastos Críticos</h3>
                  <span className={`text-xs font-bold uppercase ${accentText}`}>Filtrar Críticos</span>
                </div>

                <div className="divide-y divide-slate-500/10">
                  
                  <div className="p-4 flex justify-between items-center hover:bg-slate-500/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-500/10 flex items-center justify-center text-slate-400">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-bold">Amazon Marketplace</h4>
                        <p className="text-[10px] text-slate-400">GASTO EVENTUAL • 12 MAY</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs md:text-sm font-bold text-rose-500">-$124.50</span>
                      <p className="text-[9px] text-rose-500 uppercase font-bold tracking-widest">Gasto Hormiga</p>
                    </div>
                  </div>

                  <div className="p-4 flex justify-between items-center hover:bg-slate-500/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#3d6200]/10 flex items-center justify-center text-[#95e400]">
                        <Heart size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-bold">Alquiler Fijo</h4>
                        <p className="text-[10px] text-slate-400">FIJO OBLIGATORIO • 01 MAY</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs md:text-sm font-bold text-slate-400">-$1,200.00</span>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Esperado / Planificado</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 4: AHORROS (Deposits trackers & Savings actions) */}
        {currentScreen === "ahorros" && (
          <div id="screen-ahorros" className="space-y-6 animate-fade-in">
            
            <header className="mb-4">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Ahorro Quincenal y Reservas</h2>
              <p className="text-slate-500 text-xs md:text-sm">Configuración automática para reserva de capital operativo.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Saving momentum status indicator */}
              <div className={`md:col-span-8 rounded-xl p-5 ${cardClass}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Saldo Reservado en Caja</span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-cyan-500 font-mono mt-1">
                      ${state.savingsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1">
                    <TrendingUp size={12} /> +12.5% INCREMENTO
                  </div>
                </div>

                {/* Simulated Chart visual using css paths */}
                <div className="h-44 w-full relative mt-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                      d="M 0,90 A 20 20 0 0 1 20,70 L 40,75 L 60,45 L 80,50 L 100,10 L 100,100 L 0,100 Z"
                      fill="rgba(34, 211, 238, 0.08)"
                    />
                    <path
                      d="M 0,90 A 20 20 0 0 1 20,70 L 40,75 L 60,45 L 80,50 L 100,10"
                      fill="none"
                      stroke={accentColor}
                      strokeWidth="2.5"
                    />
                  </svg>
                  
                  <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[10px] font-mono text-slate-400/80 uppercase">
                    <span>Ene</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Abr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>
              </div>

              {/* Automatic save configuration slider */}
              <div className={`md:col-span-4 rounded-xl p-5 text-white flex flex-col justify-between overflow-hidden relative ${
                isDark ? 'bg-gradient-to-br from-teal-950 to-neutral-950' : 'bg-gradient-to-br from-cyan-600 to-indigo-950'
              }`}>
                <div className="relative z-10 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex justify-center items-center">
                    <Database size={20} className="text-cyan-300" />
                  </div>

                  <h3 className="text-base font-extrabold text-cyan-300">Ahorro Automático Activo</h3>
                  <p className="text-xs text-slate-200/80 leading-relaxed">
                    Configura deducciones automáticas cada quincena y optimiza tu capital acumulado un 42% más rápido que guardando efectivo manualmente.
                  </p>
                </div>

                {/* Config interactive switches */}
                <div className="mt-6 space-y-4 relative z-10">
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-xs">Estado del Piloto</span>
                    <button
                      onClick={() => setState(prev => ({ ...prev, automaticSavings: !prev.automaticSavings }))}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                        state.automaticSavings ? 'bg-[#95e400]' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 transform ${
                        state.automaticSavings ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setState(prev => ({ ...prev, automaticSavings: true, savingsTotal: prev.savingsTotal + 100 }));
                      alert("¡Se ejecutó una retención inmediata de de ahorro de $100!");
                    }}
                    className="w-full py-2 bg-white text-slate-950 hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider font-display transition-colors"
                  >
                    Establecer Guardado Express
                  </button>
                </div>
              </div>

              {/* Dynamic form to insert custom saving deposits manually */}
              <div className="md:col-span-5">
                <form onSubmit={handleAddSavings} className={`rounded-xl p-5 space-y-4 ${cardClass}`}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-display text-slate-400 border-b pb-2">
                    Nueva Aportación
                  </h3>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-display">Monto ($)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="0.00"
                      value={savingContribution.amount}
                      onChange={(e) => setSavingContribution(prev => ({ ...prev, amount: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm font-mono border focus:outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-cyan-400' 
                          : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-display">Concepto</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Bono o Excedente de gastos"
                      value={savingContribution.concept}
                      onChange={(e) => setSavingContribution(prev => ({ ...prev, concept: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-cyan-400' 
                          : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 font-display">Fecha de Depósito</label>
                    <input 
                      type="date"
                      value={savingContribution.date}
                      onChange={(e) => setSavingContribution(prev => ({ ...prev, date: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none ${
                        isDark 
                          ? 'bg-black/20 border-white/10 text-white focus:border-cyan-400' 
                          : 'bg-white border-slate-200 text-slate-200 focus:border-cyan-500'
                      }`}
                    />
                  </div>

                  <button 
                    type="submit"
                    className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider font-display transition-colors ${accentButton}`}
                  >
                    Confirmar Depósito ADICIONAL
                  </button>
                </form>
              </div>

              {/* History list for savings */}
              <div className="md:col-span-7">
                <div className={`rounded-xl p-5 space-y-4 h-full ${cardClass}`}>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-display text-slate-400 border-b pb-2">
                    Historial de Ahorros
                  </h3>

                  <div className="space-y-2">
                    {state.savingsHistory.map((s) => (
                      <div 
                        key={s.id}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          isDark ? 'bg-white/2 border-white/5' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Database size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs md:text-sm font-bold">{s.concept}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">{s.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono text-xs md:text-sm text-emerald-500 font-bold">
                              +${s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="block text-[9px] uppercase tracking-widest text-[#95e400] font-bold">REALIZADO</span>
                          </div>

                          <button 
                            onClick={() => handleDeleteSaving(s.id)}
                            className="text-slate-400 hover:text-rose-500 text-xs p-1.5 rounded hover:bg-slate-500/5 transition-all outline-none"
                            title="Eliminar depósito"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: METAS (Add savings objectives & contribution targets) */}
        {currentScreen === "metas" && (
          <div id="screen-metas" className="space-y-6 animate-fade-in">
            
            <header className="mb-4">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Metas de Proyectos Financieros</h2>
              <p className="text-slate-500 text-xs md:text-sm">Visualiza y gestiona tu futuro financiero cumpliendo hitos.</p>
            </header>

            {/* Quick overview metric units for objectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Main featured saving goal: Viaje a Japon o primera meta */}
              {(() => {
                const featuredGoal = state.goals.find(g => g.id === "g1") || state.goals[0];
                if (!featuredGoal) {
                  return (
                    <div className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center ${cardClass} border-dashed border-2 border-slate-500/20`}>
                      <Rocket className="text-slate-400 animate-pulse mb-3" size={32} />
                      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">No hay proyectos activos</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Puedes crear un nuevo proyecto a la derecha para dar seguimiento a tus metas de ahorro.</p>
                    </div>
                  );
                }

                const percentage = Math.round((featuredGoal.saved / featuredGoal.target) * 100);
                const circ = 251.2;
                const offset = circ - (circ * Math.min(100, percentage)) / 100;

                return (
                  <div className={`rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between ${cardClass} border-l-4 border-l-[#bcff5f]`}>
                    <div className="absolute top-0 right-0 w-44 h-44 bg-[#bcff5f]/5 blur-3xl pointer-events-none rounded-full" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center w-full">
                      
                      {/* Circle progress progress bar */}
                      <div className="relative w-40 h-40 flex-shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle 
                            className={isDark ? "text-slate-800" : "text-slate-100"} 
                            cx="50" 
                            cy="50" 
                            fill="transparent" 
                            r="40" 
                            stroke="currentColor" 
                            strokeWidth="8" 
                          />
                          <circle 
                            cx="50" 
                            cy="50" 
                            fill="transparent" 
                            r="40" 
                            stroke={accentColor} 
                            strokeDasharray="251.2" 
                            strokeDashoffset={offset} 
                            strokeLinecap="round" 
                            strokeWidth="8" 
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-3xl font-extrabold text-[#bcff5f]">{percentage}%</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">LOGRADO</span>
                        </div>
                      </div>

                      {/* Context and instant manual deposit option */}
                      <div className="space-y-4 flex-grow w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              META PRINCIPAL
                            </span>
                            <h3 className="text-lg md:text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{featuredGoal.name}</h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">Faltan {featuredGoal.daysLeft} días</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleDeleteGoal(featuredGoal.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-500/10 transition-colors"
                            title="Eliminar Meta Principal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-slate-500/5 text-xs">
                            <p className="text-[9px] text-slate-400 uppercase">Ahorrado</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">${featuredGoal.saved.toLocaleString()}</p>
                          </div>
                          <div className="p-2 rounded bg-slate-500/5 text-xs">
                            <p className="text-[9px] text-slate-400 uppercase">Objetivo</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">${featuredGoal.target.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Integrated dynamic prompt for immediate payment simulation */}
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="Monto"
                            value={selectedGoalForContribution === featuredGoal.id ? contributionAmountToGoal : ""}
                            onChange={(e) => {
                              setSelectedGoalForContribution(featuredGoal.id);
                              setContributionAmountToGoal(e.target.value);
                            }}
                            className={`w-28 px-2 py-1.5 rounded text-xs border focus:outline-none ${
                              isDark 
                                ? 'bg-black/20 border-white/10 text-white' 
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const amt = parseFloat(contributionAmountToGoal);
                              handleGoalContribution(featuredGoal.id, amt);
                            }}
                            className="px-3 py-1.5 bg-emerald-500 text-slate-900 rounded text-xs font-bold hover:bg-emerald-600 transition-colors uppercase tracking-widest font-display whitespace-nowrap"
                          >
                            Aportar
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* Form to insert custom dynamic goal */}
              <div className="md:col-span-1">
                <form onSubmit={handleCreateGoal} className={`rounded-xl p-5 space-y-4 h-full flex flex-col justify-between ${cardClass}`}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-display text-slate-400 border-b pb-2 mb-3">
                      Crear Nueva Meta
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-bold">Nombre del Proyecto</label>
                        <input 
                          type="text"
                          required
                          value={newGoal.name}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Inversión en Acciones"
                          className={`w-full px-3 py-2 rounded border focus:outline-none ${
                            isDark 
                              ? 'bg-black/20 border-white/10 text-white' 
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-bold">Monto Objetivo ($)</label>
                        <input 
                          type="number"
                          required
                          value={newGoal.target}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                          placeholder="Monto"
                          className={`w-full px-3 py-2 rounded border focus:outline-none ${
                            isDark 
                              ? 'bg-black/20 border-white/10 text-white' 
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-1 font-bold">Días Límite</label>
                          <input 
                            type="number"
                            value={newGoal.daysLeft}
                            onChange={(e) => setNewGoal(prev => ({ ...prev, daysLeft: e.target.value }))}
                            className={`w-full px-3 py-2 rounded border focus:outline-none ${
                              isDark 
                                ? 'bg-black/20 border-white/10 text-white' 
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 font-bold">Categoría</label>
                          <select
                            value={newGoal.category}
                            onChange={(e: any) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                            className={`w-full px-2 py-2 rounded bg-slate-500/10 border border-slate-500/20 text-slate-400`}
                          >
                            <option value="general">General</option>
                            <option value="vivienda">Vivienda</option>
                            <option value="comida">Alimentos</option>
                            <option value="viaje">Viaje</option>
                            <option value="estudio">Educación</option>
                            <option value="vehiculo">Vehículo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className={`w-full py-2.5 rounded text-xs font-bold uppercase tracking-wider font-display transition-colors mt-4 ${accentButton}`}
                  >
                    Confirmar Meta
                  </button>
                </form>
              </div>

            </div>

            {/* List other objective widgets with progress markers */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-base">Otros Proyectos en Ejecución</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {state.goals.map((g) => (
                  <div 
                    key={g.id}
                    className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${cardClass} ${
                      g.status === "retrasado" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-cyan-500"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          g.status === "retrasado" 
                            ? "bg-rose-500/10 text-rose-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {g.status === "retrasado" ? "RETRASADO" : "EN TIEMPO"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">Faltan {g.daysLeft} d</span>
                          <button 
                            type="button"
                            onClick={() => handleDeleteGoal(g.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Eliminar Meta"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{g.name}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          ${g.saved.toLocaleString()} / ${g.target.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {/* Range slider */}
                      <div>
                        <div className="w-full h-1.5 bg-slate-500/15 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              g.status === "retrasado" ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, (g.saved / g.target) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1 uppercase">
                          <span>PROGRESO</span>
                          <span>{Math.round((g.saved / g.target) * 100)}%</span>
                        </div>
                      </div>

                      {/* Manual target contributor */}
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          placeholder="$"
                          value={selectedGoalForContribution === g.id ? contributionAmountToGoal : ""}
                          onChange={(e) => {
                            setSelectedGoalForContribution(g.id);
                            setContributionAmountToGoal(e.target.value);
                          }}
                          className={`w-full px-2 py-1 rounded text-xs border focus:outline-none ${
                            isDark 
                              ? 'bg-black/20 border-white/10 text-white' 
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <button 
                          onClick={() => {
                            const amt = parseFloat(contributionAmountToGoal);
                            handleGoalContribution(g.id, amt);
                          }}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors tracking-wider font-display ${accentButton}`}
                        >
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth dynamic visual card widget */}
            <div className={`p-5 rounded-xl border border-slate-500/10 ${cardClass}`}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left max-w-lg">
                  <h4 className="font-extrabold text-base flex justify-center md:justify-start items-center gap-1.5">
                    <TrendingUp className="text-emerald-500 animate-bounce" size={18} /> Proyección de Crecimiento
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Basado en tus contribuciones actuales y ahorro constante de $250.00 quincenales, completarás el resto de tus proyectos en un estimado de <strong className="text-cyan-500">18 meses</strong>.
                  </p>
                  <button 
                    onClick={() => {
                      setIsProjectionsModalOpen(true);
                    }}
                    className={`px-4 py-2 text-xs font-bold uppercase font-display border rounded transition-all ${accentText} ${accentBorder} hover:bg-emerald-500/10`}
                  >
                    Optimizar Proyecciones (Proyección Interactiva)
                  </button>
                </div>

                <div className="w-full md:w-80 h-32 relative overflow-hidden rounded bg-slate-500/10 border border-slate-500/15">
                  <img 
                    alt="Chart growth" 
                    className="w-full h-full object-cover rounded opacity-40 mix-blend-difference" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtkd6wgdl9VGV-U3tOeCbPsArVZ6WaQqDypN0zpwaa9CF-CdXFh3p3Vob4LEuOMLQ93B6eOYfV20ZHvDc7tIVT8WenXRz_mIg3mjjEZLZgxyCdZz1_cPZ-EhedZQSEQwmnH5ZMy_9jRo-ikhpjet3y49b-wE1Ad7rqhbHpxn4q2dlrmLzfat0Fe8uFy9kpzgUBjcoJ8BuSkM-8ARXbdXuTBjIyvndWhVNfykQ_C5_ylH8GQnZbDxdn4JcfkCrJLVbqRPPqC9dhifI5"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER BOTTOM NAV NAVIGATION BAR */}
      <nav id="bottom-navigation-bar" className={`fixed bottom-0 left-0 right-0 z-40 ${bottomNavClass} py-2.5 transition-colors duration-300 rounded-t-2xl`}>
        <div className="max-w-md mx-auto flex justify-around items-center px-4">
          
          <button 
            id="nav-tab-inicio"
            onClick={() => setCurrentScreen("inicio")}
            className={`flex flex-col items-center justify-center p-1.5 transition-all outline-none ${
              currentScreen === "inicio" 
                ? `${accentText} drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]` 
                : "text-slate-400 hover:text-slate-500"
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] uppercase font-bold font-display mt-1">Inicio</span>
          </button>

          <button 
            id="nav-tab-movimientos"
            onClick={() => setCurrentScreen("movimientos")}
            className={`flex flex-col items-center justify-center p-1.5 transition-all outline-none ${
              currentScreen === "movimientos" 
                ? `${accentText} drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]` 
                : "text-slate-400 hover:text-slate-500"
            }`}
          >
            <Receipt size={20} />
            <span className="text-[10px] uppercase font-bold font-display mt-1">Movimientos</span>
          </button>

          <button 
            id="nav-tab-analisis"
            onClick={() => setCurrentScreen("analisis")}
            className={`flex flex-col items-center justify-center p-1.5 transition-all outline-none ${
              currentScreen === "analisis" 
                ? `${accentText} drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]` 
                : "text-slate-400 hover:text-slate-500"
            }`}
          >
            <BarChart3 size={20} />
            <span className="text-[10px] uppercase font-bold font-display mt-1">Análisis</span>
          </button>

          <button 
            id="nav-tab-ahorros"
            onClick={() => setCurrentScreen("ahorros")}
            className={`flex flex-col items-center justify-center p-1.5 transition-all outline-none ${
              currentScreen === "ahorros" 
                ? `${accentText} drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]` 
                : "text-slate-400 hover:text-slate-500"
            }`}
          >
            <PiggyBank size={20} />
            <span className="text-[10px] uppercase font-bold font-display mt-1">Ahorros</span>
          </button>

          <button 
            id="nav-tab-metas"
            onClick={() => setCurrentScreen("metas")}
            className={`flex flex-col items-center justify-center p-1.5 transition-all outline-none ${
              currentScreen === "metas" 
                ? `${accentText} drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]` 
                : "text-slate-400 hover:text-slate-500"
            }`}
          >
            <Rocket size={20} />
            <span className="text-[10px] uppercase font-bold font-display mt-1">Metas</span>
          </button>

        </div>
      </nav>

      {/* SETTINGS DRAWER / PANEL (INTEGRADO EN EL ICONO AJUSTES) */}
      {isSettingsOpen && (
        <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl ${
            isDark ? "bg-[#121318] border border-white/10 text-white" : "bg-white border border-slate-200 text-slate-800"
          }`}>
            
            {/* Drawer Header */}
            <header className="px-5 py-4 border-b border-slate-500/10 flex justify-between items-center bg-slate-500/5">
              <div className="flex items-center gap-2">
                <Settings className={`animate-spin-slow ${accentText}`} size={20} />
                <h3 className="text-sm font-extrabold uppercase font-display tracking-wider">
                  Ajustes de Interfaz
                </h3>
              </div>
              <button 
                id="close-settings-modal"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-rose-500 font-bold text-xs p-1 rounded hover:bg-slate-500/10"
              >
                Cerrar ✕
              </button>
            </header>

            {/* Config details body */}
            <div className="p-5 space-y-5 text-sm">
              
              {/* INTERFACE COLOR TUNER (Oscuro vs Claro selection as requested by user) */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-display">
                  1. Interfaz de Usuario (Modo)
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="theme-select-claro"
                    onClick={() => setState(prev => ({ ...prev, theme: "claro" }))}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      !isDark 
                        ? 'border-cyan-500 bg-cyan-500/5 text-cyan-600 font-semibold' 
                        : 'border-white/5 hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <Sun size={16} />
                    <div className="text-left">
                      <p className="text-xs">Modo Claro</p>
                      <p className="text-[10px] opacity-75 font-normal">Tonalidades suaves</p>
                    </div>
                  </button>

                  <button
                    id="theme-select-oscuro"
                    onClick={() => setState(prev => ({ ...prev, theme: "oscuro" }))}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isDark 
                        ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400 font-semibold' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Moon size={16} />
                    <div className="text-left">
                      <p className="text-xs">Modo Oscuro</p>
                      <p className="text-[10px] opacity-75 font-normal">Fondo obsidiana</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* COLOR TONE PRESETS SELECTION */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-display">
                  2. Tonos de Color Adicionales
                </span>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "celeste", name: "Celeste", hex: "#00f0ff", bg: "bg-[#00f0ff]" },
                    { id: "verde", name: "Verde", hex: "#22c55e", bg: "bg-[#22c55e]" },
                    { id: "rosa", name: "Rosa", hex: "#ec4899", bg: "bg-[#ec4899]" },
                    { id: "crema", name: "Crema", hex: "#f59e0b", bg: "bg-[#f59e0b]" }
                  ].map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSoftColorTone(color.id as any)}
                      className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1.5 transition-all text-[10px] font-bold uppercase ${
                        softColorTone === color.id
                          ? "border-slate-400 ring-2 ring-offset-2 ring-cyan-500/30"
                          : "border-slate-500/10 hover:bg-slate-500/5"
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full inline-block ${color.hex === accentColor ? "ring-2 ring-white" : ""} ${color.bg}`} />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SYSTEM DETAILS & PROFILE FIELDS */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-display">
                  3. Información Pública
                </span>

                <div className="space-y-3 p-3 rounded-lg bg-slate-500/5 border border-slate-500/10">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Nombre del Perfil</span>
                    <input
                      type="text"
                      value={state.profile.name}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value }
                      }))}
                      placeholder="Tu nombre completo"
                      className={`w-full px-2.5 py-1.5 rounded border text-xs focus:outline-none focus:border-cyan-500 font-bold ${
                        isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 uppercase">Correo Electrónico</span>
                    <span className="font-mono">c.aranda@otfinanzas.io</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 uppercase">Idioma</span>
                    <div className="flex gap-1">
                      <button className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-500 rounded font-bold font-mono">ES</button>
                      <button className="px-1.5 py-0.5 rounded font-mono text-slate-400 hover:bg-white/5">EN</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider font-display">
                  4. Preferencias de Seguridad
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-slate-400" />
                      <div>
                        <p className="font-bold">Notificaciones</p>
                        <p className="text-[10px] text-slate-400">Alertas de mercado y seguridad</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setState(prev => ({
                        ...prev,
                        profile: { ...prev.profile, notifications: !prev.profile.notifications }
                      }))}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                        state.profile.notifications ? 'bg-[#95e400]' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                        state.profile.notifications ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Fingerprint size={14} className="text-slate-400" />
                      <div>
                        <p className="font-bold">Acceso Biométrico</p>
                        <p className="text-[10px] text-slate-400">FaceID o huella digital</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setState(prev => ({
                        ...prev,
                        profile: { ...prev.profile, biometrics: !prev.profile.biometrics }
                      }))}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                        state.profile.biometrics ? 'bg-[#95e400]' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                        state.profile.biometrics ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset application simulated database or template to default */}
              <button
                onClick={() => {
                  if (confirm("¿Estás seguro de que deseas restablecer la aplicación a los valores por defecto iniciales? Se borrarán tus cambios.")) {
                    setState(initialAppState);
                    localStorage.removeItem("ordena_finanzas_state");
                    setIsSettingsOpen(false);
                  }
                }}
                className="w-full py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-bold uppercase tracking-wider font-display hover:bg-rose-500 hover:text-white transition-all text-center"
              >
                Restablecer Base de Datos Local
              </button>

            </div>

            {/* Footer with actions inside settings popup */}
            <footer className="px-5 py-4 bg-slate-500/5 text-center flex justify-end gap-2 text-xs border-t border-slate-500/10">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-[#1291a1] hover:bg-[#1291a1]/90 text-white font-bold rounded-lg uppercase tracking-widest font-display"
              >
                Aceptar Cambios
              </button>
            </footer>

          </div>
        </div>
      )}

      {isProjectionsModalOpen && (
        <div id="projections-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all border ${
            isDark ? 'bg-[#0f1015] text-[#e3e1e9] border-white/10' : 'bg-white text-slate-800 border-slate-200'
          }`}>
            
            <header className="px-5 py-4 border-b border-slate-500/10 flex justify-between items-center bg-slate-500/5">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-500 animate-pulse" size={20} />
                <h2 className="text-lg font-bold font-display">Calculadora de Proyección de Ahorros</h2>
              </div>
              <button 
                onClick={() => setIsProjectionsModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 font-bold text-xs p-1 rounded hover:bg-slate-500/10"
              >
                Cerrar ✕
              </button>
            </header>

            <div className="p-5 space-y-5 text-sm">
              <p className="text-xs text-slate-400">
                Simula el crecimiento de tu capital sumando tus fondos de ahorro actuales más tus contribuciones constantes de $500.00 al mes ($250.00 quincenales). Realiza un plan inteligente con interés compuesto anual.
              </p>

              {/* SLIDER FOR APY INTEREST */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Tasa de Rendimiento Anual (APY)</span>
                  <span className="text-emerald-500 font-mono font-extrabold">{projectionInterestRate}% APY</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={projectionInterestRate}
                  onChange={(e) => setProjectionInterestRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>1% (Conservador)</span>
                  <span>8.2% (Promedio OTF)</span>
                  <span>15% (Rendimiento Alto)</span>
                </div>
              </div>

              {/* SLIDER FOR YEARS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Plazo de la Proyección (Años)</span>
                  <span className="text-cyan-500 font-mono font-extrabold">{projectionYears} Años</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={projectionYears}
                  onChange={(e) => setProjectionYears(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>1 Año</span>
                  <span>15 Años</span>
                  <span>30 Años</span>
                </div>
              </div>

              {/* DYNAMIC CALCULATION OUTPUT AREA */}
              {(() => {
                const monthlyContribution = 500; // $250.00 quincenal = $500 monthly
                let totalCapital = state.savingsTotal;
                const monthlyRate = (projectionInterestRate / 100) / 12;
                const totalMonths = projectionYears * 12;
                let totalDeposited = 0;

                for (let i = 0; i < totalMonths; i++) {
                  totalCapital = (totalCapital * (1 + monthlyRate)) + monthlyContribution;
                  totalDeposited += monthlyContribution;
                }

                const interestEarned = Math.max(0, totalCapital - (state.savingsTotal + totalDeposited));

                return (
                  <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-black/10 text-slate-300">
                        <span className="block text-[8px] uppercase text-slate-400">Capital Inicial</span>
                        <span className="font-mono text-xs font-extrabold">${state.savingsTotal.toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded bg-black/10 text-slate-300">
                        <span className="block text-[8px] uppercase text-slate-400">Tus Depósitos</span>
                        <span className="font-mono text-xs font-extrabold">${totalDeposited.toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded bg-black/10 text-slate-300">
                        <span className="block text-[8px] uppercase text-slate-400">Interés Ganado</span>
                        <span className="font-mono text-xs text-emerald-500 font-extrabold">+${Math.round(interestEarned).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-500/10 text-center">
                      <span className="block text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Total Proyectado</span>
                      <span className="text-2xl md:text-3xl font-mono font-extrabold text-[#bcff5f]">
                        ${Math.round(totalCapital).toLocaleString()} USD
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        ¡Alcanzarías tu meta principal y tendrías capital líquido para tus metas adicionales!
                      </p>
                    </div>
                  </div>
                );
              })()}

            </div>

            <footer className="px-5 py-4 bg-slate-500/5 text-center flex justify-end gap-2 text-xs border-t border-slate-500/10">
              <button 
                onClick={() => setIsProjectionsModalOpen(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg uppercase tracking-widest font-display"
              >
                Cerrar Ventana
              </button>
            </footer>

          </div>
        </div>
      )}

    </div>
  );
}
