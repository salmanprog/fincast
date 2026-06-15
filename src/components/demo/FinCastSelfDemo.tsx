"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid, Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Calendar, TrendingDown, TrendingUp, ShieldCheck,
  RefreshCw, MousePointer2, Printer, ChevronDown, ChevronUp, BookOpen, Play,
} from "lucide-react";

export default function FinCastSelfDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [lineCounts, setLineCounts] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineCountsRef = useRef<[number, number, number, number]>([0, 0, 0, 0]);
  const currentLineRef = useRef(0);
  const mountedRef = useRef(false);

  const hookCardRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const inputsCardRef = useRef<HTMLDivElement | null>(null);
  const scenariosCardRef = useRef<HTMLDivElement | null>(null);
  const printBtnRef = useRef<HTMLButtonElement | null>(null);
  const [pointerPos, setPointerPos] = useState<{ top: number; left: number }>({ top: 90, left: 90 });
  const [portalMounted, setPortalMounted] = useState(false);
  const isAutoPlayingRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speechSessionRef = useRef(0);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const printTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pdfOfferedRef = useRef(false);
  useEffect(() => { isAutoPlayingRef.current = isAutoPlaying; }, [isAutoPlaying]);
  useEffect(() => { setPortalMounted(true); }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  const spokenStepRef = useRef<number>(-1);

  const narrationSteps = [
    {
      title: "The Hook",
      voice: "Will your client run out of money? FinCast Reva helps advisors transform a difficult retirement discussion into a calm, clear visual conversation in under sixty seconds.",
    },
    {
      title: "Client Inputs",
      voice: "Next, the advisor enters just the essentials. Age, retirement age, savings, annual savings, return, spending, and inflation. The goal is to keep the conversation simple and comfortable.",
    },
    {
      title: "Instant Projection",
      voice: "FinCast Reva gently illustrates whether the client remains financially secure throughout retirement, or may eventually approach a projected depletion point.",
    },
    {
      title: "Scenario Conversation",
      voice: "Then the advisor can gently explore what-if questions. What if the client retires a little later, spends a little less, or earns a different return? The picture updates immediately.",
    },
    {
      title: "Advisor CTA",
      voice: "The result is a calmer, clearer retirement discussion. Clients can see the issue, understand the tradeoffs, and talk with their advisor about next steps.",
    },
  ];

  const pickPreferredVoice = (): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length
      ? voicesRef.current
      : (typeof window !== "undefined" ? window.speechSynthesis?.getVoices() ?? [] : []);
    const preferred = voices.find((v) =>
      v.name.includes("Serena") ||
      v.name.includes("Samantha") ||
      v.name.includes("Karen") ||
      v.name.includes("Moira") ||
      v.name.includes("Tessa") ||
      v.name.includes("Google UK English Female") ||
      v.name.includes("Google US English Female")
    );
    return preferred ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
  };

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const clearPrintTimer = () => {
    if (printTimerRef.current) {
      clearTimeout(printTimerRef.current);
      printTimerRef.current = null;
    }
  };

  const stopSpeech = () => {
    speechSessionRef.current += 1;
    window.speechSynthesis?.cancel?.();
  };

  const speakUtterance = (
    text: string,
    onEnd?: () => void,
    opts?: { rate?: number; pitch?: number; volume?: number }
  ) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onEnd?.();
      return;
    }
    const session = ++speechSessionRef.current;
    const synth = window.speechSynthesis;

    const start = (attempt = 0) => {
      if (session !== speechSessionRef.current) return;
      voicesRef.current = synth.getVoices();
      if (voicesRef.current.length === 0 && attempt < 15) {
        setTimeout(() => start(attempt + 1), 120);
        return;
      }
      synth.cancel();
      synth.resume();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = opts?.rate ?? 0.68;
      utter.pitch = opts?.pitch ?? 0.96;
      utter.volume = opts?.volume ?? 0.86;
      const voice = pickPreferredVoice();
      if (voice) utter.voice = voice;
      if (onEnd) {
        utter.onend = () => {
          if (session === speechSessionRef.current) onEnd();
        };
      }
      synth.speak(utter);
    };

    start();
  };

  const endOfDemoPdfFlow = () => {
    setIsAutoPlaying(false);
    isAutoPlayingRef.current = false;
    clearAdvanceTimer();
    clearPrintTimer();
    pdfOfferedRef.current = false;

    const openPrintOnce = () => {
      if (pdfOfferedRef.current) return;
      pdfOfferedRef.current = true;
      clearPrintTimer();
      try {
        stopSpeech();
        window.print();
      } catch { /* ignore */ }
    };

    const schedulePrint = (delay: number) => {
      clearPrintTimer();
      printTimerRef.current = setTimeout(openPrintOnce, delay);
    };

    speakUtterance(
      "Here is your one-page client summary from FinCast Reva, ready to save as a PDF.",
      () => schedulePrint(400),
      { rate: 0.72, pitch: 0.96, volume: 0.9 }
    );
    schedulePrint(8000);
  };

  const advanceAutoDemo = () => {
    if (!isAutoPlayingRef.current) return;
    clearAdvanceTimer();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      if (!isAutoPlayingRef.current) return;
      if (spokenStepRef.current >= narrationSteps.length - 1) {
        endOfDemoPdfFlow();
      } else {
        setDemoStep((s) => Math.min(s + 1, narrationSteps.length - 1));
      }
    }, 1400);
  };

  const nextStep = () => {
    clearAdvanceTimer();
    clearPrintTimer();
    pdfOfferedRef.current = true;
    stopSpeech();
    setIsAutoPlaying(false);
    isAutoPlayingRef.current = false;

    const next = (demoStep + 1) % narrationSteps.length;
    spokenStepRef.current = next;
    setDemoStep(next);

    if (next === 2) {
      handleRun();
      return;
    }
    speakUtterance(narrationSteps[next].voice);
  };

  const startAutoDemo = () => {
    clearAdvanceTimer();
    clearPrintTimer();
    pdfOfferedRef.current = false;
    stopSpeech();
    spokenStepRef.current = 0;
    setDemoStep(0);
    setIsAutoPlaying(true);
    isAutoPlayingRef.current = true;
    speakUtterance(narrationSteps[0].voice, advanceAutoDemo);
  };

  const stopAutoDemo = () => {
    clearAdvanceTimer();
    clearPrintTimer();
    pdfOfferedRef.current = true;
    stopSpeech();
    setIsAutoPlaying(false);
    isAutoPlayingRef.current = false;
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (spokenStepRef.current === demoStep) return;
    // Skip auto-speak on first mount — wait for button click
    if (spokenStepRef.current === -1 && demoStep === 0 && !isAutoPlaying) {
      spokenStepRef.current = 0;
      return;
    }
    spokenStepRef.current = demoStep;

    const advance = () => {
      if (!isAutoPlayingRef.current) return;
      advanceAutoDemo();
    };

    if (isAutoPlaying && demoStep === 2) {
      handleRun({ onComplete: advance });
      return;
    }

    speakUtterance(
      narrationSteps[demoStep].voice,
      isAutoPlaying ? advance : undefined
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoStep, isAutoPlaying]);

  const [clientName, setClientName] = useState("");

  const [ageNow, setAgeNow] = useState(58);
  const [retireAge, setRetireAge] = useState(67);
  const [currentSavings, setCurrentSavings] = useState(850000);
  const [annualContributions, setAnnualContributions] = useState(35000);
  const [annualReturn, setAnnualReturn] = useState(6);
  const [retirementSpending, setRetirementSpending] = useState(130000);
  const [ssIncome, setSsIncome] = useState(24000);
  const [otherRetirementIncome, setOtherRetirementIncome] = useState(0);
  const [inflation, setInflation] = useState(3);

  const projection = useMemo(() => {
    const rows: { age: number; balance: number; label: string }[] = [];
    let balance = Number(currentSavings || 0);
    let contributions = Number(annualContributions || 0);
    let spend = Number(retirementSpending || 0);
    const ss = Number(ssIncome || 0);
    const other = Number(otherRetirementIncome || 0);
    const r = Number(annualReturn || 0) / 100;
    const inf = Number(inflation || 0) / 100;
    let depletionAge: number | null = null;

    for (let age = Number(ageNow); age <= 100; age++) {
      if (age < Number(retireAge)) {
        balance = balance * (1 + r) + contributions;
        contributions = contributions * 1.03;
      } else {
        const netWithdrawal = Math.max(spend - ss - other, 0);
        balance = balance * (1 + r) - netWithdrawal;
        spend = spend * (1 + inf);
      }
      if (balance <= 0 && depletionAge === null) {
        depletionAge = age;
        balance = 0;
      }
      rows.push({ age, balance: Math.round(balance), label: `$${Math.max(balance, 0).toLocaleString()}` });
      if (depletionAge !== null && age > depletionAge + 3) break;
    }

    const finalBalance = rows[rows.length - 1]?.balance || 0;
    return { rows, depletionAge, finalBalance };
  }, [ageNow, retireAge, currentSavings, annualContributions, annualReturn, retirementSpending, ssIncome, otherRetirementIncome, inflation]);

  const scenarioData = useMemo(() => {
    const runScenario = (rAge: number, ret: number, spend: number) => {
      const out: Record<number, number> = {};
      let bal = Number(currentSavings || 0);
      let contrib = Number(annualContributions || 0);
      let spd = spend;
      const ss = Number(ssIncome || 0);
      const other = Number(otherRetirementIncome || 0);
      const r = ret / 100;
      const inf = Number(inflation || 0) / 100;
      let depleted = false;
      for (let age = Number(ageNow); age <= 100; age++) {
        if (age < rAge) {
          bal = bal * (1 + r) + contrib;
          contrib = contrib * 1.03;
        } else {
          const net = Math.max(spd - ss - other, 0);
          bal = bal * (1 + r) - net;
          spd = spd * (1 + inf);
        }
        if (bal <= 0 && !depleted) { depleted = true; bal = 0; }
        if (depleted) bal = 0;
        out[age] = Math.round(bal);
      }
      return out;
    };

    const base        = runScenario(retireAge, annualReturn, retirementSpending);
    const retireLater = runScenario(Math.min(retireAge + 2, 75), annualReturn, retirementSpending);
    const spendLess   = runScenario(retireAge, annualReturn, Math.max(retirementSpending - 10000, 40000));
    const stressRet   = runScenario(retireAge, Math.max(annualReturn - 1, 0.1), retirementSpending);

    const rows = [];
    for (let age = Number(ageNow); age <= 100; age++) {
      rows.push({
        age,
        "Base Case":     base[age]        ?? 0,
        "Retire Later":  retireLater[age]  ?? 0,
        "Spend Less":    spendLess[age]    ?? 0,
        "Stress Return": stressRet[age]    ?? 0,
      });
    }
    return rows;
  }, [ageNow, retireAge, currentSavings, annualContributions, annualReturn, retirementSpending, ssIncome, otherRetirementIncome, inflation]);

  const animating = hasRun && lineCounts[3] < scenarioData.length;
  const displayData = scenarioData.map((row, i) => ({
    age: row.age,
    "Base Case":     i < lineCounts[0] ? row["Base Case"]     : null,
    "Retire Later":  i < lineCounts[1] ? row["Retire Later"]  : null,
    "Spend Less":    i < lineCounts[2] ? row["Spend Less"]    : null,
    "Stress Return": i < lineCounts[3] ? row["Stress Return"] : null,
  }));

  const resultMessage = projection.depletionAge
    ? `Projected depletion at age ${projection.depletionAge}`
    : `Projected balance remains positive through age 100`;

  const riskTone = projection.depletionAge ? "text-amber-700" : "text-emerald-700";
  const currency = (value: number) => `$${Number(value || 0).toLocaleString()}`;

  const scenarioVoiceLabels = [
    "Base case",
    "Retire later",
    "Spend less",
    "Stress return",
  ];

  const speak = (text: string) => {
    speakUtterance(text, undefined, { rate: 0.95, pitch: 1, volume: 1 });
  };

  const handleRun = (opts?: { onComplete?: () => void; suppressVoice?: boolean }) => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    if (!opts?.suppressVoice) stopSpeech();
    const fresh: [number, number, number, number] = [0, 0, 0, 0];
    lineCountsRef.current = [...fresh] as [number, number, number, number];
    currentLineRef.current = 0;
    setLineCounts(fresh);
    setHasRun(true);
    const total = scenarioData.length;
    const TICK_MS = 140;        // per-step draw speed
    const PAUSE_MS = opts?.suppressVoice ? 600 : 1200;
    const VOICE_LEAD_MS = opts?.suppressVoice ? 0 : 650;
    const SUMMARY_MS = 2600;    // room for the per-scenario summary voice

    const scenarioKeys = ["Base Case", "Retire Later", "Spend Less", "Stress Return"] as const;
    const summarize = (line: number): string => {
      const key = scenarioKeys[line];
      let depletion: number | null = null;
      for (let i = 1; i < scenarioData.length; i++) {
        const prev = scenarioData[i - 1][key] as number;
        const cur = scenarioData[i][key] as number;
        if (prev > 0 && cur <= 0) {
          depletion = scenarioData[i].age;
          break;
        }
      }
      if (depletion !== null) {
        return `Funds run out at age ${depletion}.`;
      }
      const last = scenarioData[scenarioData.length - 1][key] as number;
      if (last >= 1_000_000) {
        const m = (last / 1_000_000).toFixed(1);
        return `Balance at age one hundred, ${m} million dollars.`;
      }
      const k = Math.round(last / 1000);
      return `Balance at age one hundred, ${k} thousand dollars.`;
    };

    const startLine = (line: number) => {
      if (line >= 4) {
        opts?.onComplete?.();
        return;
      }
      currentLineRef.current = line;
      if (!opts?.suppressVoice) speak(scenarioVoiceLabels[line]);
      setTimeout(() => {
        if (currentLineRef.current !== line) return; // cancelled
        animTimerRef.current = setInterval(() => {
          lineCountsRef.current[line]++;
          const next: [number, number, number, number] = [...lineCountsRef.current] as [number, number, number, number];
          setLineCounts(next);
          if (lineCountsRef.current[line] >= total) {
            clearInterval(animTimerRef.current!);
            animTimerRef.current = null;
            // Announce this scenario's outcome, then pause before next scenario
            if (!opts?.suppressVoice) {
              setTimeout(() => {
                if (currentLineRef.current !== line) return;
                speak(summarize(line));
              }, 200);
            }
            setTimeout(() => {
              if (currentLineRef.current !== line) return;
              startLine(line + 1);
            }, PAUSE_MS + (opts?.suppressVoice ? 0 : SUMMARY_MS));
          }
        }, TICK_MS);
      }, VOICE_LEAD_MS);
    };

    startLine(0);
  };

  const handleReset = () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    clearAdvanceTimer();
    clearPrintTimer();
    pdfOfferedRef.current = true;
    stopSpeech();
    setIsAutoPlaying(false);
    isAutoPlayingRef.current = false;
    currentLineRef.current = -1;
    setHasRun(false);
    setLineCounts([0, 0, 0, 0]);
    setClientName("");
    setAgeNow(58);
    setRetireAge(67);
    setCurrentSavings(850000);
    setAnnualContributions(35000);
    setAnnualReturn(6);
    setRetirementSpending(130000);
    setSsIncome(24000);
    setOtherRetirementIncome(0);
    setInflation(3);
  };

  // Auto-trigger the animation the first time any input is adjusted
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (!hasRun) handleRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageNow, retireAge, currentSavings, annualContributions, annualReturn, retirementSpending, ssIncome, otherRetirementIncome, inflation]);

  const handlePrint = () => {
    clearPrintTimer();
    pdfOfferedRef.current = true;
    stopSpeech();
    window.print();
  };

  useEffect(() => {
    const updatePointer = () => {
      const targets: (HTMLElement | null)[] = [
        hookCardRef.current,
        inputsCardRef.current,
        resultCardRef.current,
        scenariosCardRef.current,
        printBtnRef.current,
      ];
      const el = targets[demoStep];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Anchor pointer tip near the top-left of the target with a small offset
      const top = Math.max(60, rect.top + 18);
      const left = Math.max(20, rect.left - 28);
      setPointerPos({ top, left });
    };
    updatePointer();
    window.addEventListener("resize", updatePointer);
    window.addEventListener("scroll", updatePointer, { passive: true });
    const id = window.setTimeout(updatePointer, 50);
    return () => {
      window.removeEventListener("resize", updatePointer);
      window.removeEventListener("scroll", updatePointer);
      window.clearTimeout(id);
    };
  }, [demoStep, hasRun, scriptOpen]);

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      {/* PRINT-ONLY ONE-PAGE SUMMARY (portal -> body so print CSS can show it) */}
      {portalMounted && createPortal(
        <div
          id="fincast-print-summary"
          style={{ display: "none" }}
          aria-hidden="true"
        >
          <PrintSummary
            clientName={clientName}
            ageNow={ageNow}
            retireAge={retireAge}
            currentSavings={currentSavings}
            annualContributions={annualContributions}
            annualReturn={annualReturn}
            retirementSpending={retirementSpending}
            ssIncome={ssIncome}
            otherRetirementIncome={otherRetirementIncome}
            inflation={inflation}
            projection={projection}
            scenarioData={scenarioData}
            resultMessage={resultMessage}
            today={today}
          />
        </div>,
        document.body
      )}

      {/* MAIN APP */}
      <div className="min-h-screen bg-slate-50 text-slate-950 p-4 md:p-8 relative overflow-hidden">
        <motion.div
          className="fixed z-50 text-slate-900 pointer-events-none"
          animate={{ top: pointerPos.top, left: pointerPos.left }}
          transition={{ duration: 0.9 }}
        >
          <div className="relative">
            <MousePointer2 className="w-10 h-10 drop-shadow-lg" />
            <motion.div
              className="absolute -inset-3 rounded-full border-2 border-slate-400"
              animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            />
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-1 gap-6 items-stretch"
          >
            <Card ref={hookCardRef} className={`rounded-2xl shadow-sm border-slate-200 bg-white ${demoStep === 0 ? "ring-4 ring-slate-300" : ""}`}>
              <CardContent className="p-7 md:p-10 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  <ShieldCheck className="w-4 h-4" /> FinCast Reva RIA Self-Demo
                </div>

                <div className="space-y-3">
                  <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
                    Will your client run out of money?
                  </h1>
                  <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
                    FinCast Reva helps advisors turn retirement uncertainty into a simple visual conversation in under 60 seconds.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-2xl font-semibold">60 sec</div>
                    <div className="text-sm text-slate-500">client clarity demo</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-2xl font-semibold">Live</div>
                    <div className="text-sm text-slate-500">scenario changes</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-2xl font-semibold">Visual</div>
                    <div className="text-sm text-slate-500">depletion risk</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-950 text-white p-5 space-y-3">
                  <div className="text-sm text-slate-300">
                    {isAutoPlaying ? "Auto-playing" : "Narrated Demo"} · Step {demoStep + 1} of {narrationSteps.length}
                  </div>
                  <div className="text-xl font-semibold">{narrationSteps[demoStep].title}</div>
                  <p className="text-slate-200 text-sm leading-relaxed">"{narrationSteps[demoStep].voice}"</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={startAutoDemo} className="rounded-2xl px-6 py-6 text-base">
                    Start Auto Narrated Demo
                  </Button>
                  <Button onClick={nextStep} variant="outline" className="rounded-2xl px-6 py-6 text-base">
                    Next Step
                  </Button>
                  {isAutoPlaying && (
                    <Button onClick={stopAutoDemo} variant="outline" className="rounded-2xl px-6 py-6 text-base">
                      Pause Voice
                    </Button>
                  )}
                  <Button ref={printBtnRef} onClick={handlePrint} variant="outline" className="rounded-2xl px-6 py-6 text-base">
                    <Printer className="w-4 h-4 mr-2" /> Save as PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card ref={resultCardRef} className={`rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden ${demoStep === 2 ? "ring-4 ring-slate-300" : ""}`}>
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-500">Instant Result</div>
                    <div className={`text-2xl md:text-3xl font-semibold ${riskTone}`}>{resultMessage}</div>
                  </div>
                  {projection.depletionAge ? (
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  )}
                </div>

                {!hasRun ? (
                  <div className="h-[48rem] w-full flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                    <TrendingUp className="w-12 h-12 text-slate-300" />
                    <div className="text-center">
                      <div className="text-base font-semibold text-slate-600">Ready to project</div>
                      <div className="text-sm text-slate-400 mt-1">Set your assumptions, then run</div>
                    </div>
                    <Button onClick={() => handleRun()} className="rounded-2xl px-8 py-3 gap-2 text-base">
                      <Play className="w-4 h-4" /> Run Projection
                    </Button>
                  </div>
                ) : (
                  <div className="h-[48rem] w-full relative">
                    {!animating && (
                      <button
                        onClick={() => handleRun()}
                        className="absolute top-0 right-0 z-10 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Replay
                      </button>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={displayData} margin={{ top: 12, right: 18, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis dataKey="age" tick={{ fontSize: 17, fill: "#0f172a", fontWeight: 600 }} stroke="#475569" domain={[Number(ageNow), 100]} type="number" />
                        <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 17, fill: "#0f172a", fontWeight: 600 }} stroke="#475569" />
                        <Tooltip
                          formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]}
                          labelFormatter={(label) => `Age ${label}`}
                          contentStyle={{ fontSize: 15, color: "#0f172a", fontWeight: 600 }}
                        />
                        {!animating && <Legend wrapperStyle={{ fontSize: 17, paddingTop: 8, color: "#0f172a", fontWeight: 600 }} />}
                        <ReferenceLine x={retireAge} stroke="#475569" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Retire", fontSize: 16, fill: "#0f172a", fontWeight: 700 }} />
                        <Line type="monotone" dataKey="Base Case"     name={`Base Case ($${(retirementSpending/1000).toFixed(0)}k/yr spend)`} stroke="#1e3a8a" strokeWidth={5} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="Retire Later"  name={`Retire Later (age ${Math.min(retireAge + 2, 75)})`} stroke="#047857" strokeWidth={4} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
                        <Line type="monotone" dataKey="Spend Less"    name={`Spend Less ($${(Math.max(retirementSpending - 10000, 40000)/1000).toFixed(0)}k/yr spend)`} stroke="#6d28d9" strokeWidth={4} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
                        <Line type="monotone" dataKey="Stress Return" name={`Stress Return (${(Math.max(annualReturn - 1, 0.1)).toFixed(1)}% return)`} stroke="#c2410c" strokeWidth={4} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="rounded-2xl bg-slate-100 border border-slate-200 p-5 flex items-center gap-3 text-slate-900">
                  <TrendingDown className="w-7 h-7 flex-shrink-0" />
                  <p className="text-xl font-semibold leading-snug">
                    Advisor talking point: "This is the moment clients understand retirement survivability without reading a 40-page report."
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6 mb-6">
            <Card ref={inputsCardRef} className={`rounded-2xl shadow-sm border-slate-200 bg-white ${demoStep === 1 ? "ring-4 ring-slate-300" : ""}`}>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Client Inputs</h2>
                  <button
                    onClick={handleReset}
                    title="Reset to defaults"
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition rounded-lg px-2 py-1 hover:bg-slate-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="grid grid-cols-[1fr_150px] gap-3 items-center">
                    <span className="text-sm font-medium text-slate-600">Client name</span>
                    <Input
                      className="rounded-xl"
                      type="text"
                      placeholder="e.g. J. Smith"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </label>
                  <p className="text-xs text-slate-400 text-right pr-0.5">
                    PDF only — never saved or stored
                  </p>
                </div>

                <InputRow label="Current age" value={ageNow} setValue={setAgeNow} />
                <InputRow label="Retirement age" value={retireAge} setValue={setRetireAge} />
                <InputRow label="Portfolio savings" value={currentSavings} setValue={setCurrentSavings} prefix="$" />
                <div className="space-y-3 pt-1">
                  <SliderRow label="Pre-retirement contributions" value={annualContributions} setValue={setAnnualContributions} min={0} max={100000} step={1000} prefix="$" />
                </div>

                <div className="space-y-3 pt-2">
                  <SliderRow label="Annual return" value={annualReturn} setValue={setAnnualReturn} min={0} max={12} step={0.1} suffix="%" decimals={1} />
                  <SliderRow label="Retirement spending" value={retirementSpending} setValue={setRetirementSpending} min={50000} max={500000} step={5000} prefix="$" />
                  <SliderRow label="SS / retirement income" value={ssIncome} setValue={setSsIncome} min={0} max={60000} step={1000} prefix="$" />
                  <SliderRow label="Other retirement income" value={otherRetirementIncome} setValue={setOtherRetirementIncome} min={0} max={100000} step={1000} prefix="$" />
                  <SliderRow label="Spending inflation" value={inflation} setValue={setInflation} min={0} max={8} step={0.1} suffix="%" decimals={1} />
                </div>
              </CardContent>
            </Card>

            <Card ref={scenariosCardRef} className={`rounded-2xl shadow-sm border-slate-200 bg-white ${demoStep === 3 || demoStep === 4 ? "ring-4 ring-slate-300" : ""}`}>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-semibold">Scenario Conversation</h2>
                  <p className="text-slate-600 mt-2">
                    Move one assumption and the client immediately sees how the retirement picture changes.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <ScenarioCard
                    title="Retire Later"
                    body="Increase retirement age to show how one or two extra working years may change the curve."
                    action={() => setRetireAge((v) => Math.min(v + 2, 75))}
                  />
                  <ScenarioCard
                    title="Spend Less"
                    body="Lower annual spending to show how lifestyle choices extend portfolio life."
                    action={() => setRetirementSpending((v) => Math.max(v - 10000, 40000))}
                  />
                  <ScenarioCard
                    title="Stress Return"
                    body="Drops the annual return assumption by 1% — e.g. 6% → 5% — to show how modest market underperformance affects portfolio longevity."
                    action={() => setAnnualReturn((v) => Math.max(v - 1, 1))}
                  />
                </div>

                <div className="rounded-2xl bg-slate-950 text-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div>
                    <div className="text-sm text-slate-300">Advisor CTA</div>
                    <div className="text-2xl font-semibold">See how FinCast Reva works in a client meeting.</div>
                    <p className="text-slate-300 mt-1">Book a 15-minute advisor walkthrough.</p>
                  </div>
                  <Button className="rounded-2xl px-6 py-6 text-base bg-white text-slate-950 hover:bg-slate-100">
                    <Calendar className="w-4 h-4 mr-2" /> Book Walkthrough
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/*ADVISOR MEETING SCRIPT*/}
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setScriptOpen((v) => !v)}
            className="w-full flex items-center justify-between px-7 py-5 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-slate-500" />
              <div className="text-left">
                <div className="font-semibold text-lg text-slate-900">Full Advisor Meeting Script</div>
                <div className="text-sm text-slate-500">Step-by-step talking guide for using FinCast Reva in a client meeting</div>
              </div>
            </div>
            {scriptOpen
              ? <ChevronUp className="w-5 h-5 text-slate-400" />
              : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {scriptOpen && (
            <div className="border-t border-slate-100 px-7 py-6 space-y-6">

              {/* Role legend */}
              <div className="flex flex-wrap gap-3 pb-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-1.5 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-white inline-block" />
                  RIA — that's you, the advisor running this meeting
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-600 px-4 py-1.5 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  Client — your retirement client sitting across from you
                </div>
              </div>

              {MEETING_SCRIPT.map((step, i) => (
                <div key={i} className="grid md:grid-cols-[220px_1fr] gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 mb-2">
                      Step {i + 1}
                    </div>
                    <div className="font-semibold text-slate-900">{step.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{step.timing}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-950 text-white p-4 text-sm leading-relaxed">
                      <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">RIA says</div>
                      "{step.script}"
                    </div>
                    {step.tip && (
                      <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 leading-relaxed">
                        <span className="font-semibold">RIA tip: </span>{step.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 mt-2">
                <div className="font-semibold text-slate-800 mb-1">Common Objections & Responses</div>
                <p className="text-xs text-slate-500 mb-4">When your client pushes back, here's how to respond.</p>
                <div className="space-y-3">
                  {OBJECTIONS.map((o, i) => (
                    <div key={i} className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700">
                        <span className="font-medium text-slate-500 block mb-1">Client says:</span>
                        "{o.objection}"
                      </div>
                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700">
                        <span className="font-medium text-emerald-600 block mb-1">RIA responds:</span>
                        "{o.response}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}

const MEETING_SCRIPT = [
  {
    title: "Open with the question",
    timing: "0:00 – 0:30",
    script: "I want to show you something before we get into the details. I'm going to ask you a straightforward question that most advisors avoid. Ready? Will you run out of money in retirement?",
    tip: "Pause after asking. Let the silence work. Most clients have never been asked this directly — it creates an opening.",
  },
  {
    title: "Frame the tool",
    timing: "0:30 – 1:00",
    script: "I'm not going to hand you a 40-page report. What I'm going to do is put four numbers in, and in about ten seconds you'll see the picture clearly. We can then talk about what it means and what we can do about it.",
    tip: "Lean toward the screen as you type. This signals that the answer is coming and builds mild anticipation.",
  },
  {
    title: "Enter the inputs live",
    timing: "1:00 – 2:00",
    script: "Tell me — how old are you today? And when are you hoping to retire? Good. What would you say your retirement savings are right now, ballpark? And roughly what do you think you'd want to spend each year in retirement?",
    tip: "Type as they answer. Don't pre-fill before the meeting — entering the numbers together makes it feel personal and real.",
  },
  {
    title: "Show the projection",
    timing: "2:00 – 2:30",
    script: "Here's the picture. This line is your projected portfolio balance from today through age 100. This dashed line is when you retire. If the line stays above zero the whole way, you're in good shape. If it dips below — that's the conversation we need to have.",
    tip: "Point at the chart physically if you're in person, or use your cursor if on screen. Don't rush past this moment.",
  },
  {
    title: "Run one scenario",
    timing: "2:30 – 3:30",
    script: "Now watch what happens if we make just one small change. What if you worked two more years — retired at [X] instead of [Y]? Look at that. The picture changes significantly. That's two years of work that could mean a decade of security.",
    tip: "Use the 'Retire Later' scenario card for this. The instant visual update is the most impactful moment — let them absorb it.",
  },
  {
    title: "Invite the conversation",
    timing: "3:30 – 5:00",
    script: "This is a simplified model — it doesn't include Social Security, taxes, or everything we'd put into a full plan. But this is the foundation. What's jumping out at you right now? What questions does this raise for you?",
    tip: "Hand the conversation back to them. Your job here is to listen, not explain. The chart has already done the heavy lifting.",
  },
  {
    title: "Close toward next steps",
    timing: "5:00 – 5:30",
    script: "What I'd like to do is take these numbers, build out a full plan with all the details, and come back to you with a real picture and a set of options. Does that sound like a useful next step?",
    tip: "If they say yes, schedule the follow-up before they leave. If they hesitate, run one more scenario — usually Spend Less — and let the chart close the gap.",
  },
];

const OBJECTIONS = [
  {
    objection: "These numbers seem too simple.",
    response: "They are simple — intentionally. This is the 30,000-foot view. The full plan includes taxes, Social Security, healthcare, and everything else. This is just the starting conversation.",
  },
  {
    objection: "I'm not sure what my retirement spending will be.",
    response: "That's completely normal. Let's use your current spending as a starting point and then stress-test it a little. The goal right now is to understand the range, not pin down the exact number.",
  },
  {
    objection: "The market could be different from that return assumption.",
    response: "Absolutely — let me show you what happens if we drop the return by a couple of percent. That's exactly why we stress-test. You want to know where the edges are before you need them.",
  },
  {
    objection: "I thought I was in better shape than this.",
    response: "You may well be — this is a baseline. The full plan typically looks better because it accounts for Social Security and other income. Let's build that picture together.",
  },
];

// Print summary component

function PrintSummary({
  clientName, ageNow, retireAge, currentSavings, annualContributions, annualReturn,
  retirementSpending, ssIncome, otherRetirementIncome, inflation, projection, scenarioData, resultMessage, today,
}: {
  clientName: string;
  ageNow: number; retireAge: number; currentSavings: number; annualContributions: number;
  annualReturn: number; retirementSpending: number; ssIncome: number; otherRetirementIncome: number; inflation: number;
  projection: { rows: { age: number; balance: number }[]; depletionAge: number | null; finalBalance: number };
  scenarioData: { age: number; "Base Case": number; "Retire Later": number; "Spend Less": number; "Stress Return": number }[];
  resultMessage: string; today: string;
}) {
  const fmt = (v: number) => `$${Number(v).toLocaleString()}`;
  const isRisk = !!projection.depletionAge;

  const inputs = [
    { label: "Current Age", value: `${ageNow}` },
    { label: "Retirement Age", value: `${retireAge}` },
    { label: "Portfolio Savings", value: fmt(currentSavings) },
    { label: "Pre-retirement Contributions", value: fmt(annualContributions) },
    { label: "Annual Return", value: `${annualReturn}%` },
    { label: "Retirement Spending", value: fmt(retirementSpending) },
    { label: "SS / Retirement Income", value: fmt(ssIncome) },
    { label: "Other Retirement Income", value: fmt(otherRetirementIncome) },
    { label: "Spending Inflation", value: `${inflation}%` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
            FinCast Reva — Retirement Projection Summary{clientName ? `: ${clientName}` : ""}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Prepared {today} · For advisor use only · Not a guarantee of future results
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            No client data was saved or retained in the preparation of this document.
          </div>
        </div>
        <div style={{
          padding: "6px 14px",
          borderRadius: 999,
          background: isRisk ? "#fef3c7" : "#d1fae5",
          color: isRisk ? "#92400e" : "#065f46",
          fontWeight: 600,
          fontSize: 13,
        }}>
          {isRisk ? "⚠ Depletion Risk" : "✓ On Track"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14 }}>
        {/* Left column: inputs + talking points */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Inputs table */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Client Assumptions
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <tbody>
                {inputs.map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "4px 0", color: "#64748b" }}>{label}</td>
                    <td style={{ padding: "4px 0", fontWeight: 600, textAlign: "right", color: "#0f172a" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Outcome box */}
          <div style={{
            background: isRisk ? "#fffbeb" : "#f0fdf4",
            border: `1px solid ${isRisk ? "#fcd34d" : "#86efac"}`,
            borderRadius: 8,
            padding: "10px 12px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: isRisk ? "#92400e" : "#166534", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Projection Outcome
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isRisk ? "#b45309" : "#15803d", lineHeight: 1.35 }}>
              {resultMessage}
            </div>
            {!isRisk && projection.finalBalance > 0 && (
              <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>
                Est. balance at age 100: {fmt(projection.finalBalance)}
              </div>
            )}
          </div>

          {/* Talking points */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
              Advisor Talking Points
            </div>
            {[
              "This chart shows projected portfolio balance from today through age 100.",
              isRisk
                ? `At the current pace, savings may be exhausted around age ${projection.depletionAge}. Adjusting retirement age, spending, or return assumptions can significantly change the outlook.`
                : "Based on these assumptions, the portfolio is projected to remain positive. Stress-testing scenarios helps clients understand the margin of safety.",
              "Small changes — retiring 1-2 years later or reducing annual spending by 5-10% — can meaningfully extend portfolio life.",
            ].map((point, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 12.5, color: "#334155", lineHeight: 1.45 }}>
                <span style={{ color: "#94a3b8", flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Projected Portfolio Balance — All Scenarios (Age {ageNow}–100)
          </div>
          <div>
            <LineChart
              width={820}
              height={420}
              data={scenarioData}
              margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis
                dataKey="age"
                type="number"
                domain={[ageNow, 100]}
                ticks={[60, 65, 70, 75, 80, 85, 90, 95, 100]}
                tick={{ fontSize: 15, fill: "#0f172a", fontWeight: 600 }}
                tickMargin={4}
                stroke="#475569"
                height={32}
              />
              <YAxis
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                tick={{ fontSize: 15, fill: "#0f172a", fontWeight: 600 }}
                tickMargin={8}
                stroke="#475569"
                width={68}
              />
              <ReferenceLine x={retireAge} stroke="#475569" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Retire", fontSize: 15, fill: "#0f172a", fontWeight: 700 }} />
              <Line type="monotone" dataKey="Base Case"     stroke="#1e3a8a" strokeWidth={4} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Retire Later"  stroke="#047857" strokeWidth={3} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
              <Line type="monotone" dataKey="Spend Less"    stroke="#6d28d9" strokeWidth={3} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
              <Line type="monotone" dataKey="Stress Return" stroke="#c2410c" strokeWidth={3} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
            </LineChart>
          </div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 20px",
            paddingTop: 12,
            fontSize: 14,
            fontWeight: 600,
            color: "#0f172a",
          }}>
            {[
              { label: `Base Case ($${(retirementSpending/1000).toFixed(0)}k/yr spend)`, color: "#1e3a8a", dashed: false },
              { label: `Retire Later (age ${Math.min(retireAge + 2, 75)})`, color: "#047857", dashed: true },
              { label: `Spend Less ($${(Math.max(retirementSpending - 10000, 40000)/1000).toFixed(0)}k/yr spend)`, color: "#6d28d9", dashed: true },
              { label: `Stress Return (${(Math.max(annualReturn - 1, 0.1)).toFixed(1)}% return)`, color: "#c2410c", dashed: true },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="26" height="10">
                  <line
                    x1="0" y1="5" x2="26" y2="5"
                    stroke={item.color}
                    strokeWidth={item.dashed ? 3 : 4}
                    strokeDasharray={item.dashed ? "6 3" : undefined}
                  />
                </svg>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{
            fontSize: 10.5,
            color: "#94a3b8",
            borderTop: "1px solid #e2e8f0",
            paddingTop: 6,
            lineHeight: 1.45,
          }}>
            This projection is based on the assumptions entered above and uses a straight-line return model. It does not account for taxes, investment fees, or income sources beyond those entered. This document is for illustrative and discussion purposes only and does not constitute financial advice. Past performance is not indicative of future results.
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function InputRow({ label, value, setValue, prefix = "" }: {
  label: string; value: number; setValue: (v: number) => void; prefix?: string;
}) {
  return (
    <label className="grid grid-cols-[1fr_150px] gap-3 items-center">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-2.5 text-slate-400">{prefix}</span>}
        <Input
          className={`rounded-xl ${prefix ? "pl-7" : ""}`}
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </div>
    </label>
  );
}

function SliderRow({ label, value, setValue, min, max, step = 1, prefix = "", suffix = "", decimals = 0 }: {
  label: string; value: number; setValue: (v: number) => void;
  min: number; max: number; step?: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const display = decimals > 0 ? Number(value).toFixed(decimals) : Number(value).toLocaleString();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold">{prefix}{display}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => setValue(v[0])} />
    </div>
  );
}

function ScenarioCard({ title, body, action }: { title: string; body: string; action: () => void }) {
  return (
    <button
      onClick={action}
      className="text-left rounded-2xl border border-slate-200 p-5 hover:bg-slate-50 transition"
    >
      <div className="font-semibold text-lg">{title}</div>
      <p className="text-sm text-slate-600 mt-2">{body}</p>
    </button>
  );
}
