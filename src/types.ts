export interface Goal {
  id: string;
  name: string;
  saved: number;
  target: number;
  daysLeft: number;
  status: "tiempo" | "retrasado";
  category: "vivienda" | "comida" | "viaje" | "estudio" | "vehiculo" | "general";
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
  type: "gasto" | "ingreso";
}

export interface SavingsRecord {
  id: string;
  concept: string;
  date: string;
  amount: number;
  type: "quincenal" | "extraordinario";
}

export interface UserProfile {
  name: string;
  email: string;
  notifications: boolean;
  biometrics: boolean;
  language: "es" | "en" | "pt";
}

export interface AppState {
  theme: "claro" | "oscuro";
  netWorth: number;
  income: number;
  expenses: number;
  savingsTotal: number;
  goals: Goal[];
  transactions: Transaction[];
  savingsHistory: SavingsRecord[];
  automaticSavings: boolean;
  profile: UserProfile;
  monthlyExpenseLimit: number;
  categoryLimits: Record<string, number>;
}
