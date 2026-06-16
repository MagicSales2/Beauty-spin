/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Kit, User, SystemSettings, Product } from "../types";
import { casinoAudio } from "../utils/audio";
import { Play, Sparkles, Coins, HelpCircle, Trophy, Zap, AlertCircle, RefreshCw } from "lucide-react";

interface SlotMachineProps {
  currentUser: User;
  kits: Kit[];
  systemSettings: SystemSettings;
  onSpinSuccess: (wonKit: Kit, isJackpot: boolean, coinCost: number) => void;
  onBuyCoinsClick: () => void;
  products: Product[];
}

interface SymbolItem {
  id: string;
  emoji: string;
  label: string;
  color: string;
  image: string;
}

// Map known products to specific beautiful high-end cosmetics emojis, gradients and real images
const PRODUCT_VISUAL_RESOURCES: Record<string, { emoji: string; color: string; image: string }> = {
  p1: { emoji: "🧴", color: "from-amber-400 to-orange-500", image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&auto=format&fit=crop&q=80" },
  p2: { emoji: "💧", color: "from-sky-400 to-indigo-500", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=80" },
  p3: { emoji: "🧼", color: "from-pink-400 to-rose-500", image: "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=300&auto=format&fit=crop&q=80" },
  p4: { emoji: "🌹", color: "from-rose-450 to-pink-500", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80" },
  p5: { emoji: "💄", color: "from-red-500 to-purple-600", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&auto=format&fit=crop&q=80" },
  p6: { emoji: "🎨", color: "from-amber-300 to-yellow-600", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80" },
  p7: { emoji: "👁️", color: "from-purple-500 to-indigo-500", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&auto=format&fit=crop&q=80" },
  p8: { emoji: "🌊", color: "from-teal-400 to-emerald-500", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=80" }
};

const EMOJIS_POOL = ["💄", "🧴", "💧", "🌹", "🎨", "👁️", "🌊", "✨", "🌸", "💅", "💎", "⭐"];
const GRADIENTS_POOL = [
  "from-pink-450 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-sky-450 to-indigo-500",
  "from-teal-400 to-emerald-500",
  "from-red-500 to-purple-650",
  "from-purple-500 to-indigo-550"
];
const FALLBACK_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1608248597481-496100c80b36?w=300&auto=format&fit=crop&q=80"
];

export const SlotMachine: React.FC<SlotMachineProps> = ({
  currentUser,
  kits,
  systemSettings,
  onSpinSuccess,
  onBuyCoinsClick,
  products
}) => {
  // Build machine symbols list dynamically based on our real products database
  const SYMBOLS: SymbolItem[] = products.map((prod, idx) => {
    const visual = PRODUCT_VISUAL_RESOURCES[prod.id] || {
      emoji: EMOJIS_POOL[idx % EMOJIS_POOL.length],
      color: GRADIENTS_POOL[idx % GRADIENTS_POOL.length],
      image: FALLBACK_IMAGE_POOL[idx % FALLBACK_IMAGE_POOL.length]
    };
    return {
      id: prod.id,
      emoji: visual.emoji,
      label: prod.name,
      color: visual.color,
      image: visual.image
    };
  });

  // Machine modes: 3 products vs 5 products
  const [machineMode, setMachineMode] = useState<3 | 5>(3);

  const [reel1, setReel1] = useState<number>(0);
  const [reel2, setReel2] = useState<number>(1 % (SYMBOLS.length || 1));
  const [reel3, setReel3] = useState<number>(2 % (SYMBOLS.length || 1));
  const [reel4, setReel4] = useState<number>(3 % (SYMBOLS.length || 1));
  const [reel5, setReel5] = useState<number>(4 % (SYMBOLS.length || 1));

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [leverPulled, setLeverPulled] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const spinIntervals = useRef<any[]>([]);

  // Safety cleanup of intervals on unmount
  useEffect(() => {
    return () => {
      spinIntervals.current.forEach(int => clearInterval(int));
    };
  }, []);

  // MODE SWAP TRIGGER - Ensures reels stop immediate motion and stay completely quiet
  useEffect(() => {
    setIsSpinning(false);
    spinIntervals.current.forEach(int => clearInterval(int));
    spinIntervals.current = [];
    
    // Explicitly snap reels back to simple, uniform, static presets
    setReel1(0);
    setReel2(1 % (SYMBOLS.length || 1));
    setReel3(2 % (SYMBOLS.length || 1));
    setReel4(3 % (SYMBOLS.length || 1));
    setReel5(4 % (SYMBOLS.length || 1));
    setErrorMessage(null);
  }, [machineMode, products]);

  // Robust check when spinning stops to clear remaining stray intervals
  useEffect(() => {
    if (!isSpinning) {
      spinIntervals.current.forEach(int => clearInterval(int));
      spinIntervals.current = [];
    }
  }, [isSpinning]);

  // Read prices configured in admin or default values
  const cost3 = systemSettings.spin3CostCoins !== undefined ? systemSettings.spin3CostCoins : 1;
  const cost5 = systemSettings.spin5CostCoins !== undefined ? systemSettings.spin5CostCoins : 2;
  const currentSpinCost = machineMode === 5 ? cost5 : cost3;

  const handleSpin = () => {
    if (isSpinning) return;
    setErrorMessage(null);

    // Verify coins based on selected machine cost
    if (currentUser.coinsAvailable < currentSpinCost) {
      setErrorMessage(`¡No tienes suficientes Coins! Este giro requiere ${currentSpinCost} ${currentSpinCost === 1 ? 'Coin' : 'Coins'}.`);
      casinoAudio.playError();
      return;
    }

    // Verify we have active kits to draw from
    const activeKits = kits.filter(k => k.isActive && k.stock > 0);
    if (activeKits.length === 0) {
      setErrorMessage("No hay kits de belleza disponibles actualmente. Contacta al administrador.");
      casinoAudio.playError();
      return;
    }

    // Start spin logic
    setIsSpinning(true);
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 800);

    // 1. SELECT KIT ACCORDING TO PROBABILITIES
    const nextGlobalSpinIndex = systemSettings.totalSpinsCounter + 1;
    const isJackpotTrigger = nextGlobalSpinIndex % systemSettings.jackpotCycle === 0;

    let selectedKit: Kit;

    if (isJackpotTrigger) {
      const jackpotKit = activeKits.find(k => k.isJackpot) || activeKits.reduce((prev, current) => (prev.probabilidad < current.probabilidad ? prev : current));
      selectedKit = jackpotKit;
    } else {
      const totalWeight = activeKits.reduce((sum, kit) => sum + kit.probabilidad, 0);
      let randomValue = Math.random() * totalWeight;
      
      let found = activeKits[0];
      for (const kit of activeKits) {
        randomValue -= kit.probabilidad;
        if (randomValue <= 0) {
          found = kit;
          break;
        }
      }
      selectedKit = found;
    }

    // Map which symbols the wheels should land to represent the won Kit
    const uniqueKitProductIds = Array.from(new Set(selectedKit.productRelations.map(rel => rel.productId)));
    let targetProductIds: string[] = [];

    const numReels = machineMode;

    // Put unique items from the kit
    for (let i = 0; i < Math.min(numReels, uniqueKitProductIds.length); i++) {
      targetProductIds.push(uniqueKitProductIds[i]);
    }

    // Pad with other unique products so there are no repeating images
    const availableOtherProducts = products.filter(p => !targetProductIds.includes(p.id));
    let padIdx = 0;
    while (targetProductIds.length < numReels && padIdx < availableOtherProducts.length) {
      targetProductIds.push(availableOtherProducts[padIdx].id);
      padIdx++;
    }
    
    // Secondary fallback pad if still not enough products
    while (targetProductIds.length < numReels) {
      const fallbackId = products[Math.floor(Math.random() * products.length)]?.id || "";
      if (!targetProductIds.includes(fallbackId) || targetProductIds.length === products.length) {
        targetProductIds.push(fallbackId);
      }
    }

    const targetReelIndexes = targetProductIds.map(pId => {
      const idx = SYMBOLS.findIndex(sym => sym.id === pId);
      return idx >= 0 ? idx : 0;
    });

    // 2. RUN ANIMATION FOR ALL REELS
    // Reel 1
    const int1 = setInterval(() => {
      setReel1(prev => (prev + 1) % (SYMBOLS.length || 1));
      casinoAudio.playTick();
    }, 90);

    // Reel 2
    const int2 = setInterval(() => {
      setReel2(prev => (prev + 1) % (SYMBOLS.length || 1));
    }, 110);

    // Reel 3
    const int3 = setInterval(() => {
      setReel3(prev => (prev + 1) % (SYMBOLS.length || 1));
    }, 130);

    let int4: any = null;
    let int5: any = null;

    if (numReels === 5) {
      // Reel 4
      int4 = setInterval(() => {
        setReel4(prev => (prev + 1) % (SYMBOLS.length || 1));
      }, 100);

      // Reel 5
      int5 = setInterval(() => {
        setReel5(prev => (prev + 1) % (SYMBOLS.length || 1));
      }, 120);
    }

    // Keep active interval references
    const activeIntervals = [int1, int2, int3];
    if (int4) activeIntervals.push(int4);
    if (int5) activeIntervals.push(int5);
    spinIntervals.current = activeIntervals;

    // STOP REELS SEQUENTIALLY
    // Stop Reel 1
    setTimeout(() => {
      clearInterval(int1);
      setReel1(targetReelIndexes[0]);
      casinoAudio.playReelStop();
    }, 1400);

    // Stop Reel 2
    setTimeout(() => {
      clearInterval(int2);
      setReel2(targetReelIndexes[1]);
      casinoAudio.playReelStop();
    }, 1900);

    // Stop Reel 3
    setTimeout(() => {
      clearInterval(int3);
      setReel3(targetReelIndexes[2]);
      casinoAudio.playReelStop();
      
      // If 3 reels mode, we are done
      if (numReels === 3) {
        setTimeout(() => {
          setIsSpinning(false);
          casinoAudio.playWinFanfare();
          onSpinSuccess(selectedKit, isJackpotTrigger || selectedKit.isJackpot || false, currentSpinCost);
        }, 500);
      }
    }, 2400);

    if (numReels === 5) {
      // Stop Reel 4
      setTimeout(() => {
        if (int4) clearInterval(int4);
        setReel4(targetReelIndexes[3]);
        casinoAudio.playReelStop();
      }, 2900);

      // Stop Reel 5
      setTimeout(() => {
        if (int5) clearInterval(int5);
        setReel5(targetReelIndexes[4]);
        casinoAudio.playReelStop();

        setTimeout(() => {
          setIsSpinning(false);
          casinoAudio.playWinFanfare();
          onSpinSuccess(selectedKit, isJackpotTrigger || selectedKit.isJackpot || false, currentSpinCost);
        }, 500);
      }, 3405);
    }
  };

  const spinsToJackpot = systemSettings.jackpotCycle - (systemSettings.totalSpinsCounter % systemSettings.jackpotCycle);

  const getShortName = (name: string) => {
    if (!name) return "";
    const words = name.split(" ");
    const short = words.length > 2 ? words.slice(0, 2).join(" ") : name;
    return short.length > 15 ? short.substring(0, 13) + ".." : short;
  };

  // Safe accessor to render items beautifully without crashes
  const getSymbol = (index: number) => {
    if (!SYMBOLS || SYMBOLS.length === 0) return null;
    const safeIndex = ((index % SYMBOLS.length) + SYMBOLS.length) % SYMBOLS.length;
    return SYMBOLS[safeIndex];
  };

  const sym1 = getSymbol(reel1);
  const sym2 = getSymbol(reel2);
  const sym3 = getSymbol(reel3);
  const sym4 = getSymbol(reel4);
  const sym5 = getSymbol(reel5);

  return (
    <div id="beauty-slot-machine-container" className={`w-full ${machineMode === 5 ? "max-w-5xl" : "max-w-3xl"} mx-auto bg-white border border-stone-200/80 rounded-[36px] p-4 sm:p-8 md:p-10 shadow-[0_15px_40px_rgba(27,25,23,0.05)] relative overflow-hidden transition-all duration-300`}>
      
      {/* Top Banner / Info bar */}
      <div className="w-full bg-stone-50 border border-stone-200 py-3.5 px-4 sm:px-6 rounded-2xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-550"></span>
          </span>
          <span className="text-xs font-bold text-stone-850 tracking-wider uppercase font-mono">
            SISTEMA DE ASIGNACIÓN MULTI-PREMIO
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-mono font-bold uppercase">
          <Zap className="h-3.5 w-3.5 text-rose-500" />
          <span>Faltan <b className="text-stone-900 bg-stone-200/60 px-1.5 py-0.5 rounded text-[11px] font-extrabold">{spinsToJackpot}</b> giros para el GORDO JACKPOT</span>
        </div>
      </div>

      {/* MACHINE TOGGLE MODE SELECTOR */}
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <span className="text-stone-500 text-[10px] font-mono tracking-widest mb-3 uppercase font-extrabold">
          Modalidad de Sorteo Activa
        </span>
        <div className="bg-stone-50 p-1.5 rounded-2xl border border-stone-200 flex gap-2 w-full max-w-md shadow-inner">
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => setMachineMode(3)}
            className={`flex-1 cursor-pointer py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1.5 ${
              machineMode === 3
                ? "bg-rose-600 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-850 hover:bg-stone-100/50 disabled:opacity-50"
            }`}
          >
            <span className="flex items-center gap-1">🌟 3 Productos</span>
            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${machineMode === 3 ? "bg-rose-750 text-white" : "bg-stone-200/60 text-stone-700"}`}>
              {cost3} {cost3 === 1 ? 'Coin' : 'Coins'}
            </span>
          </button>
          <button
            type="button"
            disabled={isSpinning}
            onClick={() => setMachineMode(5)}
            className={`flex-1 cursor-pointer py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1.5 ${
              machineMode === 5
                ? "bg-rose-600 text-white shadow-xs"
                : "text-stone-500 hover:text-stone-850 hover:bg-stone-100/50 disabled:opacity-50"
            }`}
          >
            <span className="flex items-center gap-1">🔥 5 Productos</span>
            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${machineMode === 5 ? "bg-rose-750 text-white" : "bg-stone-200/60 text-stone-700"}`}>
              {cost5} {cost5 === 1 ? 'Coin' : 'Coins'}
            </span>
          </button>
        </div>
      </div>

      {/* SLOTS DISPLAY STAGE (MADE SIGNIFICANTLY LARGER FOR 5-PRODUCT MODE) */}
      <div className={`p-4 sm:p-6 md:p-8 bg-stone-50 border border-stone-200/80 rounded-[28px] relative transition-all duration-300`}>
        {/* Sleek aesthetic studs */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-stone-300 rounded-full"></div>
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-stone-300 rounded-full"></div>
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-stone-300 rounded-full"></div>
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-stone-300 rounded-full"></div>

        <div className={`grid gap-3 sm:gap-4 relative transition-all ${
          machineMode === 5 
            ? "grid-cols-1 sm:grid-cols-5" 
            : "grid-cols-1 sm:grid-cols-3"
        }`}>
          
          {/* Reel-1 */}
          {sym1 && (
            <div className={`rounded-xl sm:rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center border border-stone-200/85 bg-white shadow-xs relative px-2 sm:px-1 py-3 sm:py-5 ${
              machineMode === 5 
                ? "h-32 sm:h-64 md:h-76" 
                : "h-36 sm:h-56 md:h-68"
            }`}>
              <div className={`transition-all duration-75 text-center flex flex-col justify-center items-center ${isSpinning ? "blur-[2.5px] scale-95" : ""}`}>
                <div className={`rounded-lg sm:rounded-xl overflow-hidden border border-stone-150 shadow-2xs flex items-center justify-center mb-2 sm:mb-3 relative transition-all ${
                  machineMode === 5 
                    ? "w-16 h-16 sm:w-28 sm:h-28 md:w-36 md:h-36" 
                    : "w-20 h-20 sm:w-26 sm:h-26 md:w-32 md:h-32"
                }`}>
                  <img 
                    src={sym1.image} 
                    alt={sym1.label} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform"
                  />
                </div>
                <span className="font-mono text-stone-850 font-bold text-center px-1 truncate max-w-full text-xs sm:text-xs" title={sym1.label}>
                  {getShortName(sym1.label)}
                </span>
              </div>
            </div>
          )}

          {/* Reel-2 */}
          {sym2 && (
            <div className={`rounded-xl sm:rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center border border-stone-200/85 bg-white shadow-xs relative px-2 sm:px-1 py-3 sm:py-5 ${
              machineMode === 5 
                ? "h-32 sm:h-64 md:h-76" 
                : "h-36 sm:h-56 md:h-68"
            }`}>
              <div className={`transition-all duration-75 text-center flex flex-col justify-center items-center ${isSpinning ? "blur-[2.5px] scale-95" : ""}`}>
                <div className={`rounded-lg sm:rounded-xl overflow-hidden border border-stone-150 shadow-2xs flex items-center justify-center mb-2 sm:mb-3 relative transition-all ${
                  machineMode === 5 
                    ? "w-16 h-16 sm:w-28 sm:h-28 md:w-36 md:h-36" 
                    : "w-20 h-20 sm:w-26 sm:h-26 md:w-32 md:h-32"
                }`}>
                  <img 
                    src={sym2.image} 
                    alt={sym2.label} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform"
                  />
                </div>
                <span className="font-mono text-stone-850 font-bold text-center px-1 truncate max-w-full text-xs sm:text-xs" title={sym2.label}>
                  {getShortName(sym2.label)}
                </span>
              </div>
            </div>
          )}

          {/* Reel-3 */}
          {sym3 && (
            <div className={`rounded-xl sm:rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center border border-stone-200/85 bg-white shadow-xs relative px-2 sm:px-1 py-3 sm:py-5 ${
              machineMode === 5 
                ? "h-32 sm:h-64 md:h-76" 
                : "h-36 sm:h-56 md:h-68"
            }`}>
              <div className={`transition-all duration-75 text-center flex flex-col justify-center items-center ${isSpinning ? "blur-[2.5px] scale-95" : ""}`}>
                <div className={`rounded-lg sm:rounded-xl overflow-hidden border border-stone-150 shadow-2xs flex items-center justify-center mb-2 sm:mb-3 relative transition-all ${
                  machineMode === 5 
                    ? "w-16 h-16 sm:w-28 sm:h-28 md:w-36 md:h-36" 
                    : "w-20 h-20 sm:w-26 sm:h-26 md:w-32 md:h-32"
                }`}>
                  <img 
                    src={sym3.image} 
                    alt={sym3.label} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform"
                  />
                </div>
                <span className="font-mono text-stone-850 font-bold text-center px-1 truncate max-w-full text-xs sm:text-xs" title={sym3.label}>
                  {getShortName(sym3.label)}
                </span>
              </div>
            </div>
          )}

          {/* Reel-4 */}
          {machineMode === 5 && sym4 && (
            <div className="rounded-xl sm:rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center border border-stone-200/85 bg-white shadow-xs relative px-2 sm:px-1 py-3 sm:py-5 h-32 sm:h-64 md:h-76">
              <div className={`transition-all duration-75 text-center flex flex-col justify-center items-center ${isSpinning ? "blur-[2.5px] scale-95" : ""}`}>
                <div className="rounded-lg sm:rounded-xl overflow-hidden border border-stone-150 shadow-2xs flex items-center justify-center mb-2 sm:mb-3 relative transition-all w-16 h-16 sm:w-28 sm:h-28 md:w-36 md:h-36">
                  <img 
                    src={sym4.image} 
                    alt={sym4.label} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform"
                  />
                </div>
                <span className="font-mono text-stone-850 font-bold text-center px-1 truncate max-w-full text-xs sm:text-xs" title={sym4.label}>
                  {getShortName(sym4.label)}
                </span>
              </div>
            </div>
          )}

          {/* Reel-5 */}
          {machineMode === 5 && sym5 && (
            <div className="rounded-xl sm:rounded-2xl transition-all overflow-hidden flex flex-col items-center justify-center border border-stone-200/85 bg-white shadow-xs relative px-2 sm:px-1 py-3 sm:py-5 h-32 sm:h-64 md:h-76">
              <div className={`transition-all duration-75 text-center flex flex-col justify-center items-center ${isSpinning ? "blur-[2.5px] scale-95" : ""}`}>
                <div className="rounded-lg sm:rounded-xl overflow-hidden border border-stone-150 shadow-2xs flex items-center justify-center mb-2 sm:mb-3 relative transition-all w-16 h-16 sm:w-28 sm:h-28 md:w-36 md:h-36">
                  <img 
                    src={sym5.image} 
                    alt={sym5.label} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform"
                  />
                </div>
                <span className="font-mono text-stone-850 font-bold text-center px-1 truncate max-w-full text-xs sm:text-xs" title={sym5.label}>
                  {getShortName(sym5.label)}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Lever / Trigger Controls */}
      <div className="mt-6 sm:mt-8 flex flex-col items-center gap-4">
        {errorMessage && (
          <div className="text-xs bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl flex items-center gap-2 mb-1 w-full max-w-lg shadow-2xs font-medium animate-pulse">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          id="btn-spin-slot-machine"
          disabled={isSpinning}
          onClick={handleSpin}
          className={`w-full py-4.5 sm:py-5 px-8 rounded-2xl font-extrabold tracking-widest text-white shadow-md select-none transition-all outline-none duration-250 transform flex items-center justify-center gap-2.5 relative overflow-hidden ${
            isSpinning
              ? "bg-stone-300 text-stone-500 cursor-not-allowed scale-98 shadow-none"
              : "bg-stone-900 border border-stone-950 hover:bg-stone-850 active:scale-97 cursor-pointer text-xs sm:text-sm uppercase font-mono"
          }`}
        >
          {isSpinning ? (
            <>
              <RefreshCw className="animate-spin h-4.5 w-4.5 text-stone-500" />
              <span>ALINEANDO PRODUCTOS...</span>
            </>
          ) : (
            <>
              <Play className="h-4.5 w-4.5 fill-white text-white" />
              <span>
                LANZAR BEAUTY SPIN ({currentSpinCost} {currentSpinCost === 1 ? 'COIN' : 'COINS'})
              </span>
            </>
          )}
        </button>

        {/* User Balance details */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-3 w-full text-xs text-stone-550 border-t border-stone-200/80 pt-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5.5 h-5.5 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 font-extrabold text-[12px]">$</div>
            <span className="font-sans text-stone-650">Tus Coins Disponibles: <strong className="text-stone-900 font-black">{currentUser.coinsAvailable} Coins</strong></span>
          </div>

          <button
            onClick={onBuyCoinsClick}
            type="button"
            className="text-rose-600 hover:text-rose-700 font-extrabold tracking-wider uppercase text-[11px] transition hover:underline cursor-pointer"
          >
            Adquirir más Coins
          </button>
        </div>
      </div>

      {/* Guide details */}
      <div className="mt-6 sm:mt-8 text-[11px] text-stone-500 border-t border-stone-200/80 pt-4.5 flex flex-col sm:flex-row justify-between gap-3 leading-relaxed">
        <div className="flex items-start gap-1.5 sm:max-w-[48%]">
          <HelpCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span><b>¿Cómo juego?</b> Se descontarán tus Coins del balance general. Al girar, la máquina asignará la combinación automáticamente.</span>
        </div>
        <div className="flex items-start gap-1.5 sm:max-w-[48%]">
          <Trophy className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <span><b>Garantía Sin Pérdidas:</b> Siempre obtendrás una fabulosa combinación de prestigiosas marcas reales de skincare o maquillaje con más del 50% de descuento.</span>
        </div>
      </div>

    </div>
  );
};
