"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Calendar, TrendingDown, ShieldCheck, RefreshCw, MousePointer2 } from "lucide-react";

export default function FinCastSelfDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const narrationSteps = [
    {
      title: "The Hook",
      voice: "Will your client run out of money? FinCast helps advisors transform a difficult retirement discussion into a calm, clear visual conversation in under sixty seconds.",
    },
    {
      title: "Client Inputs",
      voice: "Next, the advisor enters just the essentials. Age, retirement age, savings, annual savings, return, spending, and inflation. The goal is to keep the conversation simple and comfortable.",
    },
    {
      title: "Instant Projection",
      voice: "FinCast gently illustrates whether the client remains financially secure throughout retirement, or may eventually approach a projected depletion point.",
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

  const nextStep = () => setDemoStep((s) => (s + 1) % narrationSteps.length);
  const startAutoDemo = () => {
    window?.speechSynthesis?.cancel?.();
    setDemoStep(0);
    setIsAutoPlaying(true);
  };
  const stopAutoDemo = () => {
    window?.speechSynthesis?.cancel?.();
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(narrationSteps[demoStep].voice);
      utterance.rate = 0.68;
      utterance.pitch = 0.96;
      utterance.volume = 0.86;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) =>
        v.name.includes("Serena") ||
        v.name.includes("Samantha") ||
        v.name.includes("Karen") ||
        v.name.includes("Moira") ||
        v.name.includes("Tessa") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Google US English Female")
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onend = () => {
        if (isAutoPlaying) {
          setTimeout(() => {
            setDemoStep((s) => {
              if (s >= narrationSteps.length - 1) {
                setIsAutoPlaying(false);
                return s;
              }
              return s + 1;
            });
          }, 1400);
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [demoStep, isAutoPlaying]);

  const [ageNow, setAgeNow] = useState(58);
  const [retireAge, setRetireAge] = useState(67);
  const [currentSavings, setCurrentSavings] = useState(850000);
  const [annualSavings, setAnnualSavings] = useState(35000);
  const [annualReturn, setAnnualReturn] = useState(6);
  const [retirementSpending, setRetirementSpending] = useState(95000);
  const [inflation, setInflation] = useState(3);

  const projection = useMemo(() => {
    const rows = [];
    let balance = Number(currentSavings || 0);
    let savings = Number(annualSavings || 0);
    let spend = Number(retirementSpending || 0);
    const r = Number(annualReturn || 0) / 100;
    const inf = Number(inflation || 0) / 100;
    let depletionAge = null;

    for (let age = Number(ageNow); age <= 95; age++) {
      if (age < Number(retireAge)) {
        balance = balance * (1 + r) + savings;
        savings = savings * 1.03;
      } else {
        balance = balance * (1 + r) - spend;
        spend = spend * (1 + inf);
      }

      if (balance <= 0 && depletionAge === null) {
        depletionAge = age;
        balance = 0;
      }

      rows.push({
        age,
        balance: Math.round(balance),
        label: `$${Math.max(balance, 0).toLocaleString()}`,
      });

      if (depletionAge !== null && age > depletionAge + 3) break;
    }

    const finalBalance = rows[rows.length - 1]?.balance || 0;
    return { rows, depletionAge, finalBalance };
  }, [ageNow, retireAge, currentSavings, annualSavings, annualReturn, retirementSpending, inflation]);

  const resultMessage = projection.depletionAge
    ? `Projected depletion at age ${projection.depletionAge}`
    : `Projected balance remains positive through age 95`;

  const riskTone = projection.depletionAge ? "text-amber-700" : "text-emerald-700";

  const currency = (value: number) => `$${Number(value || 0).toLocaleString()}`;

  const pointerPositions = [
    { top: "90px", left: "90px" },
    { top: "640px", left: "180px" },
    { top: "210px", right: "120px" },
    { top: "760px", right: "220px" },
    { bottom: "120px", right: "120px" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 p-4 md:p-8 relative overflow-hidden">
      <motion.div
        className="fixed z-50 text-slate-900"
        animate={pointerPositions[demoStep]}
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
          className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch"
        >
          <Card className={`rounded-2xl shadow-sm border-slate-200 bg-white ${demoStep === 0 ? "ring-4 ring-slate-300" : ""}`}>
            <CardContent className="p-7 md:p-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                <ShieldCheck className="w-4 h-4" /> FinCast RIA Self-Demo
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
                  Will your client run out of money?
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
                  FinCast helps advisors turn retirement uncertainty into a simple visual conversation in under 60 seconds.
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
                <div className="text-sm text-slate-300">{isAutoPlaying ? "Auto-playing" : "Narrated Demo"} · Step {demoStep + 1} of {narrationSteps.length}</div>
                <div className="text-xl font-semibold">{narrationSteps[demoStep].title}</div>
                <p className="text-slate-200 text-sm leading-relaxed">“{narrationSteps[demoStep].voice}”</p>
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
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden ${demoStep === 2 ? "ring-4 ring-slate-300" : ""}`}>
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

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projection.rows} margin={{ top: 18, right: 18, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => currency(Number(value))} labelFormatter={(label) => `Age ${label}`} />
                    <ReferenceLine x={retireAge} label="Retire" strokeDasharray="4 4" />
                    {projection.depletionAge && (
                      <ReferenceLine x={projection.depletionAge} label="Depletion" strokeDasharray="4 4" />
                    )}
                    <Line
                      type="monotone"
                      dataKey="balance"
                      strokeWidth={4}
                      dot={false}
                      animationDuration={900}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 flex items-center gap-3 text-slate-700">
                <TrendingDown className="w-5 h-5" />
                <p className="text-sm">
                  Advisor talking point: “This is the moment clients understand retirement survivability without reading a 40-page report.”
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6">
          <Card className={`rounded-2xl shadow-sm border-slate-200 bg-white ${demoStep === 1 ? "ring-4 ring-slate-300" : ""}`}>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Client Inputs</h2>
                <RefreshCw className="w-5 h-5 text-slate-500" />
              </div>

              <InputRow label="Current age" value={ageNow} setValue={setAgeNow} />
              <InputRow label="Retirement age" value={retireAge} setValue={setRetireAge} />
              <InputRow label="Current savings" value={currentSavings} setValue={setCurrentSavings} prefix="$" />
              <InputRow label="Annual savings" value={annualSavings} setValue={setAnnualSavings} prefix="$" />

              <div className="space-y-3 pt-2">
                <SliderRow label="Annual return" value={annualReturn} setValue={setAnnualReturn} min={2} max={10} suffix="%" />
                <SliderRow label="Retirement spending" value={retirementSpending} setValue={setRetirementSpending} min={50000} max={180000} step={5000} prefix="$" />
                <SliderRow label="Spending inflation" value={inflation} setValue={setInflation} min={1} max={6} suffix="%" />
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-2xl shadow-sm border-slate-200 bg-white ${demoStep === 3 || demoStep === 4 ? "ring-4 ring-slate-300" : ""}`}>
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
                  body="Reduce assumed return to test downside sensitivity in a client-friendly way."
                  action={() => setAnnualReturn((v) => Math.max(v - 1, 1))}
                />
              </div>

              <div className="rounded-2xl bg-slate-950 text-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div>
                  <div className="text-sm text-slate-300">Advisor CTA</div>
                  <div className="text-2xl font-semibold">See how FinCast works in a client meeting.</div>
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
    </div>
  );
}

function InputRow({
  label,
  value,
  setValue,
  prefix = "",
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  prefix?: string;
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

function SliderRow({
  label,
  value,
  setValue,
  min,
  max,
  step = 1,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold">{prefix}{Number(value).toLocaleString()}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => setValue(v[0])} />
    </div>
  );
}

function ScenarioCard({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: () => void;
}) {
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
