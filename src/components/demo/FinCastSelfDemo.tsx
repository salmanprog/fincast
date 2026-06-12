"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import jsPDF from "jspdf";

// ── Types (from finCastReva) ─────────────────────────────────────────────────

interface ClientInputs {
  name: string;
  ageNow: number;
  retireAge: number;
  savings: number;
  contrib: number;
  annReturn: number;
  spend: number;
  ss: number;
  other: number;
  infl: number;
}

interface ScenarioResult {
  rows: number[];
  dep: number | null;
}

interface ProjectionData {
  ages: number[];
  base: ScenarioResult;
  retireLater: ScenarioResult;
  spendLess: ScenarioResult;
  stressReturn: ScenarioResult;
}

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  voice: string;
  highlight: "inputs" | "result" | "scenarios" | "summary" | null;
  action: "runProjection" | null;
}

interface ResultCardHandle {
  getChartImage: () => string | null;
}

// ── Calculations (from finCastReva) ──────────────────────────────────────────

const DEFAULT_INPUTS: ClientInputs = {
  name: "",
  ageNow: 58,
  retireAge: 67,
  savings: 850000,
  contrib: 35000,
  annReturn: 6,
  spend: 130000,
  ss: 24000,
  other: 0,
  infl: 3,
};

function calcScen(inp: ClientInputs, rAge: number, ret: number, spend: number): ScenarioResult {
  const rows: number[] = [];
  let bal = inp.savings;
  let c = inp.contrib;
  let spd = spend;
  const r = ret / 100;
  const inf = inp.infl / 100;
  let dep: number | null = null;

  for (let age = inp.ageNow; age <= 100; age++) {
    if (age < rAge) {
      bal = bal * (1 + r) + c;
      c *= 1.03;
    } else {
      const net = Math.max(spd - inp.ss - inp.other, 0);
      bal = bal * (1 + r) - net;
      spd *= 1 + inf;
    }
    if (bal <= 0 && dep === null) {
      dep = age;
      bal = 0;
    }
    if (dep !== null) bal = 0;
    rows.push(Math.round(bal));
  }
  return { rows, dep };
}

function buildAll(inp: ClientInputs): ProjectionData {
  const ages: number[] = [];
  for (let a = inp.ageNow; a <= 100; a++) ages.push(a);
  return {
    ages,
    base: calcScen(inp, inp.retireAge, inp.annReturn, inp.spend),
    retireLater: calcScen(inp, Math.min(inp.retireAge + 2, 75), inp.annReturn, inp.spend),
    spendLess: calcScen(inp, inp.retireAge, inp.annReturn, Math.max(inp.spend - 10000, 40000)),
    stressReturn: calcScen(inp, inp.retireAge, Math.max(inp.annReturn - 1, 0.1), inp.spend),
  };
}

