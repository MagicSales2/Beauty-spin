/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = "admin" | "user";

export interface Product {
  id: string;
  sku: string;
  name: string;
  stock: number;
  cost: number;
  referencePrice: number;
}

export interface KitProductRelation {
  productId: string;
  quantity: number;
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  image: string;
  valorComercial: number;
  precioReclamar: number;
  probabilidad: number; // 0 to 100 representing percentage
  stock: number;
  isActive: boolean;
  productRelations: KitProductRelation[]; // Composition of single products
  // Limits and special conditions
  maxWinnersMonth?: number;
  winnersThisMonthCount: number;
  isJackpot?: boolean;
  jackpotTriggerInterval?: number; // e.g., every 100 spins
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: Role;
  registeredAt: string;
  coinsAvailable: number;
  coinsPurchased: number;
  coinsUsed: number;
  vipLevel: "Bronce" | "Plata" | "Oro" | "Diamante";
  totalSpent: number; // Cumulative spending globally in COP
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userFullName: string;
  kitId: string;
  kitName: string;
  kitImage: string;
  amountPaid: number;
  shippingAddress: string;
  status: "Pending" | "Paid" | "Shipped" | "Delivered";
  createdAt: string;
  trackingNumber?: string;
  couponUsed?: string;
}

export interface SpinResult {
  id: string;
  userId: string;
  kitId: string;
  kitName: string;
  kitImage: string;
  wonAt: string;
  expiresAt: string;
  status: "Won" | "Claimed" | "Expired";
  valorComercial: number;
  precioReclamar: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: "porcentaje" | "valor_fijo" | "coin_gratis";
  value: number; // percent (e.g. 15 for 15%) or COP (e.g. 20000)
  description: string;
  isActive: boolean;
}

export interface SpinRecord {
  id: string;
  userId: string;
  userFullName: string;
  kitId: string;
  kitName: string;
  wonAt: string;
  isJackpot: boolean;
}

export interface SystemSettings {
  coinPriceCop: number; // default $10.000 COP
  jackpotCycle: number; // e.g., 100, meaning every 100 spins overall triggers a Jackpot Kit
  totalSpinsCounter: number; // global counter of spins
  shippingCostCop: number; // default $12.000 COP
  spin3CostCoins?: number; // cost of spinning the 3-reels machine (default 1)
  spin5CostCoins?: number; // cost of spinning the 5-reels machine (default 2)
}
