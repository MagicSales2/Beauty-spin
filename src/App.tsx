/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Product, Kit, User, Order, Coupon, SystemSettings, SpinResult, SpinRecord 
} from "./types";
import { 
  initialProducts, initialKits, initialUsers, initialCoupons, 
  initialOrders, initialSpinRecords, initialSystemSettings 
} from "./data/initialData";
import { SlotMachine } from "./components/SlotMachine";
import { UserDashboard } from "./components/UserDashboard";
import { AdminPanel } from "./components/AdminPanel";
import { casinoAudio } from "./utils/audio";
import { 
  Sparkles, Lock, ArrowLeftRight, HelpCircle, RefreshCw, LogIn, 
  UserPlus, Compass, Smile, Eye, ShoppingCart, UserCheck, Play, Award, Coins, Mail, User as UserIcon, MapPin, Phone, Trophy
} from "lucide-react";

// Map known products to specific beautiful high-end cosmetics images, categories and descriptions
export const PRODUCT_VISUAL_RESOURCES: Record<string, { image: string; category: string; description: string }> = {
  p1: { 
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80", 
    category: "Cuidado Facial", 
    description: "Bloqueador solar toque seco con FPS 50+ de amplio espectro. Máxima fotoprotección de textura fluida, rápida absorción, mate antibrillo." 
  },
  p2: { 
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80", 
    category: "Skin Care", 
    description: "Sérum rejuvenecedor con ácido hialurónico concentrado al 3% para calmar, rellenar líneas de expresión y devolver elasticidad natural." 
  },
  p3: { 
    image: "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=500&auto=format&fit=crop&q=80", 
    category: "Restauración", 
    description: "Nutrición intensa con base de ceramidas activas. Repara la barrera cutánea debilitada y retiene la hidratación profunda por 24 horas." 
  },
  p4: { 
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80", 
    category: "Tonificación", 
    description: "Bruma calmante de extracto destilado de pétalos naturales de rosas frescas. Balancea el pH y prepara el rostro para nutrirse." 
  },
  p5: { 
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80", 
    category: "Maquillaje", 
    description: "Labial mate líquido de tonalidad velvet de alta cobertura e intransferible. Enriquecido con vitaminas para evitar resequedad." 
  },
  p6: { 
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80", 
    category: "Paleta Ojos", 
    description: "Paleta ultra pigmentada de 12 sombras mate y satinadas inspiradas en el atardecer cálido. Difuminado ultrasuave garantizado." 
  },
  p7: { 
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80", 
    category: "Maquillaje de Ojos", 
    description: "Pestañina curva efecto volumen explosivo impermeable. Alarga cada pestaña desde la raíz sin dejar molesto grumos negros." 
  },
  p8: { 
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80", 
    category: "Desmaquillante", 
    description: "Agua micelar desmaquillante purificante que atrapa impurezas y maquillaje waterproof activo sin frotar ni causar irritaciones." 
  }
};

const STORAGE_KEY = "beauty_spin_state_v1";

