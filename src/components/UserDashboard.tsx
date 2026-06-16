/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, SpinResult, Order, Coupon, Kit, SystemSettings, Product } from "../types";
import { Coins, Sparkles, ShoppingBag, Clock, ShieldCheck, Ticket, UserCheck, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Truck, Trophy } from "lucide-react";

interface UserDashboardProps {
  currentUser: User;
  systemSettings: SystemSettings;
  activePrizes: SpinResult[];
  orders: Order[];
  coupons: Coupon[];
  onAddCoins: (coins: number, amountPaidCop: number) => void;
  onApplyCoupon: (code: string) => Coupon | string; // returns coupon if valid, or string error
  onClaimPrize: (prize: SpinResult, finalPrice: number, couponUsed?: string) => void;
  onFastForwardTimer: (prizeId: string) => void; // debug helper
  products: Product[];
  kits: Kit[];
}

// VIP levels details (re-styled into high-contrast clean badges)
const VIP_TIERS = {
  Bronce: { badge: "bg-stone-100 text-stone-700 border-stone-200.font-medium", nextMin: 200000, nextName: "Plata", perk: "Acceso estándar y ofertas básicas de bienvenida." },
  Plata: { badge: "bg-slate-50 text-slate-700 border-slate-200 font-bold", nextMin: 600000, nextName: "Oro", perk: "+10% de probabilidad mejorada de kits raros." },
  Oro: { badge: "bg-amber-50 text-amber-800 border-amber-200 font-bold", nextMin: 1200000, nextName: "Diamante", perk: "20% dto. en costos de despacho + soporte prioritario." },
  Diamante: { badge: "bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse", nextMin: Infinity, nextName: "", perk: "Envíos GRATIS de por vida + Kits y Máquina Exclusiva." }
};

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  systemSettings,
  activePrizes,
  orders,
  coupons,
  onAddCoins,
  onApplyCoupon,
  onClaimPrize,
  onFastForwardTimer,
  products,
  kits
}) => {
  const [activeTab, setActiveTab] = useState<"shop" | "prizes" | "orders" | "vip">("shop");
  
  // Coin shop state
  const [selectedCoinsPack, setSelectedCoinsPack] = useState<number>(3); // default 3
  const [paymentMethod, setPaymentMethod] = useState<string>("wompi");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Claim checkouts state
  const [selectedPrizeForClaim, setSelectedPrizeForClaim] = useState<SpinResult | null>(null);
  const [claimCouponCode, setClaimCouponCode] = useState<string>("");
  const [appliedClaimCoupon, setAppliedClaimCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessingClaim, setIsProcessingClaim] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  
  // General coupon redeem
  const [genericCouponCode, setGenericCouponCode] = useState<string>("");
  const [genericCouponMsg, setGenericCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Shipping address custom input for claim
  const [customShippingAddress, setCustomShippingAddress] = useState<string>(currentUser.address || "");

  // Sync address changes
  useEffect(() => {
    if (currentUser) {
      setCustomShippingAddress(currentUser.address || "");
    }
  }, [currentUser]);

  // Time remaining update tick
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter user orders
  const userOrders = orders.filter(o => o.userId === currentUser.id);

  // Calculate pack price based on coinPriceCop
  const getPackPrice = (coins: number) => {
    const base = coins * systemSettings.coinPriceCop;
    if (coins === 3) return base * 0.9; // 10% discount
    if (coins === 5) return base * 0.8; // 20% discount
    if (coins === 10) return base * 0.75; // 25% discount
    return base;
  };

  const handleBuyCoinsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setPaymentSuccess(false);

    // Simulate payment response
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      const coinsToAdd = selectedCoinsPack;
      const pricePaid = getPackPrice(coinsToAdd);
      onAddCoins(coinsToAdd, pricePaid);

      // Reset success message after 4s
      setTimeout(() => setPaymentSuccess(false), 4000);
    }, 2050);
  };

  const handleApplyCouponInClaim = () => {
    setCouponError(null);
    if (!claimCouponCode.trim()) return;

    const res = onApplyCoupon(claimCouponCode.trim());
    if (typeof res === "string") {
      setCouponError(res);
      setAppliedClaimCoupon(null);
    } else {
      if (res.type === "coin_gratis") {
        setCouponError("Este cupón otorga una Coin gratis, debes redimirlo en el menú de Coins, no aquí.");
        setAppliedClaimCoupon(null);
      } else {
        setAppliedClaimCoupon(res);
      }
    }
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrizeForClaim) return;

    setIsProcessingClaim(true);
    setClaimSuccess(false);

    setTimeout(() => {
      setIsProcessingClaim(false);
      setClaimSuccess(true);

      const discountPrice = getFinalClaimPrice(selectedPrizeForClaim);
      
      // Patch shipping address temporarily inside user copy if custom address was written
      const targetAddress = customShippingAddress.trim() || currentUser.address || "Bogotá, Colombia";

      // Execute main core handler from props
      onClaimPrize(
        selectedPrizeForClaim, 
        discountPrice + systemSettings.shippingCostCop, 
        appliedClaimCoupon ? appliedClaimCoupon.code : undefined
      );

      // Reset
      setTimeout(() => {
        setClaimSuccess(false);
        setSelectedPrizeForClaim(null);
        setAppliedClaimCoupon(null);
        setClaimCouponCode("");
      }, 3000);
    }, 2200);
  };

  const handleGenericCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenericCouponMsg(null);
    const codeObj = genericCouponCode.trim();
    if (!codeObj) return;

    const res = onApplyCoupon(codeObj);
    if (typeof res === "string") {
      setGenericCouponMsg({ text: res, isError: true });
    } else {
      if (res.type === "coin_gratis") {
        onAddCoins(1, 0); // Free coin!
        setGenericCouponMsg({ text: `¡Cupón Redimido! Se ha añadido 1 Coin GRATIS a tu balance.`, isError: false });
      } else {
        setGenericCouponMsg({ text: `Cupón '${res.code}' activado con éxito. Obtén ${res.value}${res.type === "porcentaje" ? "%" : " COP"} de descuento al reclamar tus kits.`, isError: false });
      }
      setGenericCouponCode("");
    }
  };

  const getFinalClaimPrice = (prize: SpinResult) => {
    let final = prize.precioReclamar;
    if (appliedClaimCoupon) {
      if (appliedClaimCoupon.type === "porcentaje") {
        final = final * (1 - appliedClaimCoupon.value / 100);
      } else if (appliedClaimCoupon.type === "valor_fijo") {
        final = Math.max(0, final - appliedClaimCoupon.value);
      }
    }
    return Math.round(final);
  };

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(num);
  };

  // Calculate VIP Progress details
  const tierMin = currentUser.totalSpent;
  const currentTier = VIP_TIERS[currentUser.vipLevel] || VIP_TIERS.Bronce;
  const nextMin = currentTier.nextMin;
  const progressRatio = nextMin === Infinity ? 100 : (tierMin / nextMin) * 100;
  const neededCop = nextMin === Infinity ? 0 : nextMin - tierMin;

  return (
    <div id="user-dashboard-wrapper" className="bg-white border border-stone-200/80 rounded-[30px] p-4 sm:p-6 md:p-8 shadow-[0_12px_30px_rgba(27,25,23,0.03)] relative overflow-hidden text-stone-850">
      
      {/* Top Welcome Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-stone-50 p-5 rounded-2xl border border-stone-200 mb-6">
        <div>
          <span className="text-rose-600 text-[10px] font-mono tracking-widest block uppercase font-extrabold mb-1">
            TABLERO DE CLIENTE EXCLUSIVO
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 id="user-full-name-display" className="text-lg font-extrabold text-stone-900 font-sans tracking-tight">{currentUser.fullName}</h2>
            <span className={`text-[9.5px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-mono font-bold ${currentTier.badge}`}>
              U. VIP {currentUser.vipLevel}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">{currentUser.email} • {currentUser.phone || "Sin teléfono"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 w-full lg:w-auto">
          <div className="bg-white border border-stone-200 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <Coins className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-[9px] text-stone-550 font-mono tracking-wider font-extrabold text-left">COINS DISPONIBLES</div>
              <div id="dashboard-coins-counter" className="text-base font-black text-stone-900 font-mono text-left">{currentUser.coinsAvailable}</div>
            </div>
          </div>
          <div className="bg-white border border-stone-200 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <ShoppingBag className="h-5 w-5 text-rose-500 shrink-0" />
            <div>
              <div className="text-[9px] text-stone-550 font-mono tracking-wider font-extrabold text-left">ACUMULADO TOTAL</div>
              <div className="text-xs font-black text-stone-905 text-left">{formatCOP(currentUser.totalSpent)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-stone-200 mb-6 font-sans overflow-x-auto pb-px scrollbar-none scroll-smooth">
        <button
          onClick={() => setActiveTab("shop")}
          className={`flex items-center gap-2 px-4.5 py-3 text-xs tracking-wider transition font-extrabold cursor-pointer border-b-2 uppercase whitespace-nowrap shrink-0 ${
            activeTab === "shop"
              ? "text-rose-600 border-rose-600"
              : "text-stone-500 border-transparent hover:text-stone-850"
          }`}
        >
          <Coins className="h-4 w-4 text-stone-450" />
          Comprar Coins
        </button>
        <button
          onClick={() => setActiveTab("prizes")}
          className={`flex items-center gap-2 px-4.5 py-3 text-xs tracking-wider transition font-extrabold cursor-pointer border-b-2 uppercase relative whitespace-nowrap shrink-0 ${
            activeTab === "prizes"
              ? "text-rose-600 border-rose-600"
              : "text-stone-500 border-transparent hover:text-stone-850"
          }`}
        >
          <Clock className="h-4 w-4 text-stone-450" />
          Premios Ganados
          {activePrizes.filter(p => p.status === "Won" && new Date(p.expiresAt).getTime() > now).length > 0 && (
            <span className="absolute top-2 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4.5 py-3 text-xs tracking-wider transition font-extrabold cursor-pointer border-b-2 uppercase whitespace-nowrap shrink-0 ${
            activeTab === "orders"
              ? "text-rose-600 border-rose-600"
              : "text-stone-500 border-transparent hover:text-stone-850"
          }`}
        >
          <Truck className="h-4 w-4 text-stone-450" />
          Mis Envíos ({userOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("vip")}
          className={`flex items-center gap-2 px-4.5 py-3 text-xs tracking-wider transition font-extrabold cursor-pointer border-b-2 uppercase whitespace-nowrap shrink-0 ${
            activeTab === "vip"
              ? "text-rose-600 border-rose-600"
              : "text-stone-500 border-transparent hover:text-stone-850"
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-stone-450" />
          VIP Club
        </button>
      </div>

      {/* Tabs Content */}
      <div className="mt-4">
        
        {/* TAB 1: COINS SHOP */}
        {activeTab === "shop" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h3 className="text-sm font-extrabold text-stone-900 mb-4 flex items-center gap-1.5 text-left">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Adquiere paquetes de Coins
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { coins: 1, tag: "Acceso Básico", disc: "Costo estándar", popular: false },
                  { coins: 3, tag: "Recomendado", disc: "10% de Descuento", popular: true },
                  { coins: 5, tag: "Súper Valor", disc: "20% de Descuento", popular: false },
                  { coins: 10, tag: "Master Spin", disc: "25% de Descuento", popular: false }
                ].map(pack => {
                  const basePrice = pack.coins * systemSettings.coinPriceCop;
                  const finalPrice = getPackPrice(pack.coins);
                  const isSelected = selectedCoinsPack === pack.coins;

                  return (
                    <div
                      key={pack.coins}
                      onClick={() => setSelectedCoinsPack(pack.coins)}
                      className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between relative overflow-hidden ${
                        isSelected
                          ? "bg-stone-50/50 border-rose-600 ring-1 ring-rose-500/25 shadow-xs"
                          : "bg-white border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {pack.popular && (
                        <span className="absolute top-0 right-0 bg-rose-600 text-white text-[8.5px] font-black uppercase px-2 py-0.5 rounded-bl font-mono tracking-wide">
                          PROMO
                        </span>
                      )}

                      <div>
                        <span className={`text-[9px] uppercase font-mono tracking-wider font-extrabold ${isSelected ? "text-rose-600" : "text-stone-455"}`}>
                          {pack.tag}
                        </span>
                        <h4 className="text-lg font-black text-stone-900 mt-1 flex items-center gap-1.5 font-sans">
                          {pack.coins} {pack.coins === 1 ? "Coin" : "Coins"}
                        </h4>
                        <span className="text-[11px] text-stone-550 mt-0.5 block font-medium">{pack.disc}</span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-150 flex items-baseline justify-between gap-1">
                        {pack.coins > 1 && (
                          <span className="text-[11px] text-stone-400 line-through mr-1 font-semibold">{formatCOP(basePrice)}</span>
                        )}
                        <span className="text-xs font-mono font-bold text-stone-900">{formatCOP(finalPrice)} COP</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Checkout Simulator Form */}
              <form onSubmit={handleBuyCoinsSubmit} className="mt-5 p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50">
                <h4 className="text-[9.5px] font-extrabold font-mono tracking-widest text-stone-500 uppercase mb-4 text-left">
                  MÉTODO DE AUTORIZACIÓN (SIMULADOR DE PASARELA)
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { id: "wompi", label: "Wompi", desc: "Bancolombia, Nequi" },
                    { id: "mercadopago", label: "Mercado Pago", desc: "PSE, Tarjeta" },
                    { id: "bold", label: "Bold", desc: "PSE, Tarjeta" },
                    { id: "paypal", label: "PayPal", desc: "Internacional" }
                  ].map(method => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-center select-none transition ${
                        paymentMethod === method.id
                          ? "bg-white border-rose-600 text-rose-700 font-bold shadow-xs ring-1 ring-rose-500/20"
                          : "bg-white border-stone-200 text-stone-500 hover:text-stone-850"
                      }`}
                    >
                      <span className="text-xs block font-extrabold tracking-wide">{method.label}</span>
                      <span className="text-[9px] text-stone-450 block mt-0.5">{method.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-stone-200/80 pt-4">
                  <div className="text-xs text-stone-550 text-left">
                    Monto total a transferir COP: 
                    <strong className="text-md sm:text-lg text-stone-900 block mt-0.5 font-bold font-mono">
                      {formatCOP(getPackPrice(selectedCoinsPack))} COP
                    </strong>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full sm:w-auto py-3 px-6 bg-stone-900 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-97"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-stone-400 border-t-white"></div>
                        <span>AUTORIZANDO PAGO...</span>
                      </>
                    ) : (
                      <>
                        <span>PAGAR CON {paymentMethod.toUpperCase()}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {paymentSuccess && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl text-xs flex items-center gap-2 text-left shadow-2xs font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>¡Pago de demostración aprobado! Se agregaron <b>{selectedCoinsPack} Coins</b> a tu balance. ¡Listo para el próximo giro!</span>
                  </div>
                )}
              </form>
            </div>

            {/* Loyalty / Promotions Sidebar */}
            <div className="border border-stone-200 p-5 rounded-2xl flex flex-col justify-between bg-white text-left">
              <div>
                <h4 className="text-[10px] font-extrabold font-mono tracking-widest text-stone-500 uppercase mb-4 flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-rose-500" />
                  CUPONES PROMOCIONALES
                </h4>

                <form onSubmit={handleGenericCouponSubmit} className="flex gap-2.5">
                  <input
                    type="text"
                    value={genericCouponCode}
                    onChange={(e) => setGenericCouponCode(e.target.value)}
                    placeholder="Escribe el código..."
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-500 grow"
                  />
                  <button
                    type="submit"
                    className="bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0 cursor-pointer hover:bg-rose-700 shadow-2xs"
                  >
                    Aplicar
                  </button>
                </form>

                {genericCouponMsg && (
                  <div className={`mt-3 p-2.5 rounded-xl text-[11px] border font-medium text-left ${
                    genericCouponMsg.isError 
                      ? "bg-red-50 border-red-150 text-red-700" 
                      : "bg-emerald-50 border-emerald-150 text-emerald-700"
                  }`}>
                    {genericCouponMsg.text}
                  </div>
                )}

                <div className="mt-5 border-t border-stone-200/80 pt-4 space-y-3">
                  <h5 className="text-[9.5px] font-mono tracking-widest font-extrabold text-stone-500 uppercase">Lista de Códigos MVP:</h5>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-rose-600">WELCOMEBS</span>
                      <p className="text-[10px] text-stone-500 mt-0.5">Descuento de $15.000 COP en envíos</p>
                    </div>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-[#EBEBEB] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-rose-600">FREECOIN</span>
                      <p className="text-[10px] text-stone-500 mt-0.5">Otorga 1 Giro Gratis sin costo</p>
                    </div>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-rose-600">BEAUTYSPIN20</span>
                      <p className="text-[10px] text-stone-500 mt-0.5">20% descuento en tasas de canje</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 text-[10px] text-stone-500 mt-5 font-mono">
                ⚠️ Transacciones de demostración para testeo del MVP en Colombia.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WON PRIZES LIST */}
        {activeTab === "prizes" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 text-left gap-2">
              <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-rose-500" />
                Premios disponibles para reclamar
              </h3>
              <p className="text-xs text-stone-500">Recuerda completar el envío antes de que expire el tiempo.</p>
            </div>

            {activePrizes.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
                <Trophy className="h-10 w-10 text-stone-300 mx-auto mb-2 opacity-80" />
                <p className="text-stone-605 text-sm font-bold">Sin canjes disponibles</p>
                <p className="text-stone-500 text-xs mt-1">Gira el casino tragamonedas de arriba para ver combinaciones ganadas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePrizes.map(prize => {
                  const expireTime = new Date(prize.expiresAt).getTime();
                  const remainingMs = expireTime - now;
                  const isExpired = remainingMs <= 0 || prize.status === "Expired";
                  const isClaimed = prize.status === "Claimed";

                  // Convert remaining to formatted text
                  let timerStr = "00:00:00";
                  if (remainingMs > 0 && !isClaimed) {
                    const totalSecs = Math.floor(remainingMs / 1000);
                    const hours = Math.floor(totalSecs / 3600);
                    const mins = Math.floor((totalSecs % 3600) / 60);
                    const secs = totalSecs % 60;
                    timerStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                  }

                  return (
                    <div
                      key={prize.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                        isExpired
                          ? "bg-stone-50/65 border-stone-200 saturate-50 text-stone-400"
                          : isClaimed
                          ? "bg-emerald-50/40 border-emerald-200 text-stone-705"
                          : "bg-white border-rose-200 shadow-2xs hover:border-rose-400"
                      }`}
                    >
                      <div className="flex items-center gap-4 w-full md:w-auto text-left">
                        <img
                          src={prize.kitImage}
                          alt={prize.kitName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-cover rounded-xl border border-stone-200 shrink-0 shadow-3xs"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug">{prize.kitName}</h4>
                            {isExpired && <span className="text-[8.5px] bg-red-50 text-red-655 border border-red-100 font-mono px-2 py-0.5 rounded font-extrabold">EXPIRADO</span>}
                            {isClaimed && <span className="text-[8.5px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono px-2 py-0.5 rounded font-extrabold">RECLAMADO</span>}
                          </div>

                          <div className="flex items-center gap-3.5 mt-2 text-xs flex-wrap">
                            <span className="text-stone-500">
                              Valor Comercial: <strong className="text-stone-400 line-through font-medium">{formatCOP(prize.valorComercial)}</strong>
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              Canje Winner: <strong className="text-emerald-800 text-sm font-extrabold">{formatCOP(prize.precioReclamar)} COP</strong>
                            </span>
                          </div>

                          {/* Sub-products included inside the kit */}
                          {(() => {
                            const correspondingKit = kits?.find(k => k.id === prize.kitId);
                            if (!correspondingKit) return null;
                            return (
                              <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                                <span className="text-[9.5px] text-rose-600 font-mono tracking-widest font-extrabold uppercase mr-1">KIT INCLUYE:</span>
                                {correspondingKit.productRelations.map(rel => {
                                  const p = products?.find(prod => prod.id === rel.productId);
                                  return p ? (
                                    <span key={rel.productId} className="text-[10px] bg-stone-50 border border-stone-200 text-stone-700 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                                      <span className="text-rose-600 font-bold">{rel.quantity}x</span>
                                      {p.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full md:w-auto justify-end shrink-0">
                        
                        {/* Countdown block */}
                        {!isClaimed && !isExpired && (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl shrink-0 w-full sm:w-auto justify-center">
                            <Clock className="h-4 w-4 text-rose-600 animate-pulse" />
                            <div className="text-left">
                              <div className="text-[8.5px] text-rose-500 font-mono tracking-wider font-extrabold leading-none">RELEVO RESERVADO</div>
                              <div className="text-xs font-black font-mono text-rose-700 mt-0.5 leading-none">{timerStr}</div>
                            </div>
                          </div>
                        )}

                        {/* Fast forward timer button for developers */}
                        {!isClaimed && !isExpired && (
                          <button
                            title="Descuenta tiempo en bloques de 10 segs"
                            onClick={() => onFastForwardTimer(prize.id)}
                            className="text-[9px] text-stone-400 hover:text-stone-500 transition underline font-mono cursor-pointer"
                          >
                            [Acelerar]
                          </button>
                        )}

                        <div className="w-full sm:w-auto shrink-0 text-center sm:text-right">
                          {isExpired && (
                            <span className="text-xs text-stone-400 italic block text-center sm:text-right">El kit regresó al pozo principal.</span>
                          )}
                          {isClaimed && (
                            <span className="text-xs text-emerald-650 flex items-center justify-center sm:justify-end gap-1 font-bold">
                              <CheckCircle2 className="h-4 w-4 text-emerald-650 shrink-0" /> Despachado con Factura
                            </span>
                          )}
                          {!isClaimed && !isExpired && (
                            <button
                              id={`btn-claim-${prize.id}`}
                              onClick={() => {
                                setSelectedPrizeForClaim(prize);
                                setAppliedClaimCoupon(null);
                                setClaimCouponCode("");
                              }}
                              className="w-full sm:w-auto py-2.5 px-4.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition cursor-pointer shadow-2xs text-center font-mono tracking-wider inline-block"
                            >
                              COMPRAR / ENVIAR YA
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USER ORDERS */}
        {activeTab === "orders" && (
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 mb-4 flex items-center gap-1.5 text-left">
              <ShoppingBag className="h-4 w-4 text-rose-500" />
              Guías de Envío y Despachos Activos
            </h3>

            {userOrders.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-2xl border border-stone-200">
                <ShoppingBag className="h-10 w-10 text-stone-300 mx-auto mb-2 opacity-80" />
                <p className="text-stone-500 text-sm font-semibold">No se registran despachos históricos.</p>
                <p className="text-stone-450 text-xs mt-1">Saca combinaciones en las tragamonedas para desbloquear el canje.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map(order => (
                  <div key={order.id} className="bg-white border border-stone-200 p-4 rounded-xl text-left shadow-2xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-stone-150 pb-3 mb-3 gap-2">
                      <div>
                        <span className="text-[9px] text-stone-450 font-mono tracking-wider block font-bold uppercase">NÚMERO DE ENVÍO RECLAMACIÓN</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-stone-900 font-sans text-sm">{order.orderNumber}</strong>
                          <span className="text-[11px] text-stone-450 font-sans">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {order.status === "Pending" && <span className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[11px] px-2.5 py-1 rounded-full font-bold">Pago Pendiente</span>}
                        {order.status === "Paid" && <span className="bg-sky-50 border border-sky-200 text-sky-800 text-[11px] px-2.5 py-1 rounded-full font-bold">Preparando Despacho</span>}
                        {order.status === "Shipped" && <span className="bg-purple-50 border border-purple-200 text-purple-800 text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">En Camino (Servientrega)</span>}
                        {order.status === "Delivered" && <span className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">Entregado</span>}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex gap-3 items-center text-left w-full sm:w-auto">
                        <img
                          src={order.kitImage}
                          alt={order.kitName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0"
                        />
                        <div className="text-left">
                          <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">{order.kitName}</h4>
                          {(() => {
                            const oKit = kits?.find(k => k.id === order.kitId);
                            if (oKit) {
                              return (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {oKit.productRelations.map(rel => {
                                    const p = products?.find(prod => prod.id === rel.productId);
                                    return p ? (
                                      <span key={rel.productId} className="text-[9.5px] text-stone-500 font-sans">
                                        {rel.quantity}x {p.name} •
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <span className="text-[11px] text-stone-500 block mt-1">
                            Precio Reclamo: <b>{formatCOP(order.amountPaid - systemSettings.shippingCostCop)} COP</b> (+ Despacho Asegurado)
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right text-xs shrink-0 bg-stone-50 p-2.5 rounded-xl border border-stone-150 w-full sm:w-auto">
                        <span className="text-stone-500 block text-[10px] uppercase font-mono tracking-wider font-semibold">Monto Total Facturado</span>
                        <strong className="text-stone-950 text-sm font-black font-mono">{formatCOP(order.amountPaid)} COP</strong>
                      </div>
                    </div>

                    <div className="mt-3.5 bg-stone-50 p-3 rounded-xl border border-stone-150 flex flex-col sm:flex-row justify-between gap-3 text-[11px] text-left">
                      <div className="text-left">
                        <span className="text-stone-500 font-bold block">Ubicación de Despacho:</span>
                        <span className="text-stone-700 block mt-0.5">{order.shippingAddress}</span>
                      </div>

                      {order.trackingNumber && (
                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-stone-500 font-bold block">Nº de Guía (Simulado):</span>
                          <span className="font-mono text-rose-600 font-extrabold bg-white border border-stone-200 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VIP LEVEL */}
        {activeTab === "vip" && (
          <div className="border border-stone-200 rounded-2xl p-5 bg-stone-50 text-left">
            <h3 className="text-sm font-extrabold text-stone-900 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />
              Club de Beneficios VIP
            </h3>
            <p className="text-xs text-stone-550 leading-relaxed max-w-2xl">
              Cada peso gastado en reclamaciones te ayuda a subir de rango. A medida que incrementas tu nivel VIP, reduces costos fijos de despacho y mejoras tus posibilidades de liberar kits de lujo.
            </p>

            {/* Progress indicator bar */}
            <div className="mt-6 bg-white border border-stone-200 p-5 rounded-xl">
              <div className="flex justify-between text-xs items-baseline font-mono mb-2">
                <span className="text-stone-500">Volumen acumulado: <b>{formatCOP(currentUser.totalSpent)} COP</b></span>
                {nextMin !== Infinity ? (
                  <span className="text-stone-550">Siguiente Rango {currentTier.nextName}: <b>{formatCOP(nextMin)} COP</b></span>
                ) : (
                  <span className="text-rose-600 font-bold font-mono">¡MÁXIMO NIVEL ALCANZADO!</span>
                )}
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200 shadow-inner">
                <div 
                  className="bg-rose-650 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressRatio}%` }}
                ></div>
              </div>

              {nextMin !== Infinity && (
                <p className="text-[11px] text-stone-500 mt-2 font-mono">
                  💡 Te falta gastar en canjes <strong>{formatCOP(neededCop)} COP</strong> adicionales para ascender de nivel a <b>VIP {currentTier.nextName}</b>.
                </p>
              )}
            </div>

            {/* Grid of VIP Tiers and Perks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {[
                { name: "Bronce", req: "$0 COP", limit: "$199.991 COP", perks: "Beneficios generales de bienvenida, tasa de descuento estandar.", slug: "Bronce" },
                { name: "Plata", req: "$200.000 COP", limit: "$599.991 COP", perks: "Hasta +10% de probabilidad mejorada de kits excepcionales.", slug: "Plata" },
                { name: "Oro", req: "$600.000 COP", limit: "$1.199.991 COP", perks: "20% descuento en tasas de despacho + asistencia prioritaria de canjes.", slug: "Oro" },
                { name: "Diamante", req: "$1.200.000 COP+", limit: "Ilimitado", perks: "Despachos y envíos totalmente GRATIS de por vida + Kits Jackpot.", slug: "Diamante" }
              ].map(tier => {
                const isCurrent = currentUser.vipLevel === tier.slug;
                return (
                  <div 
                    key={tier.name}
                    className={`p-4 rounded-xl border flex flex-col justify-between text-left ${
                      isCurrent 
                        ? "bg-white border-rose-450 ring-1 ring-rose-500/15 shadow-sm" 
                        : "bg-white border-stone-150 opacity-80"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                        <strong className="text-sm font-extrabold text-stone-900">VIP {tier.name}</strong>
                        {isCurrent && <span className="bg-rose-600 text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase font-mono tracking-wide">MI RANGO</span>}
                      </div>
                      <span className="text-[10px] text-stone-450 font-mono block">Rango: {tier.req}</span>
                      <p className="text-[11px] text-stone-550 mt-2 leading-relaxed font-sans">{tier.perks}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* SECURE CLAIM & SHIPPING FORM OVERLAY DIALOG */}
      {selectedPrizeForClaim && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white border border-stone-200 p-6 rounded-3xl w-full max-w-md shadow-2xl relative text-left">
            
            {/* Close button top right */}
            <button
              onClick={() => setSelectedPrizeForClaim(null)}
              className="absolute top-4.5 right-4.5 text-stone-400 hover:text-stone-700 font-bold w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs border border-stone-150 cursor-pointer"
            >
              ✕
            </button>

            <span className="text-rose-600 text-[10px] font-mono tracking-widest block uppercase font-extrabold mb-1">
              PROCESO DE RECLAMO MVP
            </span>
            <h3 className="text-md sm:text-lg font-extrabold text-stone-900 mb-3.5 flex items-center gap-1.5">
              <ShoppingBag className="h-5 w-5 text-rose-500" />
              Verificar Dirección de Despacho
            </h3>

            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-150 flex gap-3 items-center mb-4 text-xs">
              <img
                src={selectedPrizeForClaim.kitImage}
                alt={selectedPrizeForClaim.kitName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 object-cover rounded-lg border border-stone-200"
              />
              <div>
                <strong className="text-stone-900 block font-semibold">{selectedPrizeForClaim.kitName}</strong>
                <span className="text-[11px] text-emerald-700 font-bold font-mono">Tasa única canje: {formatCOP(selectedPrizeForClaim.precioReclamar)} COP</span>
              </div>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              {/* Shipping location customizable form */}
              <div>
                <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-wider uppercase mb-1.5">Ubicación física de Entrega (*)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customShippingAddress}
                    onChange={(e) => setCustomShippingAddress(e.target.value)}
                    placeholder="Calle 127 # 45 - 20, Bogotá"
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 w-full text-xs text-stone-900 focus:outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
                <span className="text-[9px] text-stone-450 block mt-1 leading-snug">Se validará ante las transportadoras de Servientrega y Coordinadora en tiempo de despacho real.</span>
              </div>

              {/* Coupon selector in claim */}
              <div>
                <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-wider uppercase mb-1.5">Cupón de canje de Kit</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={claimCouponCode}
                    onChange={(e) => setClaimCouponCode(e.target.value)}
                    placeholder="Escribe WELCOMEBS..."
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-900 grow focus:outline-none focus:border-rose-500 uppercase font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCouponInClaim}
                    className="bg-stone-900 hover:bg-stone-850 px-4 py-1.5 text-xs font-bold text-white rounded-xl transition cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] text-red-600 mt-1 font-medium">{couponError}</p>
                )}
                {appliedClaimCoupon && (
                  <p className="text-[10px] text-emerald-700 mt-1 font-bold">
                    ✓ Cupón aprobado: -{appliedClaimCoupon.value}{appliedClaimCoupon.type === "porcentaje" ? "%" : " COP"} de descuento.
                  </p>
                )}
              </div>

              {/* Invoicing detail list */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-150 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Valor de canje:</span>
                  <span className="font-mono text-stone-800">{formatCOP(selectedPrizeForClaim.precioReclamar)} COP</span>
                </div>
                {appliedClaimCoupon && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Descuento cupón:</span>
                    <span className="font-mono">-{formatCOP(selectedPrizeForClaim.precioReclamar - getFinalClaimPrice(selectedPrizeForClaim))} COP</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Logística Servientrega asegurada:</span>
                  <span className="font-mono text-stone-800">{formatCOP(systemSettings.shippingCostCop)} COP</span>
                </div>
                <div className="h-px bg-stone-200 my-1"></div>
                <div className="flex justify-between font-bold text-stone-900 sm:text-sm">
                  <span>Subtotal a Pagar:</span>
                  <span className="font-mono text-rose-600 font-extrabold">{formatCOP(getFinalClaimPrice(selectedPrizeForClaim) + systemSettings.shippingCostCop)} COP</span>
                </div>
              </div>

              {/* Submit triggers */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPrizeForClaim(null)}
                  className="flex-1 py-3 border border-stone-200 hover:bg-stone-100 rounded-xl text-xs text-stone-605 font-medium transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingClaim}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                >
                  {isProcessingClaim ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-rose-300 border-t-white"></div>
                      <span>ENVIANDO...</span>
                    </>
                  ) : (
                    "ORDENAR DESPACHO"
                  )}
                </button>
              </div>

              {claimSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-center gap-1.5 font-semibold text-center mt-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>¡Felicidades! Orden enviada a despachos. Tu guía se generará en la pestaña 'Mis Envíos'.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
