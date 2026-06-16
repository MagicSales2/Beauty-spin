/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Kit, User, Order, Coupon, SystemSettings, SpinRecord } from "../types";

export const initialProducts: Product[] = [
  { id: "p1", sku: "SUN-SPF50", name: "Protector Solar Toque Seco FPS 50+", stock: 85, cost: 15000, referencePrice: 35000 },
  { id: "p2", sku: "SER-HA3", name: "Sérum Concentrado Ácido Hialurónico 3%", stock: 45, cost: 22000, referencePrice: 59000 },
  { id: "p3", sku: "CRE-CERAM", name: "Crema Ultra-Hidratante de Ceramidas", stock: 110, cost: 18000, referencePrice: 45000 },
  { id: "p4", sku: "TON-ROSE", name: "Tónico Facial Hidratante de Rosas", stock: 65, cost: 10000, referencePrice: 28000 },
  { id: "p5", sku: "LIP-VELVET", name: "Labial Líquido Mate Velvet Red", stock: 150, cost: 8000, referencePrice: 25000 },
  { id: "p6", sku: "PAL-GOLD", name: "Paleta Sombras Ojos Golden Hour (12 tonos)", stock: 30, cost: 35000, referencePrice: 89000 },
  { id: "p7", sku: "MAS-WATER", name: "Pestañina Volumen Explosivo Waterproof", stock: 95, cost: 9000, referencePrice: 29000 },
  { id: "p8", sku: "MICE-WATER", name: "Agua Micelar Desmaquillante Purificante", stock: 130, cost: 7000, referencePrice: 19900 }
];

export const initialKits: Kit[] = [
  {
    id: "k1",
    name: "Kit Solar Premium",
    description: "La combinación perfecta de protección solar diaria con poder ceramida restaurador. Protege de la radiación UV e hidrata profundamente el rostro sin dejar rastro grasoso.",
    image: "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=600&auto=format&fit=crop&q=80",
    valorComercial: 108000,
    precioReclamar: 45000,
    probabilidad: 45,
    stock: 25,
    isActive: true,
    productRelations: [
      { productId: "p1", quantity: 1 },
      { productId: "p3", quantity: 1 },
      { productId: "p4", quantity: 1 }
    ],
    winnersThisMonthCount: 18
  },
  {
    id: "k2",
    name: "Kit Glow Radical",
    description: "Consigue una piel luminosa, humectada y limpia en tiempo récord. El elixir ideal con ácido hialurónico purificado, refrescante extracto de rosas y agua micelar activa.",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    valorComercial: 106900,
    precioReclamar: 59900,
    probabilidad: 35,
    stock: 18,
    isActive: true,
    productRelations: [
      { productId: "p2", quantity: 1 },
      { productId: "p4", quantity: 1 },
      { productId: "p8", quantity: 1 }
    ],
    winnersThisMonthCount: 11
  },
  {
    id: "k3",
    name: "Kit Glam Velvet Hour",
    description: "Luce un maquillaje sofisticado de noche o de día. Paleta súper cálida con pigmentos metálicos y mate, labial velvet suntuoso y pestañina que alarga sin grumos.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    valorComercial: 143000,
    precioReclamar: 79000,
    probabilidad: 15,
    stock: 12,
    isActive: true,
    productRelations: [
      { productId: "p5", quantity: 1 },
      { productId: "p6", quantity: 1 },
      { productId: "p7", quantity: 1 }
    ],
    winnersThisMonthCount: 5
  },
  {
    id: "k4",
    name: "Kit Súper Golden Jackpot",
    description: "¡LA COLECCIÓN DEFINITIVA! Disfruta de un tocador completo de ensueño. Incluye TODO: protectores solares, sérum, hidratantes potentes, tónico y maquillaje espectacular.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
    valorComercial: 310900,
    precioReclamar: 119900,
    probabilidad: 5,
    stock: 6,
    isActive: true,
    productRelations: [
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 1 },
      { productId: "p3", quantity: 1 },
      { productId: "p4", quantity: 1 },
      { productId: "p5", quantity: 1 },
      { productId: "p6", quantity: 1 },
      { productId: "p7", quantity: 1 }
    ],
    winnersThisMonthCount: 1,
    maxWinnersMonth: 3,
    isJackpot: true,
    jackpotTriggerInterval: 100
  }
];

export const initialUsers: User[] = [
  {
    id: "u_admin",
    fullName: "Administrador General",
    email: "admin@beautyspin.com",
    phone: "3001234567",
    address: "Oficinas Centrales Beauty Spin, Bogotá",
    role: "admin",
    registeredAt: "2026-01-10T08:00:00Z",
    coinsAvailable: 999,
    coinsPurchased: 999,
    coinsUsed: 0,
    vipLevel: "Diamante",
    totalSpent: 9990000,
    isActive: true
  },
  {
    id: "u1",
    fullName: "Camila Giraldo",
    email: "camila.giraldo@gmail.com",
    phone: "3154567890",
    address: "Calle 127 # 45 - 20, Apto 501, Bogotá",
    role: "user",
    registeredAt: "2026-03-15T14:22:15Z",
    coinsAvailable: 4,
    coinsPurchased: 15,
    coinsUsed: 11,
    vipLevel: "Plata",
    totalSpent: 389500, // Accumulated purchases
    isActive: true
  },
  {
    id: "u2",
    fullName: "Mateo Gómez Ríos",
    email: "mateo.gomez@yahoo.com",
    phone: "3209876543",
    address: "Carrera 80 # 34 - 12, Laureles, Medellín",
    role: "user",
    registeredAt: "2026-04-20T10:15:30Z",
    coinsAvailable: 1,
    coinsPurchased: 4,
    coinsUsed: 3,
    vipLevel: "Bronce",
    totalSpent: 94900,
    isActive: true
  },
  {
    id: "u3",
    fullName: "Sofia Vergara Castro",
    email: "sofiav@outlook.com",
    phone: "3105559876",
    address: "Avenida El Poblado # 5 Sur - 100, Medellín",
    role: "user",
    registeredAt: "2026-02-01T11:05:00Z",
    coinsAvailable: 12,
    coinsPurchased: 45,
    coinsUsed: 33,
    vipLevel: "Diamante",
    totalSpent: 1250000,
    isActive: true
  },
  {
    id: "u4",
    fullName: "Isabella Montenegro",
    email: "isabella.mont@gmail.com",
    role: "user",
    phone: "3014859623",
    address: "Calle 93 # 12 - 54, Bogotá",
    registeredAt: "2026-05-18T16:45:00Z",
    coinsAvailable: 0,
    coinsPurchased: 2,
    coinsUsed: 2,
    vipLevel: "Bronce",
    totalSpent: 45000,
    isActive: true
  }
];

