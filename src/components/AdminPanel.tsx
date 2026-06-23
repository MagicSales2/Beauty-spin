/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product, Kit, User, Order, Coupon, SystemSettings, SpinRecord } from "../types";
import { 
  Lock, LayoutDashboard, Package, Layers, Users, ShoppingCart, 
  Settings, TrendingUp, DollarSign, RefreshCw, Plus, Edit2, 
  Trash2, ShieldAlert, Check, CheckCircle, Search, Eye, AlertCircle, Ban, Play 
} from "lucide-react";

interface AdminPanelProps {
  products: Product[];
  kits: Kit[];
  users: User[];
  orders: Order[];
  coupons: Coupon[];
  systemSettings: SystemSettings;
  spinRecords: SpinRecord[];
  onUpdateProducts: (newProducts: Product[]) => void;
  onUpdateKits: (newKits: Kit[]) => void;
  onUpdateUsers: (newUsers: User[]) => void;
  onUpdateOrders: (newOrders: Order[]) => void;
  onUpdateCoupons: (newCoupons: Coupon[]) => void;
  onUpdateSystemSettings: (newSettings: SystemSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  kits,
  users,
  orders,
  coupons,
  systemSettings,
  spinRecords,
  onUpdateProducts,
  onUpdateKits,
  onUpdateUsers,
  onUpdateOrders,
  onUpdateCoupons,
  onUpdateSystemSettings
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"metrics" | "kits" | "products" | "users" | "orders" | "settings" | "integrations">("metrics");

  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Search filter states
  const [userQuery, setUserQuery] = useState<string>("");
  const [orderQuery, setOrderQuery] = useState<string>("");

  // Product CRUD states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<Omit<Product, "id">>({
    sku: "",
    name: "",
    stock: 50,
    cost: 10000,
    referencePrice: 25000
  });

  // Kit CRUD states
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [showKitModal, setShowKitModal] = useState<boolean>(false);
  const [kitForm, setKitForm] = useState<{
    name: string;
    description: string;
    image: string;
    valorComercial: number;
    precioReclamar: number;
    probabilidad: number;
    stock: number;
    isActive: boolean;
    maxWinnersMonth?: number;
    isJackpot: boolean;
    productRelations: { productId: string; quantity: number }[];
  }>({
    name: "",
    description: "",
    image: "",
    valorComercial: 50000,
    precioReclamar: 25000,
    probabilidad: 20,
    stock: 10,
    isActive: true,
    isJackpot: false,
    productRelations: []
  });

  // System Settings state
  const [coinPriceForm, setCoinPriceForm] = useState<number>(systemSettings.coinPriceCop);
  const [shippingCostForm, setShippingCostForm] = useState<number>(systemSettings.shippingCostCop);
  const [jackpotForm, setJackpotForm] = useState<number>(systemSettings.jackpotCycle);
  const [spin3CostCoinsForm, setSpin3CostCoinsForm] = useState<number>(systemSettings.spin3CostCoins || 1);
  const [spin5CostCoinsForm, setSpin5CostCoinsForm] = useState<number>(systemSettings.spin5CostCoins || 2);

  // Form states helper
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "1234") {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError("Clave administrativa incorrecta. Intente de nuevo.");
    }
  };

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(num);
  };

  // 1. CALCULATE FINANCIAL METRICS
  const totalCoinsPaidRevenue = orders.reduce((sum, order) => {
    // Only count orders that represent real income sequence
    return sum + (order.amountPaid || 0);
  }, 0);

  // Approximate income based on coin packs sold
  const totalSales = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  // Calculate Logistical Cost
  let totalProductCost = 0;
  orders.forEach(order => {
    const matchedKit = kits.find(k => k.id === order.kitId);
    if (matchedKit) {
      matchedKit.productRelations.forEach(rel => {
        const prod = products.find(p => p.id === rel.productId);
        if (prod) {
          totalProductCost += (prod.cost * rel.quantity);
        }
      });
    }
  });

  const totalShippingLogCosts = orders.filter(o => o.status !== "Pending").length * systemSettings.shippingCostCop;
  const totalSpendCosts = totalProductCost + totalShippingLogCosts;
  const netProfitEstimado = totalSales - totalSpendCosts;
  const profitMarginPercent = totalSales > 0 ? (netProfitEstimado / totalSales) * 100 : 0;

  // Conversion counts (MVP steps funnel tracker)
  const stepRegistered = users.length;
  const stepBoughtCoin = users.filter(u => u.totalSpent > 0 || u.coinsAvailable > 0).length;
  const stepSpun = spinRecords.length;
  const stepClaimedKit = orders.length;

  // PRODUCT CRUD HANDLERS
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      // Update existing
      const updated = products.map(p => p.id === editingProduct.id ? { ...editingProduct, ...productForm } : p);
      onUpdateProducts(updated);
    } else {
      // Add new
      const nextId = "p" + (products.length + 1);
      const newProd = { id: nextId, ...productForm };
      onUpdateProducts([...products, newProd]);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      sku: prod.sku,
      name: prod.name,
      stock: prod.stock,
      cost: prod.cost,
      referencePrice: prod.referencePrice
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = (id: string) => {
    onUpdateProducts(products.filter(p => p.id !== id));
    showToast("Insumo de bodega eliminado correctamente.", "info");
  };

  // KIT CRUD HANDLERS
  const handleKitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate custom products relation is set
    if (kitForm.productRelations.length === 0) {
      showToast("Debes asociar al menos 1 producto de la bodega a este Kit.", "error");
      return;
    }

    if (editingKit) {
      const updated = kits.map(k => k.id === editingKit.id ? { ...editingKit, ...kitForm } : k);
      onUpdateKits(updated);
      showToast("Kit de premios editado exitosamente.", "success");
    } else {
      const nextId = "kit_" + (kits.length + 1);
      const newKit = { id: nextId, ...kitForm };
      onUpdateKits([...kits, newKit]);
      showToast("Nuevo Kit de premios creado exitosamente.", "success");
    }
    setShowKitModal(false);
    setEditingKit(null);
  };

  const handleEditKitClick = (kit: Kit) => {
    setEditingKit(kit);
    setKitForm({
      name: kit.name,
      description: kit.description,
      image: kit.image,
      valorComercial: kit.valorComercial,
      precioReclamar: kit.precioReclamar,
      probabilidad: kit.probabilidad,
      stock: kit.stock,
      isActive: kit.isActive,
      isJackpot: kit.isJackpot || false,
      productRelations: kit.productRelations
    });
    setShowKitModal(true);
  };

  const handleDeleteKit = (id: string) => {
    onUpdateKits(kits.filter(k => k.id !== id));
    showToast("Kit de premios removido de la ruleta hito.", "info");
  };

  const handleToggleKitRelation = (pId: string, qty: number = 1) => {
    const existingIdx = kitForm.productRelations.findIndex(r => r.productId === pId);
    if (existingIdx >= 0) {
      // Remove or reduce
      const filtered = kitForm.productRelations.filter(r => r.productId !== pId);
      setKitForm({ ...kitForm, productRelations: filtered });
    } else {
      // Add
      const added = [...kitForm.productRelations, { productId: pId, quantity: qty }];
      setKitForm({ ...kitForm, productRelations: added });
    }
  };

  const handleUpdateKitRelationQty = (pId: string, qty: number) => {
    const updated = kitForm.productRelations.map(r => r.productId === pId ? { ...r, quantity: qty } : r);
    setKitForm({ ...kitForm, productRelations: updated });
  };

  // ORDER LOGISTICS AND DISPATCH CONTROLLER HANDLERS
  const handleUpdateOrderStatus = (oId: string, status: "Pending" | "Paid" | "Shipped" | "Delivered") => {
    const updated = orders.map(o => {
      if (o.id === oId) {
        let tracking = o.trackingNumber;
        if (status === "Shipped" && !tracking) {
          // Auto generate mock Servientrega tracking number of 10 digits
          tracking = "SV" + Math.floor(10000000 + Math.random() * 90000000) + "CO";
        }
        return {
          ...o,
          status,
          trackingNumber: tracking,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    onUpdateOrders(updated);
  };

  // Grant clean balance coins to users manually in demo state
  const handleGrantFreeCoin = (uId: string) => {
    const updated = users.map(u => {
      if (u.id === uId) {
        return {
          ...u,
          coinsAvailable: u.coinsAvailable + 1
        };
      }
      return u;
    });
    onUpdateUsers(updated);
  };

  // Save rules changes
  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemSettings({
      ...systemSettings,
      coinPriceCop: coinPriceForm,
      shippingCostCop: shippingCostForm,
      jackpotCycle: jackpotForm,
      spin3CostCoins: spin3CostCoinsForm,
      spin5CostCoins: spin5CostCoinsForm
    });
    showToast("¡Reglas del sistema actualizadas perfectamente!", "success");
  };

  // Filter lists inside admin panel
  const filteredUsers = users.filter(usr => 
    usr.fullName.toLowerCase().includes(userQuery.toLowerCase()) || 
    usr.email.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(ord => 
    ord.orderNumber.toLowerCase().includes(orderQuery.toLowerCase()) ||
    ord.shippingAddress.toLowerCase().includes(orderQuery.toLowerCase()) ||
    ord.kitName.toLowerCase().includes(orderQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white border border-stone-200 rounded-[28px] p-6 sm:p-8 shadow-sm text-stone-850 text-center my-12">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <Lock className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-extrabold text-stone-900 mb-1">Acceso Administrativo Resguardado</h3>
        <p className="text-xs text-stone-500 mb-5 font-sans leading-relaxed">Solo operadores autorizados de Beauty Spin pueden monitorear métricas financieras o reabastecer stock de productos.</p>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Clave demo (1234)"
            className="bg-stone-50 border border-stone-250 rounded-xl px-4 py-3 w-full text-xs text-stone-900 tracking-wider text-center focus:outline-none focus:border-rose-500 font-mono font-bold"
          />
          {authError && (
            <p className="text-[10px] text-red-650 font-medium font-mono">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition uppercase cursor-pointer"
          >
            Validar Credencial
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="beauty-admin-dashboard-container" className="relative bg-white border border-stone-200/80 rounded-[30px] p-4 sm:p-6 md:p-8 shadow-[0_12px_30px_rgba(27,25,23,0.03)] text-stone-850">
      
      {/* Dynamic Toast feedback instead of alerts */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 bg-stone-900 border border-stone-850 text-white rounded-2xl px-4 py-3.5 shadow-xl max-w-sm animate-bounce flex items-center gap-3">
          {toastMessage.type === "success" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-lg shadow-emerald-500/50" />}
          {toastMessage.type === "error" && <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-lg shadow-rose-500/50" />}
          {toastMessage.type === "info" && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 shadow-lg shadow-cyan-400/50" />}
          <span className="text-xs font-mono font-medium">{toastMessage.text}</span>
        </div>
      )}
      
      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-stone-200 pb-5">
        <div>
          <span className="text-[9px] text-rose-600 font-mono tracking-widest block font-extrabold uppercase mb-1">MÓDULO DE MONITOREO TÉCNICO</span>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-sans tracking-tight">
            Panel Administrativo Control Room
          </h2>
        </div>

        <button
          onClick={() => {
            setIsAuthenticated(false);
            setPasswordInput("");
          }}
          className="bg-stone-50 hover:bg-stone-100 px-3.5 py-2 rounded-xl text-xs text-stone-600 font-semibold transition cursor-pointer border border-stone-200 shadow-2xs"
        >
          Cerrar Sesión Admin
        </button>
      </div>

      {/* Admin Tabs Menu */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs select-none">
        {[
          { id: "metrics", label: "Métricas", icon: LayoutDashboard },
          { id: "kits", label: "Kits de Belleza", icon: Layers },
          { id: "products", label: "Productos / Bodega", icon: Package },
          { id: "users", label: "Clientes", icon: Users },
          { id: "orders", label: "Logística y Guías", icon: ShoppingCart },
          { id: "settings", label: "Reglas de Sorteo", icon: Settings },
          { id: "integrations", label: "Conexiones, Supabase y Pagos", icon: RefreshCw }
        ].map(sub => {
          const Icon = sub.icon;
          const isSel = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer border ${
                isSel
                  ? "bg-rose-600 text-white border-rose-650 shadow-2xs"
                  : "bg-white text-stone-550 border-stone-200 hover:text-stone-850 hover:border-stone-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: FINANCIAL METRICS & ANALYTICS */}
      {activeSubTab === "metrics" && (
        <div className="space-y-6">
          
          {/* Top KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 shadow-inner">
              <span className="text-[9.5px] text-stone-500 font-mono tracking-widest uppercase block font-bold">FACTURACIÓN BRUTA</span>
              <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-1">{formatCOP(totalSales)}</div>
              <p className="text-[10px] text-stone-450 mt-1">Suma total de compras reales</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 shadow-inner">
              <span className="text-[9.5px] text-stone-500 font-mono tracking-widest uppercase block font-bold">COSTOS LOGÍSTICOS</span>
              <div className="text-base sm:text-lg font-black text-amber-700 font-mono mt-1">{formatCOP(totalSpendCosts)}</div>
              <p className="text-[10px] text-stone-450 mt-1">Productos ({formatCOP(totalProductCost)}) + Despacho</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 shadow-inner">
              <span className="text-[9.5px] text-stone-500 font-mono tracking-widest uppercase block font-bold">MARGEN NETO EST.</span>
              <div className="text-base sm:text-lg font-black text-emerald-800 font-mono mt-1">{formatCOP(netProfitEstimado)}</div>
              <p className="text-[10px] text-stone-450 mt-1 font-sans">Retorno sobre ventas: <b>{profitMarginPercent.toFixed(1)}%</b></p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 shadow-inner">
              <span className="text-[9.5px] text-stone-500 font-mono tracking-widest uppercase block font-bold">HISTORIAL DE GIROS</span>
              <div className="text-base sm:text-lg font-black text-rose-700 font-mono mt-1">{systemSettings.totalSpinsCounter} spins</div>
              <p className="text-[10px] text-stone-450 mt-1">Log de giros acumulados</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Native Conversion Funnel SVG indicator */}
            <div className="lg:col-span-1 bg-stone-50 border border-stone-200 p-5 rounded-2xl flex flex-col justify-between text-left">
              <div>
                <h3 className="text-[10px] font-extrabold font-mono text-stone-500 tracking-widest uppercase mb-4 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-rose-500" />
                  EMBUDO EN TIEMPO REAL
                </h3>

                <div className="space-y-4">
                  {[
                    { label: "1. Registrados", val: stepRegistered, color: "bg-stone-400", rawVal: `${stepRegistered} usuarios` },
                    { label: "2. Compraron Coin", val: stepBoughtCoin, color: "bg-amber-500", rawVal: `${stepBoughtCoin} (${stepRegistered > 0 ? ((stepBoughtCoin/stepRegistered)*100).toFixed(0) : 0}%)` },
                    { label: "3. Giraron Casino", val: stepSpun, color: "bg-rose-500", rawVal: `${stepSpun} (${stepBoughtCoin > 0 ? ((stepSpun/stepBoughtCoin)*100).toFixed(0) : 0}%)` },
                    { label: "4. Despacharon Kit", val: stepClaimedKit, color: "bg-emerald-600", rawVal: `${stepClaimedKit} (${stepSpun > 0 ? ((stepClaimedKit/stepSpun)*100).toFixed(0) : 0}%)` }
                  ].map((step, i) => {
                    const pct = stepRegistered > 0 ? (step.val / stepRegistered) * 100 : 0;
                    return (
                      <div key={i} className="text-xs">
                        <div className="flex justify-between items-center text-stone-550 mb-1">
                          <span>{step.label}</span>
                          <strong className="text-stone-904 font-mono font-bold text-sm">{step.rawVal}</strong>
                        </div>
                        <div className="w-full bg-stone-220 h-1.5 rounded-full overflow-hidden border border-stone-200">
                          <div className={`h-full rounded-full ${step.color}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 mt-4 text-[10px] text-stone-500 italic font-mono leading-relaxed">
                ✓ El embudo contabiliza la fluidez total de compras de coins, giros de bot y despachos generados en Servientrega.
              </div>
            </div>

            {/* List block of recent spins */}
            <div className="lg:col-span-2 bg-stone-50 border border-stone-200 p-5 rounded-2xl text-left">
              <h3 className="text-[10px] font-extrabold font-mono text-stone-500 tracking-widest uppercase mb-4 flex items-center justify-between">
                <span>AUDITORÍA LIVE: ÚLTIMAS 5 TRANSACCIONES DE REPUETO</span>
                <span className="text-[9px] text-[#A3A3A3] font-normal lowercase">[Frecuencia: instantánea]</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-sans text-stone-700">
                  <thead className="bg-[#EDEDED] text-[9.5px] font-mono tracking-widest text-stone-500 uppercase rounded-t-xl">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Cliente</th>
                      <th className="py-2.5 px-3 text-left">Kit Liberado</th>
                      <th className="py-2.5 px-3 text-right">Costo Giro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150">
                    {spinRecords.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-stone-400 italic">No se han registrado giros en esta sesión.</td>
                      </tr>
                    ) : (
                      spinRecords.slice(-5).reverse().map((k, i) => {
                        const mUser = users.find(u => u.id === k.userId);
                        return (
                          <tr key={k.id || i} className="hover:bg-white transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-stone-905">{mUser ? mUser.fullName : "Cliente Demo"}</td>
                            <td className="py-2.5 px-3 font-mono">{k.kitName} {k.isJackpot && <strong className="text-rose-600 font-extrabold text-[10px] font-mono">[JACKPOT]</strong>}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-stone-500">{k.coinCost} Coins</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 2: BEAUTY KITS INVENTORY CRUD */}
      {activeSubTab === "kits" && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111] mb-1">Combos y Kits de Belleza en Disputa</h3>
              <p className="text-xs text-stone-500">Un kit une varios insumos cosméticos de bodega. Configura su probabilidad de ganancia aquí.</p>
            </div>
            
            <button
              onClick={() => {
                setEditingKit(null);
                setKitForm({
                  name: "",
                  description: "",
                  image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300",
                  valorComercial: 60000,
                  precioReclamar: 20000,
                  probabilidad: 20,
                  stock: 5,
                  isActive: true,
                  isJackpot: false,
                  productRelations: []
                });
                setShowKitModal(true);
              }}
              className="py-2 px-4.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] uppercase font-bold tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Crear Nuevo Kit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map(kit => {
              const totalCost = kit.productRelations.reduce((sum, r) => {
                const prod = products.find(p => p.id === r.productId);
                return sum + ((prod?.cost || 1) * r.quantity);
              }, 0);

              return (
                <div key={kit.id} className="bg-stone-50 border border-stone-200 p-5 rounded-2xl flex flex-col justify-between text-left shadow-2xs">
                  <div>
                    <div className="rounded-xl overflow-hidden h-36 mb-4 border border-stone-250 bg-white relative">
                      <img src={kit.image} alt={kit.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      {kit.isJackpot && (
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                          ★ JACKPOT GORDO
                        </span>
                      )}
                      <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded shadow ${kit.isActive ? "bg-emerald-50 border border-emerald-250 text-emerald-800" : "bg-red-50 border border-red-250 text-rose-800"}`}>
                        {kit.isActive ? "ACTIVO" : "PAUSADO"}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-stone-950 text-base leading-tight mb-2.5">{kit.name}</h4>
                    
                    <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-200 pt-3">
                      <div className="flex justify-between">
                        <span>Valor Comercial:</span>
                        <strong className="text-stone-900 font-semibold font-mono">{formatCOP(kit.valorComercial)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tasa de Reclamo COP:</span>
                        <strong className="text-emerald-700 font-bold font-mono">{formatCOP(kit.precioReclamar)} COP</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Costo Químico Bodega:</span>
                        <strong className="text-stone-500 font-semibold font-mono">{formatCOP(totalCost)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock Disponible:</span>
                        <strong className="text-stone-900 font-semibold font-mono">{kit.stock} u.</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Probabilidad Peso:</span>
                        <strong className="text-rose-600 font-extrabold font-mono">{kit.probabilidad}%</strong>
                      </div>
                    </div>

                    <div className="mt-4 bg-white p-2.5 rounded-xl border border-stone-150">
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider font-extrabold font-mono block mb-1.5">Insumos Relacionados:</span>
                      <div className="flex flex-wrap gap-1">
                        {kit.productRelations.map(rel => {
                          const prod = products.find(p => p.id === rel.productId);
                          return prod ? (
                            <span key={rel.productId} className="text-[10px] bg-stone-50 px-2 py-0.5 rounded border border-stone-200 text-stone-800 font-medium">
                              {rel.quantity}x {prod.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 border-t border-stone-200/80 pt-4 shrink-0">
                    <button
                      onClick={() => handleEditKitClick(kit)}
                      className="flex-1 py-2 bg-stone-900 text-white font-mono text-[10.5px] uppercase font-bold tracking-widest hover:bg-stone-800 transition cursor-pointer flex items-center justify-center gap-1 rounded-xl"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Modificar
                    </button>
                    <button
                      onClick={() => handleDeleteKit(kit.id)}
                      className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-650 transition cursor-pointer rounded-xl shrink-0"
                      title="Eliminar Kit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PHYSICAL INGREDIENTS/PRODUCTS STOCK BODUGA */}
      {activeSubTab === "products" && (
        <div className="space-y-6 text-left">
          <div className="flex sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#111111] mb-1">Bodega de Insumos Físicos de Belleza</h3>
              <p className="text-xs text-stone-500">Administra los productos cosméticos individuales que configuran tu stock de kits.</p>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  sku: "SKU-COL-",
                  name: "",
                  stock: 50,
                  cost: 8000,
                  referencePrice: 20000
                });
                setShowProductModal(true);
              }}
              className="py-2 px-4.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] uppercase font-bold tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              Ingresar Alimento/Maquillaje
            </button>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans text-stone-700">
                <thead className="bg-[#EDEDED] text-[9.5px] font-mono tracking-widest text-stone-500 uppercase rounded-t-xl">
                  <tr>
                    <th className="py-2.5 px-3 text-left">SKU Barra</th>
                    <th className="py-2.5 px-3 text-left">Nombre Comercial</th>
                    <th className="py-2.5 px-3 text-right">Inversión Costo</th>
                    <th className="py-2.5 px-3 text-right">Precio Ref</th>
                    <th className="py-2.5 px-3 text-center">Stock Real</th>
                    <th className="py-2.5 px-3 text-center">Controles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {products.map(prod => (
                    <tr key={prod.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-stone-500">{prod.sku}</td>
                      <td className="py-3 px-3 font-bold text-stone-900">{prod.name}</td>
                      <td className="py-3 px-3 text-right font-mono text-stone-600">{formatCOP(prod.cost)}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 font-semibold">{formatCOP(prod.referencePrice)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold font-mono font-sans ${prod.stock < 10 ? "bg-red-50 text-rose-800 border border-red-200 animate-pulse" : "bg-stone-100 text-stone-800 border border-stone-200"}`}>
                          {prod.stock} u.
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex justify-center items-center gap-1.5 select-none">
                          <button
                            onClick={() => handleEditProductClick(prod)}
                            className="bg-stone-100 border border-stone-200 p-1.5 rounded text-stone-700 hover:text-stone-950 transition cursor-pointer"
                            title="Editar Insumo"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="bg-stone-100 border border-rose-100 p-1.5 rounded text-rose-650 hover:text-rose-800 transition cursor-pointer"
                            title="Borrar de la Bodega"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: CLIENT RECORDS GESTION */}
      {activeSubTab === "users" && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-extrabold text-[#111111] mb-1">Base de Cuentas y Clientes VIP</h3>
            <p className="text-xs text-stone-550">Supervisa las carteras financieras de los clientes. Otorga Coins gratuitas para testing de MVP.</p>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl shadow-inner">
            <div className="relative max-w-md mb-4 pr-2">
              <Search className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Filtrar por nombre o email..."
                className="bg-white border border-stone-200 rounded-xl px-3.5 py-1.5 pl-9 text-xs text-stone-900 placeholder-stone-400 w-full focus:outline-none focus:border-rose-500 shadow-2xs font-sans"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans text-stone-700">
                <thead className="bg-[#EDEDED] text-[9.5px] font-mono tracking-widest text-stone-500 uppercase rounded-t-xl">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Perfil</th>
                    <th className="py-2.5 px-3 text-left">Nivel VIP</th>
                    <th className="py-2.5 px-3 text-right">Inversión Acum</th>
                    <th className="py-2.5 px-3 text-center">Bolsillo Coins</th>
                    <th className="py-2.5 px-3 text-center">Acción de Soporte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {filteredUsers.map(usr => (
                    <tr key={usr.id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-3 text-left">
                        <strong className="text-stone-950 font-bold block">{usr.fullName}</strong>
                        <span className="text-stone-450 text-[11px] font-sans">{usr.email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-800 font-mono">
                          {usr.vipLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">{formatCOP(usr.totalSpent)}</td>
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-stone-900">{usr.coinsAvailable} Coins</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleGrantFreeCoin(usr.id)}
                          className="bg-stone-105 border border-stone-200 hover:bg-stone-200 text-stone-700 px-3 py-1 rounded text-[10.5px] font-bold font-mono transition cursor-pointer"
                        >
                          + Regalar 1 Coin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: ORDER LOGISTICS AND DISPATCH LOGS */}
      {activeSubTab === "orders" && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 mb-1">Pedidos y Operaciones Logísticas Servientrega</h3>
            <p className="text-xs text-stone-550">Supervisa las órdenes de despacho. Edita el estatus y rellena los números de guía correspondientes.</p>
          </div>

          <div className="bg-stone-50 border border-stone-200 p-5 rounded-2xl shadow-inner">
            <div className="relative max-w-md mb-4 pr-2">
              <Search className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Filtrar por orden, dirección o kit..."
                className="bg-white border border-stone-200 rounded-xl px-3.5 py-1.5 pl-9 text-xs text-stone-900 placeholder-stone-400 w-full focus:outline-none focus:border-rose-500 shadow-2xs font-sans"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans text-stone-700">
                <thead className="bg-[#EDEDED] text-[9.5px] font-mono tracking-widest text-stone-500 uppercase rounded-t-xl">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Orden / Fecha</th>
                    <th className="py-2.5 px-3 text-left">Destinatario</th>
                    <th className="py-2.5 px-3 text-left">Kit Despachado</th>
                    <th className="py-2.5 px-3 text-right">Facturado</th>
                    <th className="py-2.5 px-3 text-left">Dirección de Envío</th>
                    <th className="py-2.5 px-3 text-center">Estado Servientrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-stone-400 italic">No se registran órdenes logísticas en disputa.</td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => (
                      <tr key={ord.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-3">
                          <strong className="text-stone-950 block font-mono text-sm">{ord.orderNumber}</strong>
                          <span className="text-[10px] text-stone-450 block font-sans">{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-3 text-left font-semibold text-stone-900">
                          {users.find(u => u.id === ord.userId)?.fullName || "Cliente Demo"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900">{ord.kitName}</td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-stone-900">{formatCOP(ord.amountPaid)}</td>
                        <td className="py-3 px-3 text-[11px] text-stone-500 leading-tight pr-4 max-w-[140px] truncate" title={ord.shippingAddress}>{ord.shippingAddress}</td>
                        <td className="py-3 px-3 text-center">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                            className="bg-stone-50 text-[11px] border border-stone-200 rounded-lg py-1 px-2 font-bold focus:outline-none focus:border-rose-500 cursor-pointer pointer-events-auto shadow-2xs py-1.5"
                          >
                            <option value="Pending">Pago Pendiente</option>
                            <option value="Paid">Preparando Caja</option>
                            <option value="Shipped">Enviado (En camino)</option>
                            <option value="Delivered">Entregado</option>
                          </select>
                          
                          {ord.trackingNumber && (
                            <span className="text-[9.5px] text-stone-450 block mt-1.5 font-mono select-all">
                              Guía: <b>{ord.trackingNumber}</b>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: SYSTEM PRICING AND ASSIGNATION GAME RULES */}
      {activeSubTab === "settings" && (
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 mb-1">Reglas del Sorteo, Tasas y Jackpot</h3>
            <p className="text-xs text-stone-550">Equilibra la tasa matemática de Beauty Spin. Los cambios se reflejarán instantáneamente en la interfaz de ruleta del shopper.</p>
          </div>

          <form onSubmit={handleSaveSystemSettings} className="bg-stone-50 border border-stone-200 p-5 rounded-2xl max-w-lg space-y-5 shadow-xs">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase tracking-wider mb-1.5">PRECIO POR COIN (COP)</label>
                <input
                  type="number"
                  min={1000}
                  value={coinPriceForm}
                  onChange={(e) => setCoinPriceForm(Number(e.target.value))}
                  className="bg-white border border-stone-250 rounded-xl px-3 w-full text-xs text-stone-900 py-2.5 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase tracking-wider mb-1.5">COSTO LOGÍSTICA ENVÍO (COP)</label>
                <input
                  type="number"
                  min={1000}
                  value={shippingCostForm}
                  onChange={(e) => setShippingCostForm(Number(e.target.value))}
                  className="bg-white border border-stone-250 rounded-xl px-3 w-full text-xs text-stone-900 py-2.5 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-4">
              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase tracking-wider mb-1.5">COSTO MÁQ 3 PRODS (COINS)</label>
                <input
                  type="number"
                  min={1}
                  value={spin3CostCoinsForm}
                  onChange={(e) => setSpin3CostCoinsForm(Number(e.target.value))}
                  className="bg-white border border-stone-250 rounded-xl px-3 w-full text-xs text-stone-900 py-2.5 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase tracking-wider mb-1.5">COSTO MÁQ 5 PRODS (COINS)</label>
                <input
                  type="number"
                  min={1}
                  value={spin5CostCoinsForm}
                  onChange={(e) => setSpin5CostCoinsForm(Number(e.target.value))}
                  className="bg-white border border-stone-250 rounded-xl px-3 w-full text-xs text-stone-900 py-2.5 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4">
              <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase tracking-wider mb-1.5">CICLO JACKPOT MÁXIMO (GIROS GLOBALES)</label>
              <input
                type="number"
                min={2}
                value={jackpotForm}
                onChange={(e) => setJackpotForm(Number(e.target.value))}
                className="bg-white border border-stone-250 rounded-xl px-3 w-full text-xs text-stone-900 py-2.5 focus:outline-none focus:border-rose-500 font-mono font-semibold"
              />
              <span className="text-[10px] text-stone-450 block mt-1.5 leading-normal">
                Determina cuántos giros acumulados globales de todos los clientes de la plataforma se requieren para forzar un premio Jackpot de lujo 100% garantizado (Resetea al completarse).
              </span>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] uppercase font-bold tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-97"
            >
              Guardar Reglas Actuales
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 7: CONNECTIONS, SUPABASE, WOMPI, MERCADOPAGO AND HOSTINGER SETUP CHEAT SHEET */}
      {activeSubTab === "integrations" && (
        <div className="space-y-6 text-left">
          <div>
            <span className="text-[9.5px] uppercase font-mono px-2.5 py-1 bg-amber-50 rounded-md border border-amber-200 text-amber-800 font-bold tracking-wider inline-block mb-2">
              Guía de Despliegue de Producción
            </span>
            <h3 className="text-base font-black text-stone-900 font-sans tracking-tight">
              Conexiones & Arquitectura para Hostinger y GitHub
            </h3>
            <p className="text-xs text-stone-550">
              Usa esta consola técnica para configurar tus conexiones en tiempo real, descargar el esquema de Supabase SQL y conocer los parámetros recomendados para la pasarela de pagos.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SECZIONE 1: SUPABASE CONFIG CONNECTIONS */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Base de Datos: Conexión Supabase</h4>
                  <p className="text-[10px] text-stone-400">Guarda las credenciales para sincronizar tus tablas</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">SUPABASE_URL</label>
                  <input
                    type="text"
                    placeholder="https://your-project.supabase.co"
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 w-full font-mono"
                    defaultValue={localStorage.getItem("beauty_supabase_url") || ""}
                    onChange={(e) => localStorage.setItem("beauty_supabase_url", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">SUPABASE_ANON_KEY (CLIENT PUBLIC KEY)</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6..."
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 w-full font-mono"
                    defaultValue={localStorage.getItem("beauty_supabase_key") || ""}
                    onChange={(e) => localStorage.setItem("beauty_supabase_key", e.target.value)}
                  />
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                  <div className="flex gap-2 text-[10.5px] text-emerald-800 leading-normal">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <span className="font-bold">¡Listo para conectar!</span> Esta app se compila como un sitio estático SPA desde Vite. Al guardarse aquí, estas claves se usan en el cliente usando el SDK oficial de Supabase <code className="bg-emerald-100 text-[9.5px] px-1 py-0.5 rounded font-mono font-bold">@supabase/supabase-js</code> sin necesidad de servidores adicionales.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECZIONE 2: PASARELA DE PAGOS COLOMBIANA */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Pasarela de Pagos (Wompi & MercadoPago)</h4>
                  <p className="text-[10px] text-stone-400">Parámetros recomendados para transacciones COP en Colombia</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
                  <p>
                    Para recolectar los cobros de tus Coins y cobros de envíos por Kits (COP), te sugerimos dos métodos de alta tasa de conversión en Colombia:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-750">
                    <li>
                      <span className="font-bold">MercadoPago (SDK Checkout Pro)</span>: Permite PSE, Tarjeta de Crédito, Efecty. Puedes abrir un modal directamente sobre la ruleta.
                    </li>
                    <li>
                      <span className="font-bold font-mono">Wompi (Widget de Payco / Grupo Bancolombia)</span>: Espectacular para cobros rápidos con un simple script HTML embebido.
                    </li>
                    <li>
                      <span className="font-bold">Pasarela por WhatsApp Instantánea</span>: Enlace de pago automático generado que reenvía el comprobante pre-llenado a tu número asignado.
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[9px] text-stone-450 font-mono font-bold uppercase mb-1">ID CLIENTE MER_PAGO</label>
                    <input
                      type="text"
                      placeholder="TEST-c4a03df1-..."
                      className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-[11px] text-stone-900 focus:outline-none focus:border-amber-500 w-full font-mono"
                      defaultValue={localStorage.getItem("beauty_mp_key") || ""}
                      onChange={(e) => localStorage.setItem("beauty_mp_key", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-450 font-mono font-bold uppercase mb-1">WHATSAPP ASESOR</label>
                    <input
                      type="text"
                      placeholder="+573001234567"
                      className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-[11px] text-stone-900 focus:outline-none focus:border-amber-500 w-full font-mono"
                      defaultValue={localStorage.getItem("beauty_wh_num") || "+573001234567"}
                      onChange={(e) => localStorage.setItem("beauty_wh_num", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECZIONE 3: SQL SCHEMA - COPY & PASTE FOR SUPABASE */}
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-md space-y-3.5 border border-stone-800">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Check className="w-4.5 h-4.5 text-emerald-500" />
                <div>
                  <h4 className="text-xs font-bold font-mono text-emerald-400">SUPABASE_TABLAS_SCHEMA.SQL</h4>
                  <p className="text-[10px] text-stone-450">Copia y pega este script SQL en el editor de Supabase (SQL Editor) para habilitar las tablas</p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`-- 1. Crear tabla de Productos
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  reference_price DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- 2. Crear tabla de Combos / Kits de Premios
CREATE TABLE public.kits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  valor_comercial DOUBLE PRECISION NOT NULL DEFAULT 0,
  precio_reclamar DOUBLE PRECISION NOT NULL DEFAULT 0,
  probabilidad INT NOT NULL DEFAULT 10,
  stock INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_jackpot BOOLEAN NOT NULL DEFAULT FALSE,
  product_relations JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 3. Crear tabla de Giros de la Ruleta (Records)
CREATE TABLE public.spin_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  kit_id TEXT NOT NULL,
  kit_name TEXT NOT NULL,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_jackpot BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Crear tabla de Órdenes de Envío / Pedidos
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  kit_id TEXT NOT NULL,
  kit_name TEXT NOT NULL,
  kit_image TEXT,
  amount_paid DOUBLE PRECISION NOT NULL DEFAULT 0,
  shipping_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  tracking_number TEXT
);`);
                  showToast("¡Código SQL copiado con éxito! Ahora puedes pegarlo en el editor de Supabase.", "success");
                }}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[9px] uppercase font-bold tracking-wider rounded-lg px-2.5 py-1.5 transition active:scale-95"
              >
                Copiar SQL 📋
              </button>
            </div>

            <pre className="text-[10.5px] font-mono bg-stone-950 p-4 rounded-xl text-stone-300 overflow-x-auto max-h-56 leading-relaxed select-all">
{`-- 1. Crear tabla de Productos
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  cost DOUBLE PRECISION NOT NULL DEFAULT 0,
  reference_price DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- 2. Crear tabla de Combos / Kits de Premios
CREATE TABLE public.kits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  valor_comercial DOUBLE PRECISION NOT NULL DEFAULT 0,
  precio_reclamar DOUBLE PRECISION NOT NULL DEFAULT 0,
  probabilidad INT NOT NULL DEFAULT 10,
  stock INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_jackpot BOOLEAN NOT NULL DEFAULT FALSE,
  product_relations JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 3. Crear tabla de Giros de la Ruleta (Records)
CREATE TABLE public.spin_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  kit_id TEXT NOT NULL,
  kit_name TEXT NOT NULL,
  won_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_jackpot BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Crear tabla de Órdenes de Envío / Pedidos
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_full_name TEXT NOT NULL,
  kit_id TEXT NOT NULL,
  kit_name TEXT NOT NULL,
  kit_image TEXT,
  amount_paid DOUBLE PRECISION NOT NULL DEFAULT 0,
  shipping_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  tracking_number TEXT
);`}
            </pre>
          </div>

          {/* SECZIONE 4: HOSTINGER DEPLOY CHECKLIST */}
          <div className="bg-rose-50/50 border border-rose-150 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-rose-800">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Pasos Críticos de Despliegue (Hostinger & GitHub Pages)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4.5 rounded-xl border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center text-[11px] mb-2.5">1</span>
                <span className="font-bold text-stone-900 block mb-1">Sube tu Código a GitHub</span>
                <span className="text-stone-550 leading-relaxed text-[11px] block">
                  Crea un repositorio en GitHub. Recuerda ignorar <code className="bg-stone-105 px-1 py-0.5 rounded text-[10px]">node_modules/</code> y <code className="bg-stone-105 px-1 py-0.5 rounded text-[10px]">dist/</code> en el archivo <code className="bg-stone-105 px-1 py-0.5 rounded text-[10px]">.gitignore</code> para mantener el repositorio limpio y liviano.
                </span>
              </div>

              <div className="bg-white p-4.5 rounded-xl border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center text-[11px] mb-2.5">2</span>
                <span className="font-bold text-stone-900 block mb-1">Compila el Proyecto</span>
                <span className="text-stone-550 leading-relaxed text-[11px] block">
                  Ejecuta localmente <code className="bg-stone-105 px-1 py-0.5 rounded text-[10px] font-mono">npm run build</code>. Esto ejecuta Vite y genera los archivos HTML estáticos comprimidos en la carpeta <code className="bg-rose-50 text-rose-700 px-1 py-0.5 rounded text-[10px] font-mono font-bold">/dist</code> listos para producción.
                </span>
              </div>

              <div className="bg-white p-4.5 rounded-xl border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center text-[11px] mb-2.5">3</span>
                <span className="font-bold text-stone-900 block mb-1">Hostinger File Manager</span>
                <span className="text-stone-550 leading-relaxed text-[11px] block">
                  Abre tu cPanel o hPanel en Hostinger. Entra al <span className="font-bold">Administrador de Archivos</span>, navega hasta la carpeta <code className="bg-stone-105 px-1 py-0.5.5 rounded text-[10px] font-mono">public_html/</code> de tu dominio, y copia/arrastra TODO el contenido de tu carpeta <code className="bg-stone-105 px-1 py-0.5 rounded text-[10px] font-mono font-bold">dist/</code> allí.
                </span>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4 text-[11.5px] leading-relaxed text-stone-700 space-y-2">
              <span className="font-bold text-stone-900 block">💡 Nota de Rutas en Hostinger (Fácil y sin fallas):</span>
              <p>
                Dado que esta aplicación está estructurada 100% como un SPA en una sola página dinámica autoejecutable sin rutas complejas que busquen subdirectorios en el servidor Apache, <span className="text-emerald-700 font-bold">¡no se romperá ni dará errores 404 al refrescar la página!</span> Se cargará infinitamente rápido en tu hosting compartido. Todo el estado inicial se simula fluidamente en memoria y se guarda localmente hasta conectar Supabase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CRUD DIALOG MODAL ON INGREDIENT/PRODUCT STOCK FORM */}
      {showProductModal && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <form onSubmit={handleProductSubmit} className="bg-white border border-stone-200 p-6 rounded-3xl w-full max-w-sm space-y-4 my-auto relative text-left">
            <h3 className="text-sm font-extrabold text-[#111111] mb-2">{editingProduct ? "Editar Insumo de Bodega" : "Ingresar Nuevo Cosmético Insumo"}</h3>
            
            <div>
              <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">SKU Barra Identificadora</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">Nombre Comercial</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">Costo Bodega (COP)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={productForm.cost}
                  onChange={(e) => setProductForm({ ...productForm, cost: Number(e.target.value) })}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-905 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">PVP de Referencia (COP)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={productForm.referencePrice}
                  onChange={(e) => setProductForm({ ...productForm, referencePrice: Number(e.target.value) })}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-905 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">Unidades Disponibles (Stock)</label>
              <input
                type="number"
                min={0}
                required
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-905 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
              />
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
                className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs text-stone-605 font-medium transition cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[11px] font-bold uppercase rounded-xl transition cursor-pointer text-center"
              >
                Guardar Cosmético
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CRUD DIALOG MODAL ON BEAUTY KIT CREATING/EDITING FORM */}
      {showKitModal && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <form onSubmit={handleKitSubmit} className="bg-white border border-stone-200 p-6 rounded-3xl w-full max-w-lg space-y-4 my-8 relative text-left">
            <h3 className="text-sm font-extrabold text-[#111111] mb-2">{editingKit ? "Modificar Combo Kit" : "Crear Nueva Combinación Kit"}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">Nombre del Kit (*)</label>
                <input
                  type="text"
                  required
                  value={kitForm.name}
                  onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })}
                  placeholder="Por ejemplo: Kit Glowing Skin"
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full font-bold"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">Imagen URL Ilustrativa</label>
                <input
                  type="text"
                  required
                  value={kitForm.image}
                  onChange={(e) => setKitForm({ ...kitForm, image: e.target.value })}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">Descripción Comercial (*)</label>
              <textarea
                required
                value={kitForm.description}
                onChange={(e) => setKitForm({ ...kitForm, description: e.target.value })}
                placeholder="Rellena detalles comerciales..."
                rows={2}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-0.5">Valor de Mercado</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={kitForm.valorComercial}
                  onChange={(e) => setKitForm({ ...kitForm, valorComercial: Number(e.target.value) })}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-0.5">Tasa Reclamo (COP)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={kitForm.precioReclamar}
                  onChange={(e) => setKitForm({ ...kitForm, precioReclamar: Number(e.target.value) })}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-0.5">Probab Peso (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={kitForm.probabilidad}
                  onChange={(e) => setKitForm({ ...kitForm, probabilidad: Number(e.target.value) })}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-0.5">Stock de Cajas Sorteables</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={kitForm.stock}
                  onChange={(e) => setKitForm({ ...kitForm, stock: Number(e.target.value) })}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-rose-500 w-full font-mono font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="jackpot-chk"
                  checked={kitForm.isJackpot}
                  onChange={(e) => setKitForm({ ...kitForm, isJackpot: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <label htmlFor="jackpot-chk" className="text-xs text-stone-900 font-black cursor-pointer select-none">🚨 Forzar Súper Jackpot</label>
              </div>
            </div>

            {/* Insumos selection check-list mapping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">1. Elegir productos cosméticos de pozo:</label>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 h-32 overflow-y-auto space-y-1">
                  {products.map(p => {
                    const isRelated = kitForm.productRelations.some(r => r.productId === p.id);
                    return (
                      <div key={p.id} className="flex justify-between items-center bg-white border border-stone-200 p-1 rounded-md text-[10.5px]">
                        <span className="font-semibold text-stone-700 truncate pr-1">{p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleKitRelation(p.id)}
                          className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${isRelated ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-stone-105 hover:bg-stone-200 border border-stone-300"}`}
                        >
                          {isRelated ? "Quitar" : "Agregar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] text-stone-500 font-mono font-bold uppercase mb-1">2. Definir cantidades a canjear:</label>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 h-32 overflow-y-auto space-y-1.5 text-[11px]">
                  {kitForm.productRelations.length === 0 ? (
                    <p className="text-stone-400 italic text-center pt-6">Elegir primero cosméticos a la izquierda.</p>
                  ) : (
                    kitForm.productRelations.map(rel => {
                      const matchedP = products.find(p => p.id === rel.productId);
                      return matchedP ? (
                        <div key={rel.productId} className="flex justify-between items-center bg-white p-1 px-2 rounded-md border border-[#E9E9E9] text-[10.5px]">
                          <span className="font-semibold text-stone-700 truncate pr-1">{matchedP.name}</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={rel.quantity}
                            onChange={(e) => handleUpdateKitRelationQty(rel.productId, Number(e.target.value))}
                            className="w-8 bg-stone-50 border border-stone-200 rounded p-0.5 text-center text-[10px] font-bold font-mono"
                          />
                        </div>
                      ) : null;
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => { setShowKitModal(false); setEditingKit(null); }}
                className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs text-stone-605 font-medium transition cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[11px] font-bold uppercase rounded-xl transition cursor-pointer text-center"
              >
                {editingKit ? "Guardar Cambios" : "Verificar y Crear Kit"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
