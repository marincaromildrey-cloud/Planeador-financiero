import { AppState } from "./types";

export const initialAppState: AppState = {
  theme: "claro", // Default light theme: claros y suaves
  netWorth: 142580.42,
  income: 8250.00,
  expenses: 4120.35,
  savingsTotal: 12450.00,
  automaticSavings: true,
  monthlyExpenseLimit: 5000.00,
  categoryLimits: {
    "Alimentación": 1200.00,
    "Transporte": 300.00,
    "Entretenimiento": 500.00,
    "Servicios": 800.00,
    "Salud": 400.00,
    "Educación": 600.00,
    "Otros": 500.00
  },
  profile: {
    name: "Carlos Aranda",
    email: "c.aranda@fintech2030.io",
    notifications: true,
    biometrics: true,
    language: "es"
  },
  goals: [
    {
      id: "g1",
      name: "Viaje a Japón 2024",
      saved: 3750,
      target: 5000,
      daysLeft: 142,
      status: "tiempo",
      category: "viaje"
    },
    {
      id: "g2",
      name: "Pago Inicial Casa",
      saved: 12000,
      target: 45000,
      daysLeft: 410,
      status: "tiempo",
      category: "vivienda"
    },
    {
      id: "g3",
      name: "Nuevo Vehículo",
      saved: 4200,
      target: 15000,
      daysLeft: 210,
      status: "retrasado",
      category: "vehiculo"
    },
    {
      id: "g4",
      name: "Maestría UX",
      saved: 8900,
      target: 10000,
      daysLeft: 60,
      status: "tiempo",
      category: "estudio"
    }
  ],
  transactions: [
    {
      id: "t1",
      description: "Supermercado Global",
      category: "Alimentación",
      date: "Hoy, 14:30",
      amount: 84.20,
      type: "gasto"
    },
    {
      id: "t2",
      description: "Depósito de Nómina",
      category: "Salario",
      date: "Ayer, 09:15",
      amount: 3200.00,
      type: "ingreso"
    },
    {
      id: "t3",
      description: "Servicios Eléctricos",
      category: "Servicios",
      date: "12 May, 18:40",
      amount: 125.00,
      type: "gasto"
    },
    {
      id: "t4",
      description: "Restaurante \"La Mesa\"",
      category: "Alimentación",
      date: "10 May, 21:10",
      amount: 65.20,
      type: "gasto"
    },
    {
      id: "t5",
      description: "Suscripción Netflix",
      category: "Entretenimiento",
      date: "05 May, 01:05",
      amount: 15.99,
      type: "gasto"
    }
  ],
  savingsHistory: [
    {
      id: "s1",
      concept: "Aportación Quincenal",
      date: "15 May 2024",
      amount: 250.00,
      type: "quincenal"
    },
    {
      id: "s2",
      concept: "Bono Extraordinario",
      date: "01 May 2024",
      amount: 1200.00,
      type: "extraordinario"
    },
    {
      id: "s3",
      concept: "Aportación Quincenal",
      date: "30 Apr 2024",
      amount: 250.00,
      type: "quincenal"
    }
  ]
};