export const initialCoupons: Coupon[] = [
  { id: "c1", code: "WELCOMEBS", type: "valor_fijo", value: 15000, description: "Descuento de $15.000 COP para reclamar tu primer premio ganado", isActive: true },
  { id: "c2", code: "BEAUTYSPIN20", type: "porcentaje", value: 20, description: "20% de descuento en el costo para reclamar cualquier kit beauty", isActive: true },
  { id: "c3", code: "FREECOIN", type: "coin_gratis", value: 1, description: "Añade 1 Coin de regalo totalmente gratis a tu cuenta", isActive: true },
  { id: "c4", code: "REBAJA5K", type: "valor_fijo", value: 5000, description: "Descuento rápido de $5.000 COP en cualquier envío", isActive: true }
];

export const initialOrders: Order[] = [
  {
    id: "o1",
    orderNumber: "BS-10023",
    userId: "u1",
    userFullName: "Camila Giraldo",
    kitId: "k1",
    kitName: "Kit Solar Premium",
    kitImage: "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=600&auto=format&fit=crop&q=80",
    amountPaid: 42000, // Exclusive price + shipping (configured with WELCOMEBS or default)
    shippingAddress: "Calle 127 # 45 - 20, Apto 501, Bogotá",
    status: "Delivered",
    createdAt: "2026-05-20T15:30:00Z",
    trackingNumber: "CO-789456123-ENV"
  },
  {
    id: "o2",
    orderNumber: "BS-10024",
    userId: "u3",
    userFullName: "Sofia Vergara Castro",
    kitId: "k3",
    kitName: "Kit Glam Velvet Hour",
    kitImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    amountPaid: 91000, // Claim price + shipping
    shippingAddress: "Avenida El Poblado # 5 Sur - 100, Medellín",
    status: "Shipped",
    createdAt: "2026-06-05T09:44:12Z",
    trackingNumber: "CO-812345091-ENV"
  },
  {
    id: "o3",
    orderNumber: "BS-10025",
    userId: "u3",
    userFullName: "Sofia Vergara Castro",
    kitId: "k4",
    kitName: "Kit Súper Golden Jackpot",
    kitImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
    amountPaid: 131900,
    shippingAddress: "Avenida El Poblado # 5 Sur - 100, Medellín",
    status: "Paid",
    createdAt: "2026-06-07T18:22:00Z"
  },
  {
    id: "o4",
    orderNumber: "BS-10026",
    userId: "u2",
    userFullName: "Mateo Gómez Ríos",
    kitId: "k1",
    kitName: "Kit Solar Premium",
    kitImage: "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=600&auto=format&fit=crop&q=80",
    amountPaid: 57000,
    shippingAddress: "Carrera 80 # 34 - 12, Laureles, Medellín",
    status: "Pending",
    createdAt: "2026-06-08T10:00:00Z"
  }
];

export const initialSpinRecords: SpinRecord[] = [
  { id: "s1", userId: "u1", userFullName: "Camila Giraldo", kitId: "k1", kitName: "Kit Solar Premium", wonAt: "2026-06-07T12:00:00Z", isJackpot: false },
  { id: "s2", userId: "u1", userFullName: "Camila Giraldo", kitId: "k2", kitName: "Kit Glow Radical", wonAt: "2026-06-07T14:15:00Z", isJackpot: false },
  { id: "s3", userId: "u3", userFullName: "Sofia Vergara Castro", kitId: "k4", kitName: "Kit Súper Golden Jackpot", wonAt: "2026-06-07T18:10:00Z", isJackpot: true },
  { id: "s4", userId: "u2", userFullName: "Mateo Gómez Ríos", kitId: "k1", kitName: "Kit Solar Premium", wonAt: "2026-06-08T09:30:00Z", isJackpot: false },
  { id: "s5", userId: "u4", userFullName: "Isabella Montenegro", kitId: "k2", kitName: "Kit Glow Radical", wonAt: "2026-06-08T11:20:00Z", isJackpot: false }
];

export const initialSystemSettings: SystemSettings = {
  coinPriceCop: 10000,
  jackpotCycle: 50, // Smaller for demo purposes, so users hit the Jackpot fast!
  totalSpinsCounter: 47, // Starting from 47 so in 3 spins we might hit jackpot cycle
  shippingCostCop: 12000,
  spin3CostCoins: 1,
  spin5CostCoins: 2
};