export default function App() {
  // Global States loaded from storage or default seeds
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(initialSystemSettings);
  const [spinRecords, setSpinRecords] = useState<SpinRecord[]>([]);
  const [activePrizes, setActivePrizes] = useState<SpinResult[]>([]);
  
  // App navigation
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | "recover">("login");
  const [adminViewActive, setAdminViewActive] = useState<boolean>(false);
  const [shopperTab, setShopperTab] = useState<"roulette" | "account">("roulette");

  // Recovery Password demo responses
  const [recoveryEmail, setRecoveryEmail] = useState<string>("");
  const [recoverySent, setRecoverySent] = useState<boolean>(false);
  const [recoveryToken, setRecoveryToken] = useState<string>("");
  const [recoverySuccess, setRecoverySuccess] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");

  // Sparkles celebratory overlay when user wins
  const [wonOverlayKit, setWonOverlayKit] = useState<Kit | null>(null);
  const [isJackpotWin, setIsJackpotWin] = useState<boolean>(false);
  const [wonOverlayPrizeCost, setWonOverlayPrizeCost] = useState<number>(1);
  const [overlayCountdown, setOverlayCountdown] = useState<number>(1740); // 29 minutes in seconds

  // Authentication forms
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPass, setLoginPass] = useState<string>("");
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regAddress, setRegAddress] = useState<string>("");

  const formatCOP = (num: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset helper success toast
  const [showResetToast, setShowResetToast] = useState<boolean>(false);
  const [globalToast, setGlobalToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const triggerToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setGlobalToast({ text, type });
    setTimeout(() => {
      setGlobalToast(null);
    }, 4500);
  };

  // 1. BOOTLOAD STATE FROM LOCAL STORAGE
  useEffect(() => {
    const backupStorage = localStorage.getItem(STORAGE_KEY);
    if (backupStorage) {
      try {
        const parsed = JSON.parse(backupStorage);
        setProducts(parsed.products || initialProducts);
        setKits(parsed.kits || initialKits);
        setUsers(parsed.users || initialUsers);
        setOrders(parsed.orders || initialOrders);
        setCoupons(parsed.coupons || initialCoupons);
        setSystemSettings(parsed.systemSettings || initialSystemSettings);
        setSpinRecords(parsed.spinRecords || initialSpinRecords);
        setActivePrizes(parsed.activePrizes || []);
        
        // Auto-login standard Camila
        const defaultCamila = parsed.users ? parsed.users.find((u: any) => u.id === "u1") : null;
        if (defaultCamila) {
          setCurrentUser(defaultCamila);
        }
      } catch (err) {
        resetToInitialSeeds();
      }
    } else {
      resetToInitialSeeds();
    }
  }, []);

  // 2. SAVE STATE ACCESSIBLE MODIFIERS
  const saveStateToStorage = (
    prods: Product[],
    kts: Kit[],
    usrs: User[],
    ords: Order[],
    cps: Coupon[],
    sett: SystemSettings,
    recs: SpinRecord[],
    prizes: SpinResult[]
  ) => {
    const data = {
      products: prods,
      kits: kts,
      users: usrs,
      orders: ords,
      coupons: cps,
      systemSettings: sett,
      spinRecords: recs,
      activePrizes: prizes
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const resetToInitialSeeds = () => {
    setProducts(initialProducts);
    setKits(initialKits);
    setUsers(initialUsers);
    setOrders(initialOrders);
    setCoupons(initialCoupons);
    setSystemSettings(initialSystemSettings);
    setSpinRecords(initialSpinRecords);
    setActivePrizes([
      {
        id: "prize_initial",
        userId: "u1",
        kitId: "k1",
        kitName: "Kit Solar Premium",
        kitImage: "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=600&auto=format&fit=crop&q=80",
        wonAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // won 30 minutes ago
        expiresAt: new Date(Date.now() + 30 * 60 * 1050).toISOString(), // expires in 30 mins
        status: "Won",
        valorComercial: 80000,
        precioReclamar: 45000
      }
    ]);
    
    const adminUser = initialUsers.find(u => u.id === "u_admin") || initialUsers[0];
    setCurrentUser(initialUsers.find(u => u.id === "u1") || initialUsers[1]);
    setAdminViewActive(false);

    saveStateToStorage(
      initialProducts,
      initialKits,
      initialUsers,
      initialOrders,
      initialCoupons,
      initialSystemSettings,
      initialSpinRecords,
      [
        {
          id: "prize_initial",
          userId: "u1",
          kitId: "k1",
          kitName: "Kit Solar Premium",
          kitImage: "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=600&auto=format&fit=crop&q=80",
          wonAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: "Won",
          valorComercial: 80000,
          precioReclamar: 45000
        }
      ]
    );

    setShowResetToast(true);
    setTimeout(() => setShowResetToast(false), 3000);
  };
  
  // SUCCESS OVERLAY COUNTDOWN COUNTER (29 MINUTES FOR SUCCESS BANNER)
  useEffect(() => {
    if (!wonOverlayKit) return;
    setOverlayCountdown(1740); // Reset to 29 minutes (29 * 60 = 1740 seconds)
    const interval = setInterval(() => {
      setOverlayCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [wonOverlayKit]);

  // BACKGROUND TIMER EXPIRY GARBAGE COLLECTOR
  // Runs every 5 seconds to automatically expire tickets and return kit stock to system
  useEffect(() => {
    const timer = setInterval(() => {
      const nowMs = Date.now();
      let stateChanged = false;

      const updatedPrizes = activePrizes.map(prize => {
        if (prize.status === "Won" && new Date(prize.expiresAt).getTime() <= nowMs) {
          stateChanged = true;
          
          // RECOVER stock for the kit and individual products
          const kitToRestore = kits.find(k => k.id === prize.kitId);
          if (kitToRestore) {
            // Restore kit stock
            kitToRestore.stock += 1;
            
            // Restore contained product stocks
            kitToRestore.productRelations.forEach(rel => {
              const prod = products.find(p => p.id === rel.productId);
              if (prod) {
                prod.stock += rel.quantity;
              }
            });
          }

          return { ...prize, status: "Expired" as "Expired" };
        }
        return prize;
      });

      if (stateChanged) {
        setActivePrizes(updatedPrizes);
        setKits([...kits]);
        setProducts([...products]);
        saveStateToStorage(products, kits, users, orders, coupons, systemSettings, spinRecords, updatedPrizes);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [activePrizes, kits, products, users, orders, coupons, systemSettings, spinRecords]);

  // LOGIN INTERACTION
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    // Look up user
    const found = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (found) {
      if (!found.isActive) {
        triggerToast("Esta cuenta se encuentra desactivada por el administrador.", "error");
        return;
      }
      setCurrentUser(found);
      setLoginEmail("");
      setLoginPass("");
      casinoAudio.playWinFanfare();
      if (found.role === "admin") {
        setAdminViewActive(true);
      } else {
        setAdminViewActive(false);
      }
    } else {
      triggerToast("No se encontró ningún usuario con ese correo electrónico. Intenta con 'camila.giraldo@gmail.com' o regístrate.", "error");
    }
  };

  // REGISTER INTERACTION
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regName.trim()) return;

    // Email already registered check
    const exist = users.find(u => u.email.toLowerCase() === regEmail.trim().toLowerCase());
    if (exist) {
      triggerToast("Este correo ya está registrado, por favor inicia sesión.", "error");
      return;
    }

    const newUser: User = {
      id: "u_" + Date.now(),
      fullName: regName,
      email: regEmail.trim(),
      phone: regPhone,
      address: regAddress,
      role: "user",
      registeredAt: new Date().toISOString(),
      coinsAvailable: 2, // Welcome coins!
      coinsPurchased: 2,
      coinsUsed: 0,
      vipLevel: "Bronce",
      totalSpent: 0,
      isActive: true
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    setAdminViewActive(false);
    
    // reset form fields
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegAddress("");

    saveStateToStorage(products, kits, updatedUsers, orders, coupons, systemSettings, spinRecords, activePrizes);
    triggerToast("¡Registro Exitoso! Te obsequiamos 2 Coins de bienvenida para que gires ya.", "success");
  };

  // RECOVER INTERACTION
  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;
    setRecoverySent(true);
    setRecoveryToken("BEAUTY-" + Math.floor(1000 + Math.random() * 9000));
  };

  const handleVerifyTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySuccess(true);
  };

  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast("Contraseña restablecida con éxito. Inicia sesión ya!", "success");
    setRecoverySent(false);
    setRecoverySuccess(false);
    setRecoveryEmail("");
    setRecoveryToken("");
    setNewPassword("");
    setAuthMode("login");
  };

  // COINS ADD/BUY DISPATCHER
  const handleAddCoins = (coinsCount: number, pricePaidCop: number) => {
    if (!currentUser) return;

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        const nextSpent = u.totalSpent + pricePaidCop;
        
        // Calculate VIP level based on accum spent
        let nextVip: User["vipLevel"] = "Bronce";
        if (nextSpent >= 1200000) nextVip = "Diamante";
        else if (nextSpent >= 600000) nextVip = "Oro";
        else if (nextSpent >= 200000) nextVip = "Plata";

        const updated = {
          ...u,
          coinsAvailable: u.coinsAvailable + coinsCount,
          coinsPurchased: u.coinsPurchased + coinsCount,
          totalSpent: nextSpent,
          vipLevel: nextVip
        };
        
        // Sync active user
        setCurrentUser(updated);
        return updated;
      }
      return u;
    });

    setUsers(updatedUsers);
    
    // Register order for coins in metric lists if needed, we'll auto-compile metrics based on user totals
    saveStateToStorage(products, kits, updatedUsers, orders, coupons, systemSettings, spinRecords, activePrizes);
  };

  // APPLY COUPONS CODES MODIFIER
  const handleApplyCoupon = (code: string): Coupon | string => {
    const validated = coupons.find(c => c.code.toLowerCase() === code.trim().toLowerCase());
    if (!validated) {
      return `El código de cupón '${code}' no existe en el sistema.`;
    }
    if (!validated.isActive) {
      return "Este cupón se encuentra inactivo actualmente.";
    }
    return validated;
  };

  // SLOT SPIN START AND RESULT DISPATCHER
  const handleSpinSuccess = (wonKit: Kit, isJackpot: boolean, coinCost: number = 1) => {
    if (!currentUser) return;

    // Deduct coin and register activity
    const deductCoinsUsers = users.map(u => {
      if (u.id === currentUser.id) {
        const nextCoins = Math.max(0, u.coinsAvailable - coinCost);
        const nextCoinsUsed = u.coinsUsed + coinCost;
        const updated = {
          ...u,
          coinsAvailable: nextCoins,
          coinsUsed: nextCoinsUsed
        };
        setCurrentUser(updated);
        return updated;
      }
      return u;
    });

    // Discount stock for the kit and components
    const updatedKits = kits.map(k => {
      if (k.id === wonKit.id) {
        return {
          ...k,
          stock: Math.max(0, k.stock - 1),
          winnersThisMonthCount: k.winnersThisMonthCount + 1
        };
      }
      return k;
    });

    const updatedProducts = products.map(p => {
      const component = wonKit.productRelations.find(rel => rel.productId === p.id);
      if (component) {
        return {
          ...p,
          stock: Math.max(0, p.stock - component.quantity)
        };
      }
      return p;
    });

    // Register spin record
    const nextGlobalSpins = systemSettings.totalSpinsCounter + 1;
    const updatedSettings = {
      ...systemSettings,
      totalSpinsCounter: nextGlobalSpins
    };

    const newRecord: SpinRecord = {
      id: "rec_" + Date.now(),
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      kitId: wonKit.id,
      kitName: wonKit.name,
      wonAt: new Date().toISOString(),
      isJackpot
    };

    const nextSpinRecords = [...spinRecords, newRecord];

    // Create a Won prize result
    // Default expiry duration: 1 hour (3600000 ms) inside simple demo
    const defaultExpiryInterval = 29 * 60 * 1000; // 29 minutes
    const expiresAtIso = new Date(Date.now() + defaultExpiryInterval).toISOString();

    const newPrize: SpinResult = {
      id: "prize_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      userId: currentUser.id,
      kitId: wonKit.id,
      kitName: wonKit.name,
      kitImage: wonKit.image,
      wonAt: new Date().toISOString(),
      expiresAt: expiresAtIso,
      status: "Won",
      valorComercial: wonKit.valorComercial,
      precioReclamar: wonKit.precioReclamar
    };

    const nextActivePrizes = [...activePrizes, newPrize];

    setUsers(deductCoinsUsers);
    setKits(updatedKits);
    setProducts(updatedProducts);
    setSystemSettings(updatedSettings);
    setSpinRecords(nextSpinRecords);
    setActivePrizes(nextActivePrizes);

    // Save
    saveStateToStorage(
      updatedProducts, 
      updatedKits, 
      deductCoinsUsers, 
      orders, 
      coupons, 
      updatedSettings, 
      nextSpinRecords, 
      nextActivePrizes
    );

    // Show celebratory screen overlay
    setWonOverlayPrizeCost(coinCost);
    setWonOverlayKit(wonKit);
    setIsJackpotWin(isJackpot);
  };

  // BUY/CLAIM WON KIT DISPATCHER
  const handleClaimPrize = (prize: SpinResult, finalAmountCop: number, couponUsed?: string) => {
    if (!currentUser) return;

    // Resolve order number
    const ordNum = "BS-" + Math.floor(10000 + orders.length + 1);

    // Create new order
    const newOrder: Order = {
      id: "order_" + Date.now(),
      orderNumber: ordNum,
      userId: currentUser.id,
      userFullName: currentUser.fullName,
      kitId: prize.kitId,
      kitName: prize.kitName,
      kitImage: prize.kitImage,
      amountPaid: finalAmountCop,
      shippingAddress: currentUser.address,
      status: "Paid", // Confirmed because it's simulated payment!
      createdAt: new Date().toISOString(),
      couponUsed
    };

    const updatedOrders = [...orders, newOrder];

    // Alter status of won ticket
    const updatedPrizes = activePrizes.map(p => 
      p.id === prize.id ? { ...p, status: "Claimed" as "Claimed" } : p
    );

    // Up spending stats for VIP scaling
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        const nextSpent = u.totalSpent + finalAmountCop;
        
        let nextVip: User["vipLevel"] = "Bronce";
        if (nextSpent >= 1200000) nextVip = "Diamante";
        else if (nextSpent >= 600000) nextVip = "Oro";
        else if (nextSpent >= 200000) nextVip = "Plata";

        const updated = {
          ...u,
          totalSpent: nextSpent,
          vipLevel: nextVip
        };
        setCurrentUser(updated);
        return updated;
      }
      return u;
    });

    setOrders(updatedOrders);
    setActivePrizes(updatedPrizes);
    setUsers(updatedUsers);

    saveStateToStorage(products, kits, updatedUsers, updatedOrders, coupons, systemSettings, spinRecords, updatedPrizes);
    casinoAudio.playWinFanfare();
  };

  // DEBUG SPEED CONTROLLERS FOR TIMERS
  const handleFastForwardTimer = (prizeId: string) => {
    // Accelerates countdown setting expiry 10 seconds from now
    const updatedPrizes = activePrizes.map(p => {
      if (p.id === prizeId) {
        return {
          ...p,
          expiresAt: new Date(Date.now() + 10 * 1000).toISOString() // 10 seconds
        };
      }
      return p;
    });
    setActivePrizes(updatedPrizes);
    saveStateToStorage(products, kits, users, orders, coupons, systemSettings, spinRecords, updatedPrizes);
  };

  // SWAPPING SIMULATION USERS QUICKLY FOR STAKEHOLDERS
  const simulateSwapUser = (userId: string) => {
    if (userId === "auth_page") {
      setCurrentUser(null);
      setAdminViewActive(false);
      return;
    }

    const usrObj = users.find(u => u.id === userId);
    if (usrObj) {
      setCurrentUser(usrObj);
      if (usrObj.role === "admin") {
        setAdminViewActive(true);
      } else {
        setAdminViewActive(false);
      }
      casinoAudio.playReelStop();
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-stone-800 flex flex-col font-sans transition-all selection:bg-rose-100 selection:text-rose-900 pb-12 relative overflow-x-hidden">
      
      {/* Global Toast notifications replacing native blocking alert panels */}
      {globalToast && (
        <div className="fixed top-5 right-5 z-60 bg-stone-900 border border-stone-850 text-white rounded-2xl px-5 py-4 shadow-xl max-w-sm flex items-center gap-3.5 animate-bounce">
          {globalToast.type === "success" && <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-lg shadow-emerald-500/50" />}
          {globalToast.type === "error" && <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0 shadow-lg shadow-rose-500/50" />}
          {globalToast.type === "info" && <div className="w-3 h-3 rounded-full bg-cyan-400 shrink-0 shadow-lg shadow-cyan-400/50" />}
          <span className="text-xs font-mono font-medium">{globalToast.text}</span>
        </div>
      )}
      
      {/* Background Atmospheric Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-200 opacity-20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100 opacity-25 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Top QA Navigation helper bar */}
      <div className="w-full bg-stone-100 border-b border-stone-200 py-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-20 relative">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-stone-600 font-mono"><b>ACCESO DE REVISIÓN RÁPIDA (Stakeholders):</b></span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={currentUser ? currentUser.id : "auth_page"}
            onChange={(e) => simulateSwapUser(e.target.value)}
            className="bg-white border border-stone-250 text-[11px] rounded-lg p-1.5 px-2.5 font-bold text-rose-600 focus:outline-none"
          >
            <option value="auth_page">🔐 Pantalla de Ingreso/Registro</option>
            <optgroup label="Cuentas Seed Integradas:">
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role === "admin" ? "Admin" : `VIP ${u.vipLevel}`})
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={resetToInitialSeeds}
            title="Resetea la base de datos a su origen simulado"
            className="flex items-center gap-1 bg-white hover:bg-stone-50 border border-stone-250 text-stone-600 py-1.5 px-3 rounded-lg hover:text-stone-900 transition cursor-pointer font-bold text-[10.5pt]"
          >
            <RefreshCw className="h-3 w-3" />
            Resetear Demo
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="w-full max-w-7xl mx-auto px-4 mt-6 grow flex flex-col relative z-10">
        
        {/* App Title Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-white border border-stone-200 py-5 px-6 rounded-2xl mb-8 w-full gap-4 relative shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-stone-900 flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase italic text-stone-900 flex items-center gap-1">
                BEAUTY <span className="text-rose-600">SPIN</span>
              </h1>
              <span className="text-[10px] text-stone-500 tracking-widest uppercase block font-bold font-mono">Maquillaje • Skincare • Gaming</span>
            </div>
          </div>

          {/* User profile controls at top header */}
          {currentUser ? (
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3 bg-stone-50 p-2 sm:p-2.5 px-3 sm:px-4 rounded-2xl sm:rounded-full border border-stone-200 shadow-2xs w-full sm:w-auto">
              <div className="text-center sm:text-right">
                <span className="text-xs font-bold text-stone-900 block">{currentUser.fullName}</span>
                <span className="text-[9.5px] uppercase font-mono text-stone-550 block font-bold leading-tight">
                  {currentUser.role === "admin" ? "Administrador" : `VIP ${currentUser.vipLevel}`}
                </span>
              </div>

              <div className="hidden min-[380px]:block h-4 w-px bg-stone-200"></div>

              {currentUser.role === "admin" && (
                <button
                  onClick={() => setAdminViewActive(!adminViewActive)}
                  className={`py-1.5 px-4 text-white font-black text-xs uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer shadow-sm ${
                    adminViewActive
                      ? "bg-stone-900 hover:bg-stone-800"
                      : "bg-rose-600 hover:bg-rose-750"
                  }`}
                >
                  {adminViewActive ? "Ver Ruleta 🎰" : "Panel Admin ⚙️"}
                </button>
              )}

              {!adminViewActive && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shadow-inner">
                  <div className="w-3.5 h-3.5 bg-yellow-450 rounded-full flex items-center justify-center text-amber-900 font-bold text-[9px] leading-none">
                    $
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono font-black text-amber-900 leading-none">{currentUser.coinsAvailable} COINS</span>
                </div>
              )}

              <button
                onClick={() => {
                  setCurrentUser(null);
                  setAdminViewActive(false);
                }}
                className="text-xs text-stone-500 hover:text-rose-600 font-bold transition ml-1"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAuthMode("login");
                  setCurrentUser(null);
                }}
                className="py-2 px-4 border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-900 transition rounded-full text-xs font-bold bg-white"
              >
                Ingresar
              </button>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setCurrentUser(null);
                }}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition rounded-full text-xs font-bold"
              >
                Registrarme
              </button>
            </div>
          )}
        </header>

        {/* WORKSPACE VIEWS SWAPPER */}
        <main className="grow">
          {currentUser ? (
            // LOGGED IN VIEW AREA
            (currentUser.role === "admin" && adminViewActive) ? (
              // ADMIN CONTROL SECTION MODE
              <AdminPanel
                products={products}
                kits={kits}
                users={users}
                orders={orders}
                coupons={coupons}
                systemSettings={systemSettings}
                spinRecords={spinRecords}
                onUpdateProducts={(pr) => { setProducts(pr); saveStateToStorage(pr, kits, users, orders, coupons, systemSettings, spinRecords, activePrizes); }}
                onUpdateKits={(kt) => { setKits(kt); saveStateToStorage(products, kt, users, orders, coupons, systemSettings, spinRecords, activePrizes); }}
                onUpdateUsers={(us) => { setUsers(us); saveStateToStorage(products, kits, us, orders, coupons, systemSettings, spinRecords, activePrizes); }}
                onUpdateOrders={(or) => { setOrders(or); saveStateToStorage(products, kits, users, or, coupons, systemSettings, spinRecords, activePrizes); }}
                onUpdateCoupons={(cp) => { setCoupons(cp); saveStateToStorage(products, kits, users, orders, cp, systemSettings, spinRecords, activePrizes); }}
                onUpdateSystemSettings={(st) => { setSystemSettings(st); saveStateToStorage(products, kits, users, orders, coupons, st, spinRecords, activePrizes); }}
              />
            ) : (
              // SHOPPER MODE: TWO BEAUTIFUL INDEPENDENT PAGES (ROULETTE / PROFILE ACCOUNT)
              <>
                {/* Immersive Section Selector Tabs */}
                <div className="flex justify-center mb-8 relative z-20 select-none">
                  <div className="bg-white border border-stone-200 p-1.5 rounded-2xl flex gap-1.5 shadow-2xs">
                    <button
                      onClick={() => setShopperTab("roulette")}
                      className={`flex items-center gap-2 pl-5 pr-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        shopperTab === "roulette"
                          ? "bg-stone-900 text-white shadow-xs scale-102"
                          : "text-stone-500 hover:text-stone-850 hover:bg-stone-50"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      🎰 Tragamonedas Live
                    </button>
                    <button
                      onClick={() => setShopperTab("account")}
                      className={`flex items-center gap-2 pl-5 pr-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        shopperTab === "account"
                          ? "bg-stone-900 text-white shadow-xs scale-102"
                          : "text-stone-500 hover:text-stone-850 hover:bg-stone-50"
                      }`}
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      👤 Mi Cuenta y Perfil
                    </button>
                  </div>
                </div>

                {shopperTab === "roulette" ? (
                  <div className="space-y-12">
                    {/* Centered High-End Header */}
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                      <span className="text-rose-600 text-xs font-mono tracking-widest block uppercase font-extrabold">
                        MÁQUINA DIGITAL RECLAMABLE
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-stone-905 flex items-center justify-center gap-2 font-sans tracking-tight uppercase leading-none">
                        <Award className="h-6 w-6 text-rose-550 shrink-0" />
                        Gira y Alinea tus Productos Favoritos
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed font-sans font-medium">
                        Multiplica tu suerte por solo 1 Coin y alinea 3 productos reales de marcas prestigiosas. ¡Siempre ganas la combinación premium de lujo alineada con más de 50% de descuento garantizado!
                      </p>
                    </div>

                    {/* Centered Slot Machine Box */}
                    <div className="flex justify-center relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-200/10 blur-3xl rounded-full pointer-events-none"></div>
                      <SlotMachine
                        currentUser={currentUser}
                        kits={kits}
                        systemSettings={systemSettings}
                        products={products}
                        onSpinSuccess={handleSpinSuccess}
                        onBuyCoinsClick={() => {
                          // Tab switch to Account which holds UserDashboard
                          setShopperTab("account");
                          setTimeout(() => {
                            const storeEl = document.getElementById("store-coins-section");
                            if (storeEl) {
                              storeEl.scrollIntoView({ behavior: "smooth" });
                            }
                          }, 150);
                        }}
                      />
                    </div>

                    {/* BEAUTIFUL PRIZE & PRODUCT EXHIBITION VITRINA */}
                    <div id="kits-exhibition-showcase" className="mt-12 bg-white border border-stone-200 rounded-[30px] p-6 sm:p-8 text-left relative overflow-hidden shadow-2xs">
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <span className="text-rose-600 text-xs font-mono tracking-widest block uppercase font-extrabold mb-1">
                            VITRINA DE COSMÉTICOS PREMIUM
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2 font-sans tracking-tight">
                            <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/10" />
                            Premios de Ensueño en Disputa
                          </h3>
                          <p className="text-xs text-stone-500 mt-1 font-sans">
                            Todos estos prestigiosos cosméticos forman parte de nuestro pozo. ¡Alinea 3 productos iguales o complementarios para llevártelos hoy mismo!
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#FAF7F2] border border-stone-200 px-3.5 py-1.5 rounded-xl text-[11px] text-stone-750 font-sans font-medium max-w-sm">
                          <Trophy className="h-4 w-4 shrink-0 text-amber-600" />
                          <span><b>Sorteo 100% Sin Pérdida:</b> ¡Siempre ganas una magnífica combinación de productos!</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map(product => {
                          const visual = PRODUCT_VISUAL_RESOURCES[product.id] || {
                            image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500&auto=format&fit=crop&q=80",
                            category: "Cosmético",
                            description: "Producto original de marca prestigiosa importado para el kit ideal de tu rutina beauty."
                          };
                          
                          return (
                            <div key={product.id} className="bg-[#FAF9F6] border border-stone-200 rounded-2xl overflow-hidden hover:border-rose-300 transition-all duration-300 group flex flex-col justify-between shadow-2xs">
                              <div>
                                {/* Image and category badge */}
                                <div className="relative h-44 sm:h-48 overflow-hidden bg-white border-b border-stone-150">
                                  <img 
                                    src={visual.image} 
                                    alt={product.name} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500" 
                                  />
                                  <span className="absolute top-2.5 left-2.5 bg-white border border-stone-200 text-rose-600 text-[9.5px] font-black uppercase px-2 py-0.5 rounded font-mono tracking-wider shadow-2xs">
                                    {visual.category}
                                  </span>
                                  {product.stock <= 5 && (
                                    <span className="absolute top-2.5 right-2.5 bg-stone-900 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded font-mono shadow-2xs">
                                      STOCK LIMITADO
                                    </span>
                                  )}
                                </div>

                                {/* Product Details */}
                                <div className="p-4 text-left space-y-2">
                                  <span className="text-[9.5px] text-stone-450 font-mono block font-bold">SKU: {product.sku}</span>
                                  <h4 className="font-extrabold text-stone-905 text-sm group-hover:text-rose-600 transition min-h-[40px] line-clamp-2 leading-snug">{product.name}</h4>
                                  <p className="text-[11.5px] text-stone-550 line-clamp-3 leading-relaxed font-sans">{visual.description}</p>
                                </div>
                              </div>

                              {/* Financial summary at bottom of card */}
                              <div className="p-4 border-t border-stone-150 bg-stone-50/50">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-stone-550 font-semibold font-sans">Valor Comercial:</span>
                                  <span className="text-stone-900 font-extrabold font-mono text-sm">{formatCOP(product.referencePrice)}</span>
                                </div>
                                <div className="mt-2.5 bg-amber-50 border border-amber-200/60 rounded-xl p-2 text-[10.5px] text-amber-900 font-sans flex items-center justify-between gap-1 font-bold">
                                  <span>Sorteo Disponible</span>
                                  <span className="font-mono bg-amber-500 text-white px-2 py-0.5 rounded-md font-black">ACTIVO</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Dedicated User profile page */
                  <div className="max-w-5xl mx-auto">
                    <UserDashboard
                      currentUser={currentUser}
                      systemSettings={systemSettings}
                      activePrizes={activePrizes.filter(p => p.userId === currentUser.id)}
                      orders={orders}
                      coupons={coupons}
                      onAddCoins={handleAddCoins}
                      onApplyCoupon={handleApplyCoupon}
                      onClaimPrize={(prize, price, coupon) => {
                        handleClaimPrize(prize, price, coupon);
                      }}
                      onFastForwardTimer={handleFastForwardTimer}
                      products={products}
                      kits={kits}
                    />
                  </div>
                )}
              </>
            )
          ) : (
            // LOGGED OUT SECURE WALL
            <div className="max-w-4xl mx-auto bg-white border border-stone-250 rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(27,25,23,0.04)] grid grid-cols-1 md:grid-cols-2 mt-4 relative z-10">
              
              {/* Left Column Welcome Banner */}
              <div className="p-8 bg-stone-50 border-r border-stone-200 flex flex-col justify-between relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-44 h-44 bg-rose-200/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div>
                  <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white font-bold mb-5 shadow-inner">
                    ✨
                  </div>
                  <h3 className="text-xl font-extrabold text-stone-900 tracking-tight leading-tight uppercase font-sans">La magia de la belleza <span className="text-rose-600 block">en un solo giro.</span></h3>
                  <p className="text-xs text-stone-605 mt-3 leading-relaxed max-w-sm font-sans">
                    Beauty Spin combina la entretención de los tragamonedas de casino más elegantes con prestigiosos del skincare y maquillaje de marcas top mundiales.
                  </p>
                </div>

                <div className="space-y-3.5 pt-6 border-t border-stone-200 mt-8">
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="text-rose-605 font-extrabold">✓</div>
                    <span className="text-stone-700 font-semibold font-sans">100% libre de pérdidas (Siempre te llevas ofertas de lujo)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="text-rose-650 font-extrabold">✓</div>
                    <span className="text-stone-700 font-semibold font-sans">Protección solar, serums de ácido hialurónico y maquillaje premium</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="text-rose-650 font-extrabold">✓</div>
                    <span className="text-stone-700 font-semibold font-sans">Integración segura con cupones, saldo coins y ascenso VIP</span>
                  </div>
                </div>

                <div className="text-[10px] text-stone-400 font-mono mt-8 font-bold tracking-wider uppercase">
                  © 2026 BEAUTY SPIN COLOMBIA.
                </div>
              </div>

              {/* Right Column Forms Appraiser */}
              <div className="p-8 bg-white flex flex-col justify-center">
                
                {/* Auth Mode switcher */}
                <div className="flex gap-4 border-b border-stone-150 mb-6 text-xs font-bold uppercase select-none">
                  <button
                    onClick={() => setAuthMode("login")}
                    className={`pb-2.5 transition ease-out cursor-pointer tracking-wider font-mono ${authMode === "login" ? "text-rose-600 border-b-2 border-rose-600" : "text-stone-400 hover:text-stone-605"}`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => setAuthMode("register")}
                    className={`pb-2.5 transition ease-out cursor-pointer tracking-wider font-mono ${authMode === "register" ? "text-rose-600 border-b-2 border-rose-600" : "text-stone-400 hover:text-stone-605"}`}
                  >
                    Registrarme
                  </button>
                  <button
                    onClick={() => setAuthMode("recover")}
                    className={`pb-2.5 transition ease-out cursor-pointer tracking-wider font-mono ${authMode === "recover" ? "text-rose-600 border-b-2 border-rose-600" : "text-stone-400 hover:text-stone-605"}`}
                  >
                    Recuperar
                  </button>
                </div>

                {/* LOGIN FORM */}
                {authMode === "login" && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-mono font-bold tracking-widest mb-1.5 uppercase">CORREO ELECTRÓNICO (*)</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="camila.giraldo@gmail.com"
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 placeholder-stone-400 w-full pl-9 focus:outline-none focus:border-rose-500 transition-all font-sans font-semibold"
                        />
                        <Mail className="h-4 w-4 text-stone-400 absolute left-3 top-3.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-mono font-bold tracking-widest mb-1.5 uppercase">CONTRASEÑA (*)</label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          defaultValue="1234"
                          placeholder="Escribe la contraseña..."
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 placeholder-stone-400 w-full pl-9 focus:outline-none focus:border-rose-500 transition-all font-mono font-bold"
                        />
                        <Lock className="h-4 w-4 text-stone-400 absolute left-3 top-3.5" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 font-mono font-extrabold text-xs uppercase tracking-widest rounded-xl text-white transition cursor-pointer"
                    >
                      INGRESAR A LA PLATAFORMA
                    </button>

                    <div className="mt-4 bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px] text-stone-500 flex flex-col gap-1 font-sans leading-relaxed">
                      <span>💡 <b>¿No cuentas con accesos?</b> Usa el selector de "Acceso Rápido" en la barra superior de revisión para ingresar como Camila o Administrador al instante.</span>
                    </div>
                  </form>
                )}

                {/* REGISTER FORM */}
                {authMode === "register" && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-96 overflow-y-auto pr-1 text-left">
                    <div>
                      <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-widest mb-1 uppercase">Nombre Completo (*)</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Camila Giraldo"
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 w-full pl-9 focus:outline-none focus:border-rose-500 font-semibold"
                        />
                        <UserIcon className="h-3.5 w-3.5 text-stone-405 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-widest mb-1 uppercase">Correo Electrónico (*)</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="camila@gmail.com"
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 w-full pl-9 focus:outline-none focus:border-rose-500 font-semibold"
                        />
                        <Mail className="h-3.5 w-3.5 text-stone-405 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-widest mb-1 uppercase">Número telefónico</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="315 456 7890"
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 w-full pl-9 focus:outline-none focus:border-rose-500 font-semibold"
                        />
                        <Phone className="h-3.5 w-3.5 text-stone-405 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-widest mb-1 uppercase">Dirección de despacho por defecto</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder="Calle 127 # 45 - 20, Bogotá"
                          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 w-full pl-9 focus:outline-none focus:border-rose-500 font-semibold"
                        />
                        <MapPin className="h-3.5 w-3.5 text-stone-405 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-stone-905 bg-stone-900 font-mono font-extrabold text-xs uppercase tracking-widest rounded-xl text-white transition cursor-pointer"
                    >
                      REGISTRARME YA (BIENVENIDA)
                    </button>
                  </form>
                )}

                {/* RECOVER CODE FORM */}
                {authMode === "recover" && (
                  <div className="space-y-4 text-left">
                    {!recoverySent ? (
                      <form onSubmit={handleRecoverSubmit} className="space-y-3">
                        <p className="text-xs text-stone-605 leading-relaxed font-sans font-medium">Ingresa tu correo registrado y te generaremos un código de autenticación única temporal simulada.</p>
                        <div>
                          <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-widest mb-1">CORREO REGISTRADO (*)</label>
                          <input
                            type="email"
                            required
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="camila.giraldo@gmail.com"
                            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-[#0F0A1E] focus:outline-none focus:border-rose-500 font-semibold"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                        >
                          Enviar enlace
                        </button>
                      </form>
                    ) : !recoverySuccess ? (
                      <form onSubmit={handleVerifyTokenSubmit} className="space-y-3">
                        <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-220 rounded-xl text-xs font-sans font-medium leading-relaxed">
                          <span>Token de un solo uso enviado: <strong className="font-mono text-sm block mt-1 text-rose-900 text-center font-black">{recoveryToken}</strong></span>
                        </div>

                        <div>
                          <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-widest mb-1">ESCRIBE EL TOKEN RECIBIDO</label>
                          <input
                            type="text"
                            required
                            placeholder="BEAUTY-XXXX"
                            className="bg-[#FCFAF6] border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 uppercase text-center focus:outline-none focus:border-rose-550 font-mono text-sm tracking-widest font-black"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer font-mono"
                        >
                          Verificar Código
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleSetNewPassword} className="space-y-3">
                        <div>
                          <label className="block text-[9px] text-stone-500 font-mono font-bold tracking-widest mb-1">NUEVA CONTRASEÑA</label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-[#FCFAF6] border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-[#0F0A1E] focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                        >
                          Restablecer Contraseña
                        </button>
                      </form>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </main>
      </div>

      {/* GLOBAL DISMISSABLE CELEBRATION MODAL ON GIN WIN */}
      {wonOverlayKit && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-6 md:p-10 select-none">
          <div className="bg-white border border-stone-200 p-5 sm:p-8 rounded-3xl w-full max-w-lg text-center shadow-lg text-stone-800 relative overflow-hidden my-auto">
            
            {/* Close button top right */}
            <button
              onClick={() => setWonOverlayKit(null)}
              className="absolute top-3 right-3 text-stone-500 hover:text-stone-850 transition-colors cursor-pointer w-7 h-7 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center z-50 text-sm font-bold shadow-2xs border border-stone-200"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Spinning background sparkles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-radial from-rose-200/15 to-transparent pointer-events-none rounded-full"></div>

            {/* Simulated Confetti Squares floating vertically */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
              {[...Array(22)].map((_, i) => {
                const colors = ["bg-rose-400", "bg-rose-500", "bg-amber-300", "bg-emerald-400"];
                const rndCol = colors[i % colors.length];
                const leftOff = (i * 243) % 100;
                const delay = (i * 0.15).toFixed(1);
                const rot = (i * 45) % 360;
                return (
                  <div
                    key={i}
                    className={`absolute w-1.5 h-2 rounded-xs ${rndCol} opacity-80`}
                    style={{
                      left: `${leftOff}%`,
                      top: `-20px`,
                      transform: `rotate(${rot}deg)`,
                      animation: `fall 3.5s linear infinite ${delay}s`
                    }}
                  ></div>
                );
              })}
            </div>

            <div className="relative pr-1 text-stone-805 text-left">
              <span className="text-rose-600 text-[10.5px] font-mono tracking-widest block uppercase font-extrabold mb-1.5 text-center">
                {isJackpotWin ? "🚨 ¡PREMIO SÚPER JACKPOT LIBERADO! 🚨" : "✨ ¡PROCESO DE GIRO EXITOSO! ✨"}
              </span>
              
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-sans tracking-tight mb-4 text-center leading-snug uppercase">
                {isJackpotWin ? "¡FELICIDADES, TE GANASTE EL PREMIO GORDO!" : "¡FELICIDADES, LOGRASTE UNA COMBINACIÓN GANADORA!"}
              </h3>

              <div className="relative max-w-sm mx-auto mb-5 rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                <img
                  src={wonOverlayKit.image}
                  alt={wonOverlayKit.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 sm:h-48 object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-white/95 text-rose-700 font-bold px-3 py-1 rounded-xl text-[11px] border border-stone-200 shadow-2xs">
                  Precio Reclamar: {formatCOP(wonOverlayKit.precioReclamar)} COP
                </div>
              </div>

              <h4 className="text-base font-extrabold text-stone-900 mb-2 truncate max-w-xs mx-auto text-center">{wonOverlayKit.name}</h4>
              <p className="text-xs text-stone-550 max-w-sm mx-auto mb-4 leading-relaxed font-sans text-center font-medium">
                Alineaste un espectacular combo de productos premium en los rieles. ¡Reclama todos estos productos juntos por una fracción de su valor comercial!
              </p>

              {/* Product list inside Celebration success modal */}
              <div className="bg-[#FAF8F5] border border-stone-200 p-3.5 rounded-xl max-w-sm mx-auto mb-6 text-left relative z-10">
                <span className="text-[9.5px] text-rose-650 font-mono tracking-widest font-black uppercase block mb-2 text-center">
                  🎁 PRODUCTOS EN ESTE KIT GANADO 🎁
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {wonOverlayKit.productRelations.map(rel => {
                    const prod = products.find(p => p.id === rel.productId);
                    if (!prod) return null;
                    return (
                      <div key={rel.productId} className="flex items-center justify-between gap-2 text-[11.5px] bg-white border border-stone-150 rounded-lg p-2 font-sans font-medium">
                        <span className="text-stone-700 flex items-center gap-1.5 truncate max-w-[210px]">
                          <span className="w-4.5 h-4.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-850 flex items-center justify-center font-extrabold shrink-0">
                            {rel.quantity}
                          </span>
                          {prod.name}
                        </span>
                        <span className="text-stone-500 font-mono text-[10.5px] shrink-0">
                          {formatCOP(prod.referencePrice)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 border-t border-stone-200 pt-4 max-w-sm mx-auto">
                <div className="text-left">
                  <span className="text-[9px] text-stone-500 block font-bold">VALOR COMERCIAL REAL</span>
                  <strong className="text-stone-400 line-through text-xs font-semibold">{formatCOP(wonOverlayKit.valorComercial)} COP</strong>
                </div>
                <div className="h-6 w-px bg-stone-200"></div>
                <div className="text-left">
                  <span className="text-[9.5px] text-rose-600 block font-extrabold pb-0.5">AHORRO EXCLUSIVO WINNER</span>
                  <strong className="text-emerald-700 text-base font-black font-mono">
                    {formatCOP(wonOverlayKit.valorComercial - wonOverlayKit.precioReclamar)} COP
                  </strong>
                </div>
              </div>

              {/* Urgent Countdown notice */}
              <div className="mt-5 bg-[#FCFAF6] border border-rose-200/50 p-2 sm:p-3 rounded-xl max-w-sm mx-auto flex items-center justify-center gap-2 shadow-inner">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-[10px] sm:text-[10.5px] font-mono font-extrabold text-rose-800 uppercase tracking-wide">
                  RESERVA TEMPORAL DISPONIBLE: <span className="text-rose-600 font-black font-mono shadow-inner bg-white border border-stone-200 px-2 py-0.5 rounded ml-1">29 minutos</span>
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-5 grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    setWonOverlayKit(null);
                    // Scroll to claim panel
                    const listEl = document.getElementById("user-dashboard-wrapper");
                    if (listEl) listEl.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="py-3 px-1.5 bg-rose-600 hover:bg-rose-700 transition text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs active:scale-95"
                >
                  <span>RECLAMAR MI KIT YA</span>
                  <span className="text-[9px] text-rose-100 font-mono font-medium">(29:00 minutos restantes)</span>
                </button>
                
                <button
                  onClick={() => {
                    setWonOverlayKit(null);
                    // Scroll to slot machine
                    const machineEl = document.getElementById("beauty-slot-machine-container");
                    if (machineEl) {
                      machineEl.scrollIntoView({ behavior: "smooth" });
                    }
                    // Flash slot machine spin button to prompt action
                    setTimeout(() => {
                      const spinBtn = document.getElementById("btn-spin-slot-machine");
                      if (spinBtn) {
                        spinBtn.classList.add("scale-103", "ring-4", "ring-rose-550");
                        setTimeout(() => spinBtn.classList.remove("scale-103", "ring-4", "ring-rose-550"), 1500);
                      }
                    }, 500);
                  }}
                  className="py-3 px-1.5 bg-stone-50 hover:bg-stone-105 border border-stone-250 transition text-stone-850 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 shadow-2xs"
                >
                  <span>VOLVER A TIRAR</span>
                  <span className="text-[9px] text-rose-650 font-mono font-bold">
                    (Cuesta 1 Coin)
                  </span>
                </button>
              </div>

              <div className="text-[9.5px] text-stone-450 italic mt-4 font-mono text-center block leading-none">
                ⚠️ Recuerda: Tienes exactamente 29 minutos para comprarlo. ¡No dejes que expire!
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DEMO STATE TOAST HELPER */}
      {showResetToast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 border-2 border-emerald-500 text-slate-100 py-3 px-5 rounded-2xl z-50 flex items-center gap-2.5 shadow-2xl animate-bounce text-xs font-bold">
          <span className="text-emerald-400 text-lg">✓</span>
          <span>¡Base de Datos resetada con éxito! Valores cargados a semillas originales.</span>
        </div>
      )}

      {/* Styled inline animation keyframes fallback */}
      <style>{`
        @keyframes fall {
          0% {
            top: -20px;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            top: 100%;
            transform: translateY(500px) rotate(360deg);
          }
        }
      `}</style>

    </div>
  );
}