function fmtMoney(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

// ── PDF export (from finCastReva) ───────────────────────────────────────────

function generatePDF(
  inputs: ClientInputs,
  projection: ProjectionData,
  chartImg: string | null
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 16;
  const CW = W - M * 2;
  let y = 0;

  doc.setFillColor(11, 15, 26);
  doc.rect(0, 0, W, 42, "F");
  doc.setFillColor(29, 158, 117);
  doc.rect(0, 38, W, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("FinCast Reva", M, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 160, 180);
  doc.text("Retirement Survivability Report", M, 27);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generated: ${today}`, W - M, 27, { align: "right" });
  y = 54;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(inputs.name ? `Client: ${inputs.name}` : "Client: Anonymous", M, y);
  y += 6;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;

  const atRisk = projection.base.dep !== null;
  if (atRisk) doc.setFillColor(252, 235, 235);
  else doc.setFillColor(234, 243, 222);
  doc.roundedRect(M, y, CW, 13, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  if (atRisk) {
    doc.setTextColor(163, 45, 45);
    doc.text(`Projected depletion at age ${projection.base.dep}`, M + 5, y + 8);
  } else {
    doc.setTextColor(59, 109, 17);
    doc.text("Portfolio remains positive through age 100", M + 5, y + 8);
  }
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Assumptions", M, y);
  y += 5;

  const rows: [string, string][] = [
    ["Current Age", `${inputs.ageNow}`],
    ["Planned Retirement Age", `${inputs.retireAge}`],
    ["Portfolio Savings", fmtMoney(inputs.savings)],
    ["Annual Contributions", `${fmtMoney(inputs.contrib)} / yr`],
    ["Expected Annual Return", `${inputs.annReturn.toFixed(1)}%`],
    ["Retirement Spending", `${fmtMoney(inputs.spend)} / yr`],
    ["SS / Retirement Income", `${fmtMoney(inputs.ss)} / yr`],
    ["Other Income", `${fmtMoney(inputs.other)} / yr`],
    ["Spending Inflation", `${inputs.infl.toFixed(1)}%`],
  ];

  rows.forEach(([label, value], i) => {
    const ry = y + i * 8;
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(M, ry - 3, CW, 8, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, M + 3, ry + 2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(value, M + CW / 2 + 3, ry + 2);
  });
  y += rows.length * 8 + 6;

  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, W - M, y);
  y += 8;

  if (chartImg) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Portfolio Projection", M, y);
    y += 4;
    doc.addImage(chartImg, "PNG", M, y, CW, 65);
    y += 72;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Scenario Comparison", M, y);
  y += 5;

  const colW = CW / 4;
  doc.setFillColor(11, 15, 26);
  doc.rect(M, y - 3, CW, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  ["Scenario", "Depletion", "Balance @ 85", "Status"].forEach((h, i) => {
    doc.text(h, M + i * colW + 2, y + 3);
  });
  y += 9;

  const scens = [
    { name: "Base Case", res: projection.base },
    { name: "Retire Later (+2 yrs)", res: projection.retireLater },
    { name: "Spend Less (−$10k/yr)", res: projection.spendLess },
    { name: "Stress Return (−1%)", res: projection.stressReturn },
  ];

  const idx85 = projection.ages.indexOf(85);

  scens.forEach((sc, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(M, y - 3, CW, 9, "F");
    }
    const bal85 = idx85 >= 0 ? sc.res.rows[idx85] : 0;
    const cells = [
      sc.name,
      sc.res.dep ? `Age ${sc.res.dep}` : "None",
      fmtMoney(bal85),
      sc.res.dep ? "At Risk" : "On Track",
    ];
    cells.forEach((cell, j) => {
      doc.setFont("helvetica", j === 0 ? "bold" : "normal");
      doc.setFontSize(8);
      if (j === 3) {
        doc.setTextColor(...(sc.res.dep ? [163, 45, 45] : [59, 109, 17]) as [number, number, number]);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(cell, M + j * colW + 2, y + 3);
    });
    y += 9;
  });

  y += 8;

  const base85 = idx85 >= 0 ? projection.base.rows[idx85] : 0;
  const rl85 = idx85 >= 0 ? projection.retireLater.rows[idx85] : 0;
  const diff = rl85 - base85;
  const stats = [
    { label: "Base Case at 85", value: fmtMoney(base85) },
    {
      label: "Depletion Age",
      value: projection.base.dep ? `Age ${projection.base.dep}` : "Age 100+",
    },
    { label: "Retire Later Saves", value: diff > 0 ? `+${fmtMoney(diff)}` : "No change" },
  ];
  const sw = CW / 3;
  stats.forEach((s, i) => {
    const bx = M + i * sw;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(bx, y, sw - 3, 18, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(s.label, bx + 3, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(s.value, bx + 3, y + 13);
  });
  y += 26;

  doc.setFillColor(248, 250, 252);
  doc.rect(M, y, CW, 20, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const disc =
    "This report is generated by FinCast Reva for illustrative purposes only and does not constitute financial advice. " +
    "Projections are hypothetical and based on the assumptions entered. Actual results will vary. " +
    "Consult a qualified financial advisor for personalized guidance.";
  doc.text(doc.splitTextToSize(disc, CW - 6), M + 3, y + 6);

  doc.setFillColor(11, 15, 26);
  doc.rect(0, 285, W, 12, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 120);
  doc.text("FinCast Reva — Advisor Retirement Visualization Tool", M, 293);
  doc.text("Page 1", W - M, 293, { align: "right" });

  doc.save(`FinCast_Reva_${inputs.name || "Client"}_${new Date().getFullYear()}.pdf`);
}

// ── Chart drawing (canvas, no chart.js — matches finCastReva ResultCard) ─────

const CHART_COLORS = ["#185FA5", "#1D9E75", "#534AB7", "#BA7517"];
const CHART_LABELS = ["Base Case", "Retire Later", "Spend Less", "Stress Return"];
const CHART_DASHES: number[][] = [[], [8, 4], [6, 3], [4, 4]];

function makeSlice(arr: number[], idx: number, prog: number, total: number): (number | null)[] {
  const cut = Math.floor(Math.max(0, Math.min(1, prog - idx)) * total);
  return [...arr.slice(0, cut), ...Array(total - cut).fill(null)];
}

function drawProjectionChart(canvas: HTMLCanvasElement, sd: ProjectionData, prog: number) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width;
  const H = rect.height;
  const pad = { l: 52, r: 12, t: 14, b: 28 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  const srcs = [sd.base.rows, sd.retireLater.rows, sd.spendLess.rows, sd.stressReturn.rows];
  const total = sd.ages.length;
  let yMax = 1;
  srcs.forEach((arr) => arr.forEach((v) => { if (v > yMax) yMax = v; }));

  const xAt = (i: number) => pad.l + (i / Math.max(total - 1, 1)) * plotW;
  const yAt = (v: number) => pad.t + plotH - (v / yMax) * plotH;

  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const gy = pad.t + (g / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.l, gy);
    ctx.lineTo(W - pad.r, gy);
    ctx.stroke();
  }

  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "center";
  const tickCount = 9;
  for (let t = 0; t < tickCount; t++) {
    const i = Math.round((t / (tickCount - 1)) * (total - 1));
    ctx.fillText(String(sd.ages[i]), xAt(i), H - 8);
  }

  ctx.textAlign = "right";
  for (let g = 0; g <= 4; g++) {
    const val = yMax * (1 - g / 4);
    const label =
      val >= 1_000_000
        ? `$${(val / 1_000_000).toFixed(1)}M`
        : `$${Math.round(val / 1000)}k`;
    ctx.fillText(label, pad.l - 6, yAt(val) + 3);
  }

  const baseSlice = makeSlice(srcs[0], 0, prog, total);
  if (baseSlice.some((v) => v !== null && v > 0)) {
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < total; i++) {
      const v = baseSlice[i];
      if (v === null) break;
      const x = xAt(i);
      const y = yAt(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    if (started) {
      const lastIdx = baseSlice.findIndex((v) => v === null);
      const end = lastIdx === -1 ? total - 1 : lastIdx - 1;
      ctx.lineTo(xAt(end), yAt(0));
      ctx.lineTo(xAt(0), yAt(0));
      ctx.closePath();
      ctx.fillStyle = "rgba(24,95,165,0.12)";
      ctx.fill();
    }
  }

  srcs.forEach((arr, lineIdx) => {
    const slice = makeSlice(arr, lineIdx, prog, total);
    ctx.beginPath();
    ctx.strokeStyle = CHART_COLORS[lineIdx];
    ctx.lineWidth = lineIdx === 0 ? 3 : 2;
    ctx.setLineDash(CHART_DASHES[lineIdx]);
    let started = false;
    for (let i = 0; i < total; i++) {
      const v = slice[i];
      if (v === null) break;
      const x = xAt(i);
      const y = yAt(v);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else ctx.lineTo(x, y);
    }
    if (started) ctx.stroke();
    ctx.setLineDash([]);
  });
}

// ── Scoped styles (from finCastReva index.css + tailwind.config) ─────────────

const REVA_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap');
.fincast-reva-demo { font-family: Inter, sans-serif; }
.fincast-reva-demo .font-serif { font-family: "DM Serif Display", serif; }
.fincast-reva-demo input[type='range'] { width: 100%; cursor: pointer; accent-color: #185FA5; }
.fincast-reva-demo input[type='range']::-webkit-slider-thumb { cursor: grab; }
.fincast-reva-demo input[type='range']::-webkit-slider-thumb:active { cursor: grabbing; }
@keyframes reva-voice-wave { 0%, 100% { height: 4px; } 50% { height: 18px; } }
.fincast-reva-demo .reva-voice-bar { animation: reva-voice-wave var(--dur, 0.45s) ease-in-out infinite; }
.fincast-reva-demo .reva-card-glow {
  box-shadow: 0 0 0 2px #1D9E75, 0 0 20px 4px rgba(29,158,117,0.25);
  border-color: #1D9E75 !important;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
@keyframes reva-orb1 {
  0%, 100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(35px,-25px) scale(1.08); }
  66% { transform: translate(-20px,18px) scale(0.94); }
}
@keyframes reva-orb2 {
  0%, 100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(-30px,22px) scale(1.1); }
}
@keyframes reva-orb3 {
  0%, 100% { transform: translate(0,0); }
  50% { transform: translate(22px,-18px); }
}
@keyframes reva-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.6); }
}
@keyframes reva-fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes reva-slide-up {
  from { opacity: 0; transform: translateY(100%); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes reva-progress { from { width: 0%; } to { width: 100%; } }
.fincast-reva-demo .reva-animate-orb1 { animation: reva-orb1 22s ease-in-out infinite; }
.fincast-reva-demo .reva-animate-orb2 { animation: reva-orb2 28s ease-in-out infinite; }
.fincast-reva-demo .reva-animate-orb3 { animation: reva-orb3 19s ease-in-out infinite; }
.fincast-reva-demo .reva-animate-pulse-dot { animation: reva-pulse-dot 2s ease-in-out infinite; }
.fincast-reva-demo .reva-animate-fade-up { animation: reva-fade-up 0.5s ease both; }
.fincast-reva-demo .reva-animate-slide-up { animation: reva-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both; }
.fincast-reva-demo .reva-animate-progress { animation: reva-progress linear forwards; }
@media (prefers-reduced-motion: reduce) {
  .fincast-reva-demo *, .fincast-reva-demo *::before, .fincast-reva-demo *::after {
    animation: none !important; transition: none !important;
  }
}
`;

const STEP_DURATION = 9000;

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: "Welcome to FinCast Reva",
    description: "A visual retirement survivability tool for RIA advisors.",
    voice:
      "Welcome to FinCast Reva. This tool helps financial advisors transform a difficult retirement conversation into a clear visual experience in under 60 seconds. No complex reports needed. Let me walk you through the tool step by step.",
    highlight: null,
    action: null,
  },
  {
    id: 1,
    title: "Enter Client Details",
    description: "Fill in age, savings, spending, and return assumptions.",
    voice:
      "Start in the client inputs panel on the right. Enter the client's current age, planned retirement age, and total portfolio savings. Then use the sliders to configure their expected annual return, retirement spending level, Social Security income, other income sources, and the inflation rate for spending.",
    highlight: "inputs",
    action: null,
  },
  {
    id: 2,
    title: "Run the Projection",
    description: "Watch four scenario lines animate into the chart.",
    voice:
      "Now run the projection. Watch as four scenario lines animate in simultaneously. The solid blue line is the base case. The dashed green line shows retiring two years later. The purple line shows spending ten thousand less per year, and the amber line shows a stressed one percent lower return scenario.",
    highlight: "result",
    action: "runProjection",
  },
  {
    id: 3,
    title: "Explore Scenarios",
    description: "Click any scenario card to instantly update the chart.",
    voice:
      "Now explore the scenario conversation cards on the left. Clicking Retire Later, Spend Less, or Stress Return instantly updates both the inputs and recalculates the projection. These visual comparisons help clients immediately grasp how a single decision shifts their entire retirement outcome.",
    highlight: "scenarios",
    action: null,
  },
  {
    id: 4,
    title: "Review Summary and Download",
    description: "Check the key stats and generate a client-ready PDF report.",
    voice:
      "Finally, review the live summary panel. You can see the base case portfolio balance at age 85, the projected depletion age if applicable, and how much retiring two years later improves outcomes. When ready, click Download PDF to generate a professional client report summarizing the entire analysis.",
    highlight: "summary",
    action: null,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroSection({
  isHighlighted,
  tutorialStep,
  isAutoPlaying,
  isSpeaking,
  steps,
  onStartAuto,
  onStopAuto,
  onNextStep,
}: {
  isHighlighted: boolean;
  tutorialStep: number;
  isAutoPlaying: boolean;
  isSpeaking: boolean;
  steps: TutorialStep[];
  onStartAuto: () => void;
  onStopAuto: () => void;
  onNextStep: () => void;
}) {
  const step = steps[tutorialStep];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
        isHighlighted ? "reva-card-glow" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[#0B0F1A]" />
      <div className="absolute w-[360px] h-[360px] rounded-full bg-[#185FA5] opacity-[0.16] -top-24 -left-16 blur-[70px] reva-animate-orb1 pointer-events-none" />
      <div className="absolute w-[280px] h-[280px] rounded-full bg-[#534AB7] opacity-[0.16] top-0 -right-12 blur-[60px] reva-animate-orb2 pointer-events-none" />
      <div className="absolute w-[220px] h-[220px] rounded-full bg-[#0F6E56] opacity-[0.13] -bottom-14 left-[42%] blur-[65px] reva-animate-orb3 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 p-8 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        <div className="reva-animate-fade-up">
          <div className="inline-flex items-center gap-2 border border-white/15 rounded-full px-3.5 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5DCAA5] reva-animate-pulse-dot" />
            <span className="text-[11px] text-white/60 font-medium tracking-[0.04em]">
              FinCast Reva — RIA self-demo
            </span>
          </div>
          <h1 className="font-serif text-4xl lg:text-[42px] leading-[1.1] text-white mb-3">
            Will your client
            <br />
            <span className="bg-gradient-to-r from-[#1D9E75] to-[#5DCAA5] bg-clip-text text-transparent">
              run out of money?
            </span>
          </h1>
          <p className="text-[14px] text-white/50 leading-relaxed max-w-[340px] mb-6">
            Turn retirement uncertainty into a clear visual conversation in under 60 seconds — no 40-page report needed.
          </p>
          <div className="flex items-center gap-5">
            {[
              { n: "60s", l: "to clarity" },
              { n: "Live", l: "scenario edits" },
              { n: "Visual", l: "depletion risk" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-5">
                {i > 0 && <div className="w-px h-8 bg-white/10" />}
                <div className="text-center">
                  <div className="text-2xl font-semibold text-white">{s.n}</div>
                  <div className="text-[11px] text-white/35 mt-0.5">{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reva-animate-fade-up" style={{ animationDelay: "150ms" }}>
          <div className="bg-white/[0.07] border border-white/12 rounded-2xl p-5 mb-4 min-h-[130px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-white/35 tracking-[0.07em] uppercase font-medium">
                Step {tutorialStep + 1} of {steps.length}
              </span>
              {isSpeaking && (
                <div className="flex items-end gap-[3px] h-3.5 ml-1">
                  {[0.45, 0.35, 0.55, 0.4, 0.5].map((dur, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-[#5DCAA5] reva-voice-bar"
                      style={
                        { "--dur": `${dur}s`, animationDelay: `${i * 0.08}s` } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="text-[15px] font-medium text-white mb-1.5">{step.title}</div>
            <div className="text-[13px] text-white/50 italic leading-relaxed">
              &ldquo;{step.description}&rdquo;
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isAutoPlaying ? (
              <>
                <button
                  type="button"
                  onClick={onStartAuto}
                  className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Auto tutorial
                </button>
                <button
                  type="button"
                  onClick={onNextStep}
                  className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-[13px] font-medium px-4 py-2.5 rounded-xl border border-white/12 transition-all active:scale-95"
                >
                  Next step
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStopAuto}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[13px] font-medium px-4 py-2.5 rounded-xl border border-red-500/30 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                Stop tutorial
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  id,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <label htmlFor={id} className="text-[12px] text-slate-500">
          {label}
        </label>
        <span className="text-[12px] font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
          {display}
        </span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5"
      />
    </div>
  );
}

function InputsCard({
  inputs,
  isHighlighted,
  onChange,
  onReset,
}: {
  inputs: ClientInputs;
  isHighlighted: boolean;
  onChange: (inputs: ClientInputs) => void;
  onReset: () => void;
}) {
  const set = <K extends keyof ClientInputs>(key: K, v: ClientInputs[K]) =>
    onChange({ ...inputs, [key]: v });

  const fmtDollar = (v: number) => `$${Math.round(v).toLocaleString()} / yr`;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  return (
    <div
      className={`bg-white border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md ${
        isHighlighted ? "reva-card-glow border-[#1D9E75]" : "border-slate-200/80"
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#534AB7] rounded-t-2xl" />
      <div className="flex justify-between items-center mb-5 mt-1">
        <h2 className="text-[16px] font-semibold text-slate-900">Client inputs</h2>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-2 items-center mb-2">
        <label className="text-[12px] text-slate-500" htmlFor="clientName">
          Client name
        </label>
        <input
          id="clientName"
          type="text"
          placeholder="e.g. J. Smith"
          value={inputs.name}
          onChange={(e) => set("name", e.target.value)}
          className="text-[13px] px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      {(
        [
          ["Current age", "ageNow", 18, 85, 1],
          ["Retirement age", "retireAge", 50, 80, 1],
          ["Portfolio savings ($)", "savings", 0, 5000000, 1000],
        ] as [string, keyof ClientInputs, number, number, number][]
      ).map(([lbl, key, mn, mx, stp]) => (
        <div key={key} className="grid grid-cols-[1fr_110px] gap-2 items-center mb-2">
          <label className="text-[12px] text-slate-500" htmlFor={key}>
            {lbl}
          </label>
          <input
            id={key}
            type="number"
            min={mn}
            max={mx}
            step={stp}
            value={inputs[key] as number}
            onChange={(e) => set(key, parseFloat(e.target.value) || 0)}
            className="text-[13px] px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      ))}

      <div className="border-t border-slate-100 my-3" />

      <SliderRow
        label="Pre-retirement contributions"
        id="contrib"
        min={0}
        max={100000}
        step={1000}
        value={inputs.contrib}
        display={fmtDollar(inputs.contrib)}
        onChange={(v) => set("contrib", v)}
      />
      <SliderRow
        label="Annual return"
        id="annReturn"
        min={0}
        max={12}
        step={0.1}
        value={inputs.annReturn}
        display={fmtPct(inputs.annReturn)}
        onChange={(v) => set("annReturn", v)}
      />
      <SliderRow
        label="Retirement spending"
        id="spend"
        min={50000}
        max={500000}
        step={5000}
        value={inputs.spend}
        display={fmtDollar(inputs.spend)}
        onChange={(v) => set("spend", v)}
      />
      <SliderRow
        label="SS / retirement income"
        id="ss"
        min={0}
        max={60000}
        step={1000}
        value={inputs.ss}
        display={fmtDollar(inputs.ss)}
        onChange={(v) => set("ss", v)}
      />
      <SliderRow
        label="Other retirement income"
        id="other"
        min={0}
        max={100000}
        step={1000}
        value={inputs.other}
        display={fmtDollar(inputs.other)}
        onChange={(v) => set("other", v)}
      />
      <SliderRow
        label="Spending inflation"
        id="infl"
        min={0}
        max={8}
        step={0.1}
        value={inputs.infl}
        display={fmtPct(inputs.infl)}
        onChange={(v) => set("infl", v)}
      />
    </div>
  );
}

const ResultCard = forwardRef<ResultCardHandle, {
  projection: ProjectionData | null;
  hasRun: boolean;
  animateKey: number;
  isHighlighted: boolean;
  inputs: ClientInputs;
  onRun: () => void;
}>(function ResultCard(
  { projection, hasRun, animateKey, isHighlighted, inputs, onRun },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const animProgRef = useRef(0);

  useImperativeHandle(ref, () => ({
    getChartImage: () => canvasRef.current?.toDataURL("image/png") ?? null,
  }));

  useEffect(() => {
    if (!projection || !canvasRef.current) return;
    if (animateKey === 0) {
      drawProjectionChart(canvasRef.current, projection, 4);
    }
  }, [projection, animateKey]);

  useEffect(() => {
    if (!projection || animateKey === 0 || !canvasRef.current) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animProgRef.current = 0;
    const canvas = canvasRef.current;

    const step = () => {
      animProgRef.current += 0.055;
      if (animProgRef.current > 4) animProgRef.current = 4;
      drawProjectionChart(canvas, projection, animProgRef.current);
      if (animProgRef.current < 4) {
        animRef.current = requestAnimationFrame(step);
      }
    };
    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animateKey, projection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !projection) return;
    const ro = new ResizeObserver(() => {
      drawProjectionChart(canvas, projection, animProgRef.current || 4);
    });
    ro.observe(canvas.parentElement ?? canvas);
    return () => ro.disconnect();
  }, [projection]);

  const atRisk = !!projection?.base.dep;

  return (
    <div
      className={`bg-white border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md ${
        isHighlighted ? "reva-card-glow border-[#1D9E75]" : "border-slate-200/80"
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#185FA5] rounded-t-2xl" />
      <div className="text-[11px] font-medium text-slate-400 tracking-widest uppercase mb-3 mt-1">
        Instant result
      </div>

      <div className="flex justify-between items-start mb-4 gap-3">
        {!hasRun ? (
          <p className="text-[16px] font-medium text-slate-300">Run projection to see result</p>
        ) : atRisk ? (
          <p className="text-[17px] font-semibold text-red-700 leading-snug">
            Projected depletion at age {projection!.base.dep}
          </p>
        ) : (
          <p className="text-[17px] font-semibold text-emerald-700 leading-snug">
            Portfolio positive through age 100
          </p>
        )}
        {hasRun && (
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              atRisk
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {atRisk ? "Depletion risk" : "On track"}
          </span>
        )}
      </div>

      {!hasRun ? (
        <div className="h-[268px] flex flex-col items-center justify-center gap-3 border border-dashed border-slate-200 rounded-xl bg-slate-50">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-[13px] text-slate-400">Set assumptions, then run</p>
          <button
            type="button"
            onClick={onRun}
            className="flex items-center gap-2 bg-[#0B0F1A] hover:bg-[#185FA5] text-white text-[13px] font-medium px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Run projection
          </button>
        </div>
      ) : (
        <div className="relative w-full h-[268px]">
          <canvas ref={canvasRef} className="w-full h-full" aria-label="Portfolio projection chart across four scenarios" />
        </div>
      )}

      {hasRun && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
          {CHART_LABELS.map((lbl, i) => {
            let display = lbl;
            if (i === 0) display = `Base case ($${Math.round(inputs.spend / 1000)}k/yr)`;
            if (i === 1) display = `Retire later (age ${Math.min(inputs.retireAge + 2, 75)})`;
            if (i === 2)
              display = `Spend less ($${Math.round(Math.max(inputs.spend - 10000, 40000) / 1000)}k/yr)`;
            if (i === 3)
              display = `Stress return (${Math.max(inputs.annReturn - 1, 0.1).toFixed(1)}%)`;
            return (
              <div key={lbl} className="flex items-center gap-1.5">
                <div className="w-5 h-[3px] rounded-full" style={{ background: CHART_COLORS[i] }} />
                <span className="text-[11px] text-slate-500">{display}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2.5 bg-slate-50 border-l-[3px] border-[#1D9E75] rounded-r-xl p-3 mt-3">
        <p className="text-[12px] text-slate-500 italic leading-relaxed">
          &ldquo;This is the moment clients understand retirement survivability without reading a 40-page report.&rdquo;
        </p>
      </div>

      {hasRun && (
        <button
          type="button"
          onClick={onRun}
          className="mt-3 w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-[#185FA5] hover:text-[#185FA5] text-slate-500 text-[12px] font-medium py-2 rounded-xl transition-all"
        >
          Recalculate with animation
        </button>
      )}
    </div>
  );
});

function ScenariosCard({
  inputs,
  isHighlighted,
  onApply,
}: {
  inputs: ClientInputs;
  isHighlighted: boolean;
  onApply: (type: "retireLater" | "spendLess" | "stressReturn") => void;
}) {
  const cards = [
    {
      title: "Retire later",
      description: `Two more working years shifts retirement from ${inputs.retireAge} to ${Math.min(inputs.retireAge + 2, 75)}.`,
      accent: "bg-[#185FA5]",
      onClick: () => onApply("retireLater"),
    },
    {
      title: "Spend less",
      description: `Reducing spending by $10k/yr from $${Math.round(inputs.spend / 1000)}k to $${Math.round(Math.max(inputs.spend - 10000, 40000) / 1000)}k.`,
      accent: "bg-[#1D9E75]",
      onClick: () => onApply("spendLess"),
    },
    {
      title: "Stress return",
      description: `Dropping return 1% from ${inputs.annReturn.toFixed(1)}% to ${Math.max(inputs.annReturn - 1, 0.1).toFixed(1)}% reveals underperformance risk.`,
      accent: "bg-[#BA7517]",
      onClick: () => onApply("stressReturn"),
    },
  ];

  return (
    <div
      className={`bg-white border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md ${
        isHighlighted ? "reva-card-glow border-[#1D9E75]" : "border-slate-200/80"
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1D9E75] rounded-t-2xl" />
      <div className="mt-1 mb-4">
        <h2 className="text-[16px] font-semibold text-slate-900">Scenario conversation</h2>
        <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
          Click a card to instantly shift the projection and explore tradeoffs.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {cards.map((c) => (
          <button
            key={c.title}
            type="button"
            onClick={c.onClick}
            className="relative text-left border border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden group"
          >
            <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl ${c.accent}`} />
            <h3 className="text-[13px] font-semibold text-slate-900 mb-1 mt-1">{c.title}</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">{c.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  projection,
  inputs,
  isHighlighted,
  onDownloadPDF,
}: {
  projection: ProjectionData | null;
  inputs: ClientInputs;
  isHighlighted: boolean;
  onDownloadPDF: () => void;
}) {
  const idx85 = projection ? projection.ages.indexOf(85) : -1;
  const base85 = idx85 >= 0 ? projection!.base.rows[idx85] : null;
  const rl85 = idx85 >= 0 ? projection!.retireLater.rows[idx85] : null;
  const diff = base85 !== null && rl85 !== null ? rl85 - base85 : null;

  const stats = [
    {
      label: "Base case at 85",
      value: base85 !== null ? fmtMoney(base85) : "—",
      color: "text-slate-900",
    },
    {
      label: "Depletion age",
      value: projection
        ? projection.base.dep
          ? `Age ${projection.base.dep}`
          : "Age 100+"
        : "—",
      color: projection
        ? projection.base.dep
          ? "text-red-700"
          : "text-emerald-700"
        : "text-slate-900",
    },
    {
      label: "Retire later saves",
      value: diff !== null ? (diff > 0 ? `+${fmtMoney(diff)}` : "No change") : "—",
      color: diff !== null && diff > 0 ? "text-emerald-700" : "text-slate-900",
    },
  ];

  return (
    <div
      className={`bg-white border rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md ${
        isHighlighted ? "reva-card-glow border-[#1D9E75]" : "border-slate-200/80"
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#BA7517] rounded-t-2xl" />
      <div className="text-[11px] font-medium text-slate-400 tracking-widest uppercase mb-3 mt-1">
        Live projection summary
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 mb-1.5 leading-tight">{s.label}</div>
            <div className={`text-[15px] font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {projection && (
        <div className="mb-5 space-y-1.5">
          {[
            { label: "Base case", dep: projection.base.dep, color: "#185FA5" },
            { label: "Retire later", dep: projection.retireLater.dep, color: "#1D9E75" },
            { label: "Spend less", dep: projection.spendLess.dep, color: "#534AB7" },
            { label: "Stress return", dep: projection.stressReturn.dep, color: "#BA7517" },
          ].map((sc) => (
            <div key={sc.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: sc.color }} />
              <span className="text-[11px] text-slate-500 w-24 shrink-0">{sc.label}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    background: sc.color,
                    width: sc.dep
                      ? `${Math.max(5, ((sc.dep - (projection?.ages[0] ?? 58)) / (100 - (projection?.ages[0] ?? 58))) * 100)}%`
                      : "100%",
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className={`text-[10px] font-medium shrink-0 ${sc.dep ? "text-red-600" : "text-emerald-600"}`}>
                {sc.dep ? `Age ${sc.dep}` : "100+"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="relative bg-[#0B0F1A] rounded-xl p-5 overflow-hidden">
        <div className="absolute w-44 h-44 rounded-full bg-[#185FA5] opacity-[0.12] -right-12 -top-12 blur-[35px] pointer-events-none" />
        <div className="relative z-10">
          <div className="text-[10px] text-white/35 tracking-widest uppercase mb-1">Advisor CTA</div>
          <div className="text-[14px] font-semibold text-white mb-0.5">
            See FinCast Reva in a client meeting
          </div>
          <div className="text-[12px] text-white/40 mb-4">Book a 15-minute advisor walkthrough.</div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/book-call"
              className="flex items-center gap-2 bg-[#1D9E75] hover:bg-[#0F6E56] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Book walkthrough
            </Link>
            <button
              type="button"
              onClick={onDownloadPDF}
              disabled={!projection}
              className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-medium px-4 py-2.5 rounded-xl border border-white/12 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialBar({
  step,
  stepIndex,
  totalSteps,
  isSpeaking,
  isAutoPlaying,
  onPrev,
  onNext,
  onStop,
  stepDuration,
}: {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  isSpeaking: boolean;
  isAutoPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onStop: () => void;
  stepDuration: number;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 reva-animate-slide-up">
      <div className="h-1 bg-[#0B0F1A] overflow-hidden">
        {isAutoPlaying && (
          <div
            key={`${stepIndex}-progress`}
            className="h-full bg-[#1D9E75] reva-animate-progress"
            style={{ animationDuration: `${stepDuration}ms` }}
          />
        )}
      </div>
      <div className="bg-[#0B0F1A]/95 backdrop-blur-md border-t border-white/10 px-5 py-3">
        <div className="max-w-[1100px] mx-auto flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? "w-5 h-2 bg-[#1D9E75]"
                    : i < stepIndex
                      ? "w-2 h-2 bg-[#1D9E75]/40"
                      : "w-2 h-2 bg-white/15"
                }`}
              />
            ))}
          </div>
          <div className="flex items-end gap-[3px] h-5 shrink-0">
            {[0.45, 0.35, 0.55, 0.4, 0.5].map((dur, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-[#1D9E75] transition-all duration-300 ${
                  isSpeaking ? "reva-voice-bar" : "h-1"
                }`}
                style={
                  isSpeaking
                    ? ({ "--dur": `${dur}s`, animationDelay: `${i * 0.08}s` } as React.CSSProperties)
                    : {}
                }
              />
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] text-[#1D9E75] font-semibold tracking-widest uppercase">
                Step {stepIndex + 1} / {totalSteps}
              </span>
              <span className="text-[10px] text-white/30">—</span>
              <span className="text-[11px] text-white/60 font-medium">{step.title}</span>
            </div>
            <p className="text-[12px] text-white/45 italic leading-tight line-clamp-1">
              &ldquo;{step.description}&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onPrev} className="w-8 h-8 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center" aria-label="Previous step">
              <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button type="button" onClick={onNext} className="w-8 h-8 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center" aria-label="Next step">
              <svg className="w-3.5 h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button type="button" onClick={onStop} className="h-8 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[11px] font-medium flex items-center gap-1.5">
              Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export (from finCastReva App.tsx) ───────────────────────────────────

export default function FinCastSelfDemo() {
  const [inputs, setInputs] = useState<ClientInputs>(DEFAULT_INPUTS);
  const [projection, setProjection] = useState<ProjectionData | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const resultCardRef = useRef<ResultCardHandle>(null);
  const isAutoRef = useRef(false);
  const tutorialStepRef = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputsRef = useRef<ClientInputs>(DEFAULT_INPUTS);
  const hasRunRef = useRef(false);

  useEffect(() => {
    isAutoRef.current = isAutoPlaying;
  }, [isAutoPlaying]);
  useEffect(() => {
    tutorialStepRef.current = tutorialStep;
  }, [tutorialStep]);
  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);
  useEffect(() => {
    hasRunRef.current = hasRun;
  }, [hasRun]);

  const runProjection = useCallback(() => {
    const proj = buildAll(inputsRef.current);
    setProjection(proj);
    hasRunRef.current = true;
    setHasRun(true);
    setAnimateKey((k) => k + 1);
  }, []);

  const handleInputChange = useCallback((newInputs: ClientInputs) => {
    setInputs(newInputs);
    inputsRef.current = newInputs;
    if (hasRunRef.current) {
      setProjection(buildAll(newInputs));
    }
  }, []);

  const handleReset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    inputsRef.current = DEFAULT_INPUTS;
    setProjection(null);
    setHasRun(false);
    hasRunRef.current = false;
    setAnimateKey(0);
  }, []);

  const handleApplyScenario = useCallback((type: "retireLater" | "spendLess" | "stressReturn") => {
    const inp = inputsRef.current;
    let newInputs: ClientInputs;
    if (type === "retireLater") {
      newInputs = { ...inp, retireAge: Math.min(inp.retireAge + 2, 75) };
    } else if (type === "spendLess") {
      newInputs = { ...inp, spend: Math.max(inp.spend - 10000, 40000) };
    } else {
      newInputs = { ...inp, annReturn: parseFloat(Math.max(inp.annReturn - 1, 0.1).toFixed(1)) };
    }
    setInputs(newInputs);
    inputsRef.current = newInputs;
    if (hasRunRef.current) {
      setProjection(buildAll(newInputs));
    }
  }, []);

  const advanceStep = useCallback(() => {
    if (!isAutoRef.current) return;
    const next = (tutorialStepRef.current + 1) % TUTORIAL_STEPS.length;
    setTutorialStep(next);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        autoTimerRef.current = setTimeout(advanceStep, 6000);
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.92;
      u.pitch = 1;
      u.volume = 0.9;
      const wordCount = text.split(" ").length;
      const estMs = (wordCount / 2.3) * 1000;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        setIsSpeaking(false);
        if (isAutoRef.current) {
          autoTimerRef.current = setTimeout(advanceStep, 1800);
        }
      };
      const safety = setTimeout(finish, estMs + 1500);
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => {
        clearTimeout(safety);
        finish();
      };
      u.onerror = () => {
        clearTimeout(safety);
        finish();
      };
      window.speechSynthesis.speak(u);
    },
    [advanceStep]
  );

  const startAuto = useCallback(() => {
    isAutoRef.current = true;
    setIsAutoPlaying(true);
    setTutorialStep(0);
  }, []);

  const stopAuto = useCallback(() => {
    isAutoRef.current = false;
    setIsAutoPlaying(false);
    setIsSpeaking(false);
    setHighlighted(null);
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const nextStep = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    const next = (tutorialStepRef.current + 1) % TUTORIAL_STEPS.length;
    setTutorialStep(next);
    if (!isAutoRef.current) {
      setHighlighted(TUTORIAL_STEPS[next].highlight);
      setTimeout(() => setHighlighted(null), 3500);
    }
  }, []);

  const prevStep = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    const prev = (tutorialStepRef.current - 1 + TUTORIAL_STEPS.length) % TUTORIAL_STEPS.length;
    setTutorialStep(prev);
    if (!isAutoRef.current) {
      setHighlighted(TUTORIAL_STEPS[prev].highlight);
      setTimeout(() => setHighlighted(null), 3500);
    }
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const step = TUTORIAL_STEPS[tutorialStep];
    setHighlighted(step.highlight);

    if (step.action === "runProjection" && !hasRunRef.current) {
      setTimeout(() => {
        if (isAutoRef.current) runProjection();
      }, 700);
    }

    speak(step.voice);

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [tutorialStep, isAutoPlaying, speak, runProjection]);

  const handleDownloadPDF = useCallback(() => {
    if (!projection) return;
    const chartImg = resultCardRef.current?.getChartImage() ?? null;
    generatePDF(inputs, projection, chartImg);
  }, [inputs, projection]);

  return (
    <>
      <style>{REVA_STYLES}</style>
      <div className={`fincast-reva-demo min-h-screen bg-slate-50 ${isAutoPlaying ? "pb-24" : ""}`}>
        <main className="max-w-[1100px] mx-auto px-5 py-7 flex flex-col gap-4">
          <HeroSection
            isHighlighted={highlighted === "hero"}
            tutorialStep={tutorialStep}
            isAutoPlaying={isAutoPlaying}
            isSpeaking={isSpeaking}
            steps={TUTORIAL_STEPS}
            onStartAuto={startAuto}
            onStopAuto={stopAuto}
            onNextStep={nextStep}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-4">
            <ResultCard
              ref={resultCardRef}
              projection={projection}
              hasRun={hasRun}
              animateKey={animateKey}
              isHighlighted={highlighted === "result"}
              inputs={inputs}
              onRun={runProjection}
            />
            <InputsCard
              inputs={inputs}
              isHighlighted={highlighted === "inputs"}
              onChange={handleInputChange}
              onReset={handleReset}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-4">
            <ScenariosCard
              inputs={inputs}
              isHighlighted={highlighted === "scenarios"}
              onApply={handleApplyScenario}
            />
            <SummaryCard
              projection={projection}
              inputs={inputs}
              isHighlighted={highlighted === "summary"}
              onDownloadPDF={handleDownloadPDF}
            />
          </div>
        </main>

        {isAutoPlaying && (
          <TutorialBar
            step={TUTORIAL_STEPS[tutorialStep]}
            stepIndex={tutorialStep}
            totalSteps={TUTORIAL_STEPS.length}
            isSpeaking={isSpeaking}
            isAutoPlaying={isAutoPlaying}
            onPrev={prevStep}
            onNext={nextStep}
            onStop={stopAuto}
            stepDuration={STEP_DURATION}
          />
        )}
      </div>
    </>
  );
}
