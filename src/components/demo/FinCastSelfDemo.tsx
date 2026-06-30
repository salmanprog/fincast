"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Calendar, TrendingDown, TrendingUp, ShieldCheck,
  RefreshCw, MousePointer2, Printer, ChevronDown, ChevronUp, BookOpen, Play,
} from "lucide-react";
import CalendlyBookTrigger from "@/components/booking/CalendlyBookTrigger";
import { DEMO_TIMED_WORDS } from "./demoAudioWords";

const INPUT_FIELD_HOVER_CLASS =
  "relative z-0 rounded-xl transition-all duration-200 ease-out origin-right hover:z-10 hover:scale-105 hover:shadow-md";

const DEMO_AUDIO_SRC = "/audio/demo/demo-2.wav";
const DEMO_AUDIO_DURATION = 73.36;

/** Step start times in seconds — transcribed from demo-2.wav. */
const DEMO_STEP_START_SEC = [0, 12.3, 26.48, 41.78, 55.62];
const DEMO_STEP_END_SEC = [11.9, 26.48, 41.78, 55.62, 73.1];

const DEMO_CHART_VOICE_LINES = [
  "Base case, funds run out at age 91.",
  "Retire later, funds run out at age 99.",
  "Spend less, funds run out at age 94.",
  "Stress return, funds run out at age 86.",
] as const;

const DEMO_CHART_LINE_STARTS_SEC = [26.48, 30.8, 34.5, 38.02];
const DEMO_CHART_LINE_ENDS_SEC = [30.12, 33.84, 37.38, 41.02];
const DEMO_CHART_SUB_STEP_STARTS_SEC = [26.48, 28.24, 30.8, 32.16, 34.5, 35.72, 38.02, 39.4];
const DEMO_PDF_VOICE_START_SEC = 67.7;

/** Global visual lead — pointer/sections track spoken audio. */
const SYNC_VISUAL_LEAD_SEC = 0.15;

/** Word karaoke lead — small offset with timestamp-based sync. */
const SYNC_WORD_LEAD_SEC = 0.05;

/** Step boundary lead — pointer moves before each new section starts in audio. */
const DEMO_STEP_LEAD_SEC = [0, 0.2, 0.25, 0.3, 0.35, 0.35];

const DEMO_CHART_SUB_STEPS = 8;

/** Chart phase extra lead — lines/legend track voice during projection step. */
const SYNC_CHART_LEAD_SEC = 0.1;

function buildStepMarkers(duration: number, stepCount: number): number[] {
  const scale = duration / DEMO_AUDIO_DURATION;
  return DEMO_STEP_START_SEC.slice(0, stepCount).map((s) => s * scale);
}

function withSyncLead(currentTime: number, extra = 0): number {
  return currentTime + SYNC_VISUAL_LEAD_SEC + extra;
}

function resolveDemoStep(currentTime: number, duration: number): number {
  const scale = duration / DEMO_AUDIO_DURATION;
  const t = withSyncLead(currentTime);
  for (let i = DEMO_STEP_START_SEC.length - 1; i >= 0; i--) {
    const lead = DEMO_STEP_LEAD_SEC[i] ?? 0.2;
    const threshold = i === 0 ? 0 : Math.max(0, DEMO_STEP_START_SEC[i] * scale - lead);
    if (t >= threshold) {
      return i;
    }
  }
  return 0;
}

function wordsForStep(step: number, duration: number): { word: string; start: number; end: number }[] {
  const scale = duration / DEMO_AUDIO_DURATION;
  const start = DEMO_STEP_START_SEC[step] * scale;
  const end = (DEMO_STEP_END_SEC[step] ?? DEMO_AUDIO_DURATION) * scale;
  const raw = DEMO_TIMED_WORDS.filter(
    (w) => w.start * scale >= start - 0.05 && w.start * scale < end,
  ).map((w) => ({
    word: w.word,
    start: w.start * scale,
    end: w.end * scale,
  }));

  const merged: { word: string; start: number; end: number }[] = [];
  for (const w of raw) {
    if (w.word.startsWith("-") && merged.length > 0) {
      const prev = merged[merged.length - 1];
      prev.word = `${prev.word}${w.word}`;
      prev.end = w.end;
    } else {
      merged.push({ ...w });
    }
  }
  return merged;
}

function resolveTimedWordIndex(currentTime: number, timedWords: { start: number; end: number }[]): number {
  if (timedWords.length === 0) return 0;
  const t = currentTime + SYNC_WORD_LEAD_SEC;
  for (let i = timedWords.length - 1; i >= 0; i--) {
    if (t >= timedWords[i].start) return i;
  }
  return 0;
}

function resolveChartSubStep(currentTime: number, duration: number): number {
  const scale = duration / DEMO_AUDIO_DURATION;
  const t = withSyncLead(currentTime, SYNC_CHART_LEAD_SEC);
  const step2Start = DEMO_STEP_START_SEC[2] * scale;
  const step3Start = DEMO_STEP_START_SEC[3] * scale;
  if (t < step2Start || t >= step3Start) return -1;
  for (let i = DEMO_CHART_SUB_STEP_STARTS_SEC.length - 1; i >= 0; i--) {
    if (t >= DEMO_CHART_SUB_STEP_STARTS_SEC[i] * scale) return i;
  }
  return 0;
}

function splitNarrationSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return parts?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

function stepFocusRing(active: boolean) {
  return active
    ? "ring-[6px] ring-blue-400/90 shadow-xl scale-[1.02] z-10 relative fincast-demo-step-active"
    : "";
}

type FieldKey =
  | "clientName"
  | "ageNow"
  | "retireAge"
  | "currentSavings"
  | "annualContributions"
  | "annualReturn"
  | "retirementSpending"
  | "ssIncome"
  | "otherRetirementIncome"
  | "inflation";

/** Step 1 field cues — transcribed from demo-2.wav (only fields the voice names). */
const DEMO_STEP1_FIELD_CUES: { key: FieldKey; startSec: number; endSec: number }[] = [
  { key: "ageNow", startSec: 16.4, endSec: 17.0 },
  { key: "retireAge", startSec: 17.0, endSec: 18.38 },
  { key: "currentSavings", startSec: 18.38, endSec: 19.3 },
  { key: "annualContributions", startSec: 19.3, endSec: 20.46 },
  { key: "annualReturn", startSec: 20.46, endSec: 21.44 },
  { key: "retirementSpending", startSec: 21.44, endSec: 22.22 },
  { key: "inflation", startSec: 22.22, endSec: 22.68 },
];
const DEMO_STEP1_INTRO_END_SEC = 16.4;
const DEMO_STEP1_FIELDS_END_SEC = 22.68;

/** Cursor lerp speed during auto-play (higher = snappier). */
const POINTER_LERP = 0.22;

function elementPointerCoords(el: HTMLElement, onField = false): { top: number; left: number } {
  const rect = el.getBoundingClientRect();
  return {
    top: Math.max(72, rect.top + rect.height * (onField ? 0.5 : 0.42)),
    left: Math.max(16, rect.left + Math.min(28, rect.width * 0.06)),
  };
}

function lerpCoord(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Step 1 only — cursor follows spoken field names, not even time slices. */
function resolveStep1FieldKey(currentTime: number, duration: number): FieldKey | null {
  const scale = duration / DEMO_AUDIO_DURATION;
  const t = currentTime;

  if (t < DEMO_STEP1_INTRO_END_SEC * scale) return null;
  if (t > DEMO_STEP1_FIELDS_END_SEC * scale) return null;

  for (let i = DEMO_STEP1_FIELD_CUES.length - 1; i >= 0; i--) {
    const cue = DEMO_STEP1_FIELD_CUES[i];
    if (t >= cue.startSec * scale) return cue.key;
  }
  return null;
}

function resolveScenarioCardIndex(currentTime: number, stepStart: number, stepEnd: number): number {
  const t = withSyncLead(currentTime, 0.2);
  const span = Math.max(0.001, stepEnd - stepStart);
  const progress = Math.min(1, Math.max(0, (t - stepStart) / span));
  return Math.min(2, Math.floor(progress * 3));
}

function resolveChartLineCounts(
  currentTime: number,
  duration: number,
  totalPoints: number,
): [number, number, number, number] {
  const scale = duration / DEMO_AUDIO_DURATION;
  const t = withSyncLead(currentTime, SYNC_CHART_LEAD_SEC);
  const counts: [number, number, number, number] = [0, 0, 0, 0];

  if (t < DEMO_CHART_LINE_STARTS_SEC[0] * scale) return counts;

  for (let line = 0; line < 4; line++) {
    const lineStart = DEMO_CHART_LINE_STARTS_SEC[line] * scale;
    const lineEnd = DEMO_CHART_LINE_ENDS_SEC[line] * scale;
    const labelEnd = lineStart + (lineEnd - lineStart) * 0.32;

    if (t >= lineEnd) {
      counts[line] = totalPoints;
    } else if (t >= lineStart) {
      for (let prev = 0; prev < line; prev++) counts[prev] = totalPoints;
      if (t >= labelEnd) {
        const drawProgress = (t - labelEnd) / Math.max(0.001, lineEnd - labelEnd);
        counts[line] = Math.max(1, Math.floor(drawProgress * totalPoints));
      }
      return counts;
    }
  }
  return counts;
}

/** After user scrolls manually during auto-play, demo stops forcing scroll. */
const PROGRAMMATIC_SCROLL_GUARD_MS = 400;
const POINTER_SCROLL_THROTTLE_MS = 320;
const POINTER_VIEW_MARGIN_TOP = 120;
const POINTER_VIEW_MARGIN_BOTTOM = 100;

function scrollClientInputFieldIntoView(
  el: HTMLElement | null,
  instant = false,
  canScroll: () => boolean,
  markProgrammatic: () => void,
) {
  if (!el || !canScroll()) return;
  const rect = el.getBoundingClientRect();
  const idealTop = 120;
  const idealBottom = window.innerHeight - 88;
  const margin = 64;
  const mostlyVisible =
    rect.top >= idealTop - margin && rect.bottom <= idealBottom + margin;
  if (mostlyVisible) return;

  const behavior = instant ? "auto" : "smooth";
  markProgrammatic();
  if (rect.top < idealTop) {
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - idealTop), behavior });
  } else if (rect.bottom > idealBottom) {
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.bottom - idealBottom), behavior });
  }
}

function scrollFocusIntoView(
  el: HTMLElement | null,
  instant = false,
  alignTop = false,
  canScroll: () => boolean = () => true,
  markProgrammatic: () => void = () => {},
) {
  if (!el || !canScroll()) return;
  const rect = el.getBoundingClientRect();
  const margin = 72;
  const inView = alignTop
    ? rect.top >= 48 - margin && rect.top <= 160 + margin
    : rect.top >= 72 - margin && rect.bottom <= window.innerHeight - 48 + margin;
  if (inView) return;

  markProgrammatic();
  el.scrollIntoView({
    behavior: instant ? "auto" : "smooth",
    block: alignTop ? "start" : "nearest",
    inline: "nearest",
  });
}

/** Gently scroll so the demo pointer stays in a comfortable viewport band. */
function scrollToKeepPointerVisible(
  pointerTop: number,
  canScroll: () => boolean,
  markProgrammatic: () => void,
  lastScrollAt: { current: number },
) {
  if (!canScroll()) return;

  const pointerSize = 52;
  const marginTop = POINTER_VIEW_MARGIN_TOP;
  const marginBottom = window.innerHeight - POINTER_VIEW_MARGIN_BOTTOM;
  let delta = 0;

  if (pointerTop < marginTop) {
    delta = pointerTop - marginTop;
  } else if (pointerTop + pointerSize > marginBottom) {
    delta = pointerTop + pointerSize - marginBottom;
  }

  if (Math.abs(delta) < 12) return;

  const now = Date.now();
  if (now - lastScrollAt.current < POINTER_SCROLL_THROTTLE_MS) return;

  lastScrollAt.current = now;
  markProgrammatic();
  window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: "smooth" });
}

function KaraokeWords({
  words,
  activeIndex,
  enabled,
  wordRefs,
}: {
  words: string[];
  activeIndex: number;
  enabled: boolean;
  wordRefs?: React.MutableRefObject<(HTMLSpanElement | null)[]>;
}) {
  return (
    <>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          ref={(el) => {
            if (wordRefs) wordRefs.current[i] = el;
          }}
          className={
            enabled
              ? i < activeIndex
                ? "fincast-demo-word--spoken"
                : i === activeIndex
                  ? "fincast-demo-word--current"
                  : "fincast-demo-word--pending"
              : undefined
          }
        >
          {word}{" "}
        </span>
      ))}
    </>
  );
}

function waitForDemoAudioReady(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => resolve();
    audio.addEventListener("loadedmetadata", done, { once: true });
    audio.addEventListener("canplaythrough", done, { once: true });
    audio.load();
  });
}

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
  const [printPortalRoot, setPrintPortalRoot] = useState<HTMLElement | null>(null);

  const hookCardRef = useRef<HTMLDivElement | null>(null);
  const narrationPanelRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const inputsCardRef = useRef<HTMLDivElement | null>(null);
  const scenariosCardRef = useRef<HTMLDivElement | null>(null);
  const printBtnRef = useRef<HTMLButtonElement | null>(null);
  const hookTitleRef = useRef<HTMLHeadingElement | null>(null);
  const chartLegendRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const scenarioCardRefs = useRef<(HTMLButtonElement | null)[]>([null, null, null]);
  const fieldRefs = useRef<Record<FieldKey, HTMLElement | null>>({
    clientName: null,
    ageNow: null,
    retireAge: null,
    currentSavings: null,
    annualContributions: null,
    annualReturn: null,
    retirementSpending: null,
    ssIncome: null,
    otherRetirementIncome: null,
    inflation: null,
  });
  const narrationWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chartVoiceLinesRef = useRef<string[]>([...DEMO_CHART_VOICE_LINES]);
  const scenarioDataLengthRef = useRef(43);
  const lastScrollTargetRef = useRef<HTMLElement | null>(null);
  const userScrollFreeRef = useRef(false);
  const lastProgrammaticScrollAtRef = useRef(0);
  const lastPointerScrollAtRef = useRef(0);

  const canAutoScroll = () => !userScrollFreeRef.current;
  const markProgrammaticScroll = () => {
    lastProgrammaticScrollAtRef.current = Date.now();
  };
  const notifyUserScroll = () => {
    if (!isAutoPlayingRef.current) return;
    if (Date.now() - lastProgrammaticScrollAtRef.current < PROGRAMMATIC_SCROLL_GUARD_MS) return;
    userScrollFreeRef.current = true;
  };
  const [pointerPos, setPointerPos] = useState<{ top: number; left: number }>({ top: 90, left: 90 });
  const pointerDesiredRef = useRef<{ top: number; left: number }>({ top: 90, left: 90 });
  const isAutoPlayingRef = useRef(false);
  useEffect(() => { isAutoPlayingRef.current = isAutoPlaying; }, [isAutoPlaying]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stepMarkersRef = useRef<number[]>(buildStepMarkers(73.36, 5));
  const lastSyncedStepRef = useRef(-1);
  const lastChartSubStepRef = useRef(-1);
  const step2ChartStartedRef = useRef(false);
  const syncDemoStepRef = useRef<(time: number) => void>(() => {});
  const endOfDemoPdfFlowRef = useRef<() => void>(() => {});
  const handleRunRef = useRef<(opts?: { onComplete?: () => void; durationBudgetMs?: number }) => void>(() => {});
  const updatePointerRef = useRef<
    (
      step: number,
      chartSub?: number,
      focusEl?: HTMLElement | null,
      wordIdx?: number,
      pointerCoords?: { top: number; left: number } | null | undefined,
    ) => void
  >(() => {});
  const [isPaused, setIsPaused] = useState(false);
  const [chartSubStep, setChartSubStep] = useState(-1);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [activeFieldKey, setActiveFieldKey] = useState<FieldKey | null>(null);
  const [activeScenarioCard, setActiveScenarioCard] = useState(-1);
  const [speakingWords, setSpeakingWords] = useState<string[]>([]);
  const lastWordIdxRef = useRef(-1);
  const lastFieldKeyRef = useRef<FieldKey | null>(null);
  const lastScenarioIdxRef = useRef(-1);
  const lastSpeakingKeyRef = useRef("");

  const narrationSteps = [
    {
      title: "The Hook",
      voice: "Will your client run out of money? FinCast helps advisors transform a difficult retirement discussion into a calm, clear, visual conversation in under 60 seconds.",
    },
    {
      title: "Client Inputs",
      voice: "Next, the advisor enters just the essentials. Age, retirement age, savings, annual savings, return, spending, and inflation. The goal is to keep the conversation simple and comfortable.",
    },
    {
      title: "Instant Projection",
      voice: DEMO_CHART_VOICE_LINES.join(" "),
    },
    {
      title: "Scenario Conversation",
      voice: "Then, the advisor can gently explore what if questions? What if the client retires a little later, spends a little less, or earns a different return? The picture updates immediately.",
    },
    {
      title: "Advisor CTA",
      voice: "The result is a calmer, clearer, retirement discussion. Clients can see the issue, understand the trade-offs, and talk with their advisor about next steps. Here is your one-page client summary from FinCast, ready to save as a PDF.",
    },
  ];

  const chartVoiceLines = [...DEMO_CHART_VOICE_LINES];

  const nextStep = () => setDemoStep((s) => (s + 1) % narrationSteps.length);

  const stopDemoAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  };

  const playDemoAudio = async (fromStart = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fromStart) audio.currentTime = 0;
    try {
      await audio.play();
    } catch {
      /* autoplay may be blocked until user gesture */
    }
  };

  const startAutoDemo = async () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    stopDemoAudio();
    lastSyncedStepRef.current = -1;
    lastChartSubStepRef.current = -1;
    step2ChartStartedRef.current = false;
    setChartSubStep(-1);
    setActiveWordIndex(0);
    setActiveFieldKey(null);
    setActiveScenarioCard(-1);
    setSpeakingWords(splitWords(narrationSteps[0].voice));
    lastSpeakingKeyRef.current = narrationSteps[0].voice;
    lastWordIdxRef.current = -1;
    lastFieldKeyRef.current = null;
    lastScenarioIdxRef.current = -1;
    lastScrollTargetRef.current = null;
    userScrollFreeRef.current = false;
    lastProgrammaticScrollAtRef.current = 0;
    lastPointerScrollAtRef.current = 0;
    setHasRun(true);
    setLineCounts([0, 0, 0, 0]);
    lineCountsRef.current = [0, 0, 0, 0];
    setDemoStep(0);
    setIsPaused(false);
    setIsAutoPlaying(true);
    isAutoPlayingRef.current = true;

    const audio = audioRef.current;
    if (audio) {
      await waitForDemoAudioReady(audio);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        stepMarkersRef.current = buildStepMarkers(audio.duration, narrationSteps.length);
      }
    }

    void playDemoAudio(true);
  };

  const resumeAutoDemo = () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    setIsPaused(false);
    setIsAutoPlaying(true);
    isAutoPlayingRef.current = true;

    const audio = audioRef.current;
    if (audio) {
      lastSyncedStepRef.current = -1;
      lastChartSubStepRef.current = -1;
      syncDemoStepRef.current(audio.currentTime);
    }

    void playDemoAudio(false);
  };

  const stopAutoDemo = () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    stopDemoAudio();
    setIsPaused(true);
    setIsAutoPlaying(false);
    isAutoPlayingRef.current = false;
    setActiveFieldKey(null);
    setActiveScenarioCard(-1);
    setActiveWordIndex(0);
    lastScrollTargetRef.current = null;
  };

  const endOfDemoPdfFlow = () => {
    setIsAutoPlaying(false);
    setIsPaused(false);
    isAutoPlayingRef.current = false;
    stopDemoAudio();

    const openPrint = () => {
      try {
        const previousTitle = document.title;
        document.title = "FinCast — Self-Demo";
        const restoreTitle = () => {
          document.title = previousTitle;
          window.removeEventListener("afterprint", restoreTitle);
        };
        window.addEventListener("afterprint", restoreTitle);
        window.print();
      } catch {
        /* ignore */
      }
    };

    setTimeout(openPrint, 1200);
  };

  endOfDemoPdfFlowRef.current = endOfDemoPdfFlow;

  const syncDemoStepToAudio = (currentTime: number) => {
    if (!isAutoPlayingRef.current) return;

    const audio = audioRef.current;
    const duration = audio?.duration && Number.isFinite(audio.duration) ? audio.duration : DEMO_AUDIO_DURATION;
    const step = resolveDemoStep(currentTime, duration);
    const stepStart = (DEMO_STEP_START_SEC[step] ?? 0) * (duration / DEMO_AUDIO_DURATION);
    const stepEnd = (DEMO_STEP_END_SEC[step] ?? DEMO_AUDIO_DURATION) * (duration / DEMO_AUDIO_DURATION);
    const timedWords = wordsForStep(step, duration);

    let words: string[] = timedWords.map((w) => w.word);
    let wordIdx = resolveTimedWordIndex(currentTime, timedWords);
    let fieldKey: FieldKey | null = null;
    let scenarioIdx = -1;
    let chartSub = -1;
    let focusEl: HTMLElement | null = null;

    if (step === 2) {
      chartSub = resolveChartSubStep(currentTime, duration);
      const lineIndex = Math.min(3, Math.max(0, Math.floor(chartSub / 2)));
      focusEl = chartLegendRefs.current[lineIndex] ?? resultCardRef.current;

      const chartCounts = resolveChartLineCounts(currentTime, duration, scenarioDataLengthRef.current);
      if (
        chartCounts[0] !== lineCountsRef.current[0] ||
        chartCounts[1] !== lineCountsRef.current[1] ||
        chartCounts[2] !== lineCountsRef.current[2] ||
        chartCounts[3] !== lineCountsRef.current[3]
      ) {
        lineCountsRef.current = chartCounts;
        setLineCounts(chartCounts);
      }

      if (!step2ChartStartedRef.current) {
        step2ChartStartedRef.current = true;
      }
    } else if (step === 1) {
      wordIdx = resolveTimedWordIndex(currentTime, timedWords);
      fieldKey = resolveStep1FieldKey(currentTime, duration);
      focusEl = fieldKey ? fieldRefs.current[fieldKey] : null;
    } else if (step === 3) {
      wordIdx = resolveTimedWordIndex(currentTime, timedWords);
      scenarioIdx = resolveScenarioCardIndex(currentTime, stepStart, stepEnd);
      focusEl = scenarioCardRefs.current[scenarioIdx] ?? scenariosCardRef.current;
    } else if (step === 4) {
      wordIdx = resolveTimedWordIndex(currentTime, timedWords);
      const pdfStart = DEMO_PDF_VOICE_START_SEC * (duration / DEMO_AUDIO_DURATION);
      if (currentTime + SYNC_WORD_LEAD_SEC >= pdfStart) {
        focusEl = printBtnRef.current ?? narrationPanelRef.current ?? hookCardRef.current;
      } else {
        focusEl = narrationWordRefs.current[wordIdx] ?? narrationPanelRef.current ?? hookCardRef.current;
      }
    } else {
      wordIdx = resolveTimedWordIndex(currentTime, timedWords);
      focusEl = narrationWordRefs.current[wordIdx] ?? hookTitleRef.current ?? hookCardRef.current;
    }

    const wordsKey = words.join("|");

    if (chartSub !== lastChartSubStepRef.current) {
      lastChartSubStepRef.current = chartSub;
      setChartSubStep(chartSub);
    }

    // Pointer coords must be computed before lastFieldKeyRef is updated.
    const step1PointerCoords: { top: number; left: number } | null | undefined =
      step === 1
        ? !fieldKey || !focusEl
          ? null
          : fieldKey !== lastFieldKeyRef.current
            ? elementPointerCoords(focusEl, true)
            : undefined
        : undefined;

    if (wordsKey !== lastSpeakingKeyRef.current) {
      lastSpeakingKeyRef.current = wordsKey;
      setSpeakingWords(words);
    }
    if (wordIdx !== lastWordIdxRef.current) {
      lastWordIdxRef.current = wordIdx;
      setActiveWordIndex(wordIdx);
    }
    if (fieldKey !== lastFieldKeyRef.current) {
      lastFieldKeyRef.current = fieldKey;
      setActiveFieldKey(fieldKey);
    }
    if (scenarioIdx !== lastScenarioIdxRef.current) {
      lastScenarioIdxRef.current = scenarioIdx;
      setActiveScenarioCard(scenarioIdx);
    }

    if (step !== lastSyncedStepRef.current) {
      lastSyncedStepRef.current = step;
      setDemoStep(step);
      lastScrollTargetRef.current = null;
      if (canAutoScroll()) {
        const sectionTargets: (HTMLElement | null)[] = [
          hookCardRef.current,
          inputsCardRef.current,
          resultCardRef.current,
          scenariosCardRef.current,
          hookCardRef.current,
        ];
        requestAnimationFrame(() => {
          scrollFocusIntoView(
            sectionTargets[step],
            true,
            false,
            canAutoScroll,
            markProgrammaticScroll,
          );
        });
      }
    }

    updatePointerRef.current(
      step,
      chartSub >= 0 ? chartSub : undefined,
      focusEl,
      wordIdx,
      step === 1 ? step1PointerCoords : null,
    );
  };

  syncDemoStepRef.current = syncDemoStepToAudio;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio(DEMO_AUDIO_SRC);
    audio.preload = "auto";
    audioRef.current = audio;

    const refreshMarkers = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        stepMarkersRef.current = buildStepMarkers(audio.duration, narrationSteps.length);
      }
    };

    const onTimeUpdate = () => {
      syncDemoStepRef.current(audio.currentTime);
    };

    const onEnded = () => {
      if (!isAutoPlayingRef.current) return;
      endOfDemoPdfFlowRef.current();
    };

    audio.addEventListener("loadedmetadata", refreshMarkers);
    audio.addEventListener("durationchange", refreshMarkers);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    refreshMarkers();

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", refreshMarkers);
      audio.removeEventListener("durationchange", refreshMarkers);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.src = "";
      audioRef.current = null;
    };
    // narrationSteps.length is static
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const onWheel = () => notifyUserScroll();
    const onTouchMove = () => notifyUserScroll();
    const onKeyDown = (e: KeyboardEvent) => {
      const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
      if (keys.includes(e.key)) notifyUserScroll();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAutoPlaying]);

  useEffect(() => {
    if (!isAutoPlaying) return;

    let rafId = 0;
    const tick = () => {
      const audio = audioRef.current;
      if (audio && isAutoPlayingRef.current && !audio.paused) {
        syncDemoStepRef.current(audio.currentTime);
      }
      if (isAutoPlayingRef.current) {
        setPointerPos((prev) => {
          const desired = pointerDesiredRef.current;
          const top = lerpCoord(prev.top, desired.top, POINTER_LERP);
          const left = lerpCoord(prev.left, desired.left, POINTER_LERP);
          if (Math.abs(top - desired.top) < 0.4 && Math.abs(left - desired.left) < 0.4) {
            return desired;
          }
          return { top, left };
        });
        scrollToKeepPointerVisible(
          pointerDesiredRef.current.top,
          canAutoScroll,
          markProgrammaticScroll,
          lastPointerScrollAtRef,
        );
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isAutoPlaying]);

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

  chartVoiceLinesRef.current = chartVoiceLines;
  scenarioDataLengthRef.current = scenarioData.length;

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

  const handleRun = (opts?: { onComplete?: () => void; durationBudgetMs?: number }) => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    const fresh: [number, number, number, number] = [0, 0, 0, 0];
    lineCountsRef.current = [...fresh] as [number, number, number, number];
    currentLineRef.current = 0;
    setLineCounts(fresh);
    setHasRun(true);
    const total = scenarioData.length;
    let TICK_MS = 140;
    let PAUSE_MS = 600;
    const VOICE_LEAD_MS = 0;

    if (opts?.durationBudgetMs) {
      const lines = 4;
      const pauseTotal = 400 * lines;
      const drawBudget = Math.max(1200, opts.durationBudgetMs - pauseTotal);
      TICK_MS = Math.max(35, Math.floor(drawBudget / (total * lines)));
      PAUSE_MS = 400;
    }

    const startLine = (line: number) => {
      if (line >= 4) {
        opts?.onComplete?.();
        return;
      }
      currentLineRef.current = line;
      setTimeout(() => {
        if (currentLineRef.current !== line) return;
        animTimerRef.current = setInterval(() => {
          lineCountsRef.current[line]++;
          const next: [number, number, number, number] = [...lineCountsRef.current] as [number, number, number, number];
          setLineCounts(next);
          if (lineCountsRef.current[line] >= total) {
            clearInterval(animTimerRef.current!);
            animTimerRef.current = null;
            setTimeout(() => {
              if (currentLineRef.current !== line) return;
              startLine(line + 1);
            }, PAUSE_MS);
          }
        }, TICK_MS);
      }, VOICE_LEAD_MS);
    };

    startLine(0);
  };

  handleRunRef.current = handleRun;

  const handleReset = () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    stopDemoAudio();
    if (audioRef.current) audioRef.current.currentTime = 0;
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
    if (isAutoPlayingRef.current) return;
    if (!hasRun) handleRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageNow, retireAge, currentSavings, annualContributions, annualReturn, retirementSpending, ssIncome, otherRetirementIncome, inflation]);

  const handlePrint = () => {
    stopDemoAudio();
    const previousTitle = document.title;
    document.title = "FinCast — Self-Demo";
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  useEffect(() => {
    setPrintPortalRoot(document.body);
    document.body.classList.add("fincast-demo-active");
    const previousTitle = document.title;
    document.title = "FinCast — Self-Demo";
    return () => {
      document.body.classList.remove("fincast-demo-active");
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const updatePointer = (
      stepOverride?: number,
      chartSub?: number,
      focusEl?: HTMLElement | null,
      wordIdxOverride?: number,
      pointerCoords?: { top: number; left: number } | null | undefined,
    ) => {
      const step = stepOverride ?? demoStep;

      // Step 1: move only on field change; freeze when no spoken field.
      if (step === 1 && isAutoPlayingRef.current) {
        if (pointerCoords === undefined) return;
        if (!pointerCoords || !focusEl) return;
        if (focusEl !== lastScrollTargetRef.current) {
          lastScrollTargetRef.current = focusEl;
          if (canAutoScroll()) {
            scrollClientInputFieldIntoView(
              focusEl,
              false,
              canAutoScroll,
              markProgrammaticScroll,
            );
          }
        }
        pointerDesiredRef.current = pointerCoords;
        return;
      }

      const sub = chartSub ?? (step === 2 ? chartSubStep : -1);
      const wordIdx = wordIdxOverride ?? activeWordIndex;

      let target: HTMLElement | null = focusEl ?? null;

      if (!target) {
        if (step === 2 && sub >= 0) {
          const lineIndex = Math.min(3, Math.max(0, Math.floor(sub / 2)));
          target = chartLegendRefs.current[lineIndex] ?? resultCardRef.current;
        } else if (step === 1 && activeFieldKey) {
          target = fieldRefs.current[activeFieldKey] ?? inputsCardRef.current;
        } else if (step === 3 && activeScenarioCard >= 0) {
          target = scenarioCardRefs.current[activeScenarioCard] ?? scenariosCardRef.current;
        } else if (step === 4) {
          target = printBtnRef.current ?? narrationWordRefs.current[wordIdx] ?? narrationPanelRef.current ?? hookCardRef.current;
        } else {
          target = narrationWordRefs.current[wordIdx] ?? hookTitleRef.current;
        }
      }

      if (!target) {
        const targets: (HTMLElement | null)[] = [
          hookCardRef.current,
          inputsCardRef.current,
          resultCardRef.current,
          scenariosCardRef.current,
          printBtnRef.current,
        ];
        target = targets[step];
      }

      if (!target) return;

      if (target !== lastScrollTargetRef.current) {
        lastScrollTargetRef.current = target;
        // During auto-play, pointer-follow scroll handles steps 0/4; avoid per-word jumps.
        const useElementScroll =
          !isAutoPlayingRef.current || step === 1 || step === 2 || step === 3;
        if (useElementScroll && canAutoScroll()) {
          scrollFocusIntoView(
            target,
            isAutoPlayingRef.current,
            false,
            canAutoScroll,
            markProgrammaticScroll,
          );
        }
      }

      const onInputField = step === 1 && target !== inputsCardRef.current;
      const coords =
        pointerCoords ??
        (() => {
          const rect = target!.getBoundingClientRect();
          return {
            top: Math.max(72, rect.top + rect.height * (onInputField ? 0.5 : 0.42)),
            left: Math.max(16, rect.left + Math.min(28, rect.width * 0.06)),
          };
        })();

      if (isAutoPlayingRef.current) {
        pointerDesiredRef.current = coords;
        return;
      }

      setPointerPos(coords);
    };
    updatePointerRef.current = (
      step: number,
      chartSub?: number,
      focusEl?: HTMLElement | null,
      wordIdx?: number,
      pointerCoords?: { top: number; left: number } | null | undefined,
    ) => updatePointer(step, chartSub, focusEl, wordIdx, pointerCoords);
    updatePointer();
    const onLayout = () => {
      if (isAutoPlayingRef.current) return;
      updatePointer();
    };
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, { passive: true });
    const id = window.setTimeout(() => updatePointer(), 50);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout);
      window.clearTimeout(id);
    };
  }, [demoStep, hasRun, scriptOpen, chartSubStep, activeWordIndex, activeFieldKey, activeScenarioCard]);

  useLayoutEffect(() => {
    if (!isAutoPlaying || demoStep !== 1 || !activeFieldKey) return;
    const el = fieldRefs.current[activeFieldKey];
    if (!el) return;
    const coords = elementPointerCoords(el, true);
    pointerDesiredRef.current = coords;
  }, [isAutoPlaying, demoStep, activeFieldKey]);

  useLayoutEffect(() => {
    if (!isAutoPlaying) return;
    if (demoStep === 1) return;
    const focusEl =
      demoStep === 4
        ? narrationWordRefs.current[activeWordIndex] ?? narrationPanelRef.current ?? hookCardRef.current
        : narrationWordRefs.current[activeWordIndex] ?? undefined;
    updatePointerRef.current(
      demoStep,
      chartSubStep >= 0 ? chartSubStep : undefined,
      focusEl,
      activeWordIndex,
    );
  }, [isAutoPlaying, demoStep, activeWordIndex, activeFieldKey, activeScenarioCard, chartSubStep]);

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      {/* PRINT-ONLY SUMMARY (portal → body so print CSS can show it) */}
      {printPortalRoot &&
        createPortal(
          <div id="fincast-print-summary" aria-hidden="true">
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
          printPortalRoot
        )}

      <style dangerouslySetInnerHTML={{ __html: `
        .fincast-demo-step-active h1,
        .fincast-demo-step-active h2 {
          font-size: clamp(2rem, 4vw, 3.75rem) !important;
          line-height: 1.1 !important;
        }
        .fincast-demo-step-active .fincast-demo-focus-label {
          font-size: 1.125rem !important;
          font-weight: 600 !important;
        }
        .fincast-demo-step-active .fincast-demo-focus-value {
          font-size: 1.75rem !important;
          font-weight: 700 !important;
        }
        .fincast-demo-step-active .fincast-demo-narration-quote {
          font-size: 1.125rem !important;
          line-height: 1.65 !important;
        }
        .fincast-demo-narration-sentence--active {
          color: #ffffff !important;
          font-weight: 600;
        }
        .fincast-demo-narration-sentence--pending {
          color: #94a3b8 !important;
        }
        .fincast-demo-word--spoken {
          color: #e2e8f0 !important;
          font-weight: 500;
        }
        .fincast-demo-word--current {
          color: #ffffff !important;
          font-weight: 700;
          background: rgba(250, 204, 21, 0.55);
          border-radius: 4px;
          padding: 1px 5px;
          box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.75);
          transform: scale(1.06);
          display: inline-block;
        }
        .fincast-demo-word--pending {
          color: #64748b !important;
        }
        .fincast-demo-field--active {
          background: #eff6ff !important;
          border-radius: 12px;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
          transform: scale(1.04);
          transition: all 0.2s ease;
        }
        .fincast-demo-legend--active {
          background: #eff6ff;
          border-radius: 10px;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
          transform: scale(1.05);
        }
        .fincast-demo-scenario--active {
          background: #eff6ff !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35);
          transform: scale(1.03);
        }
        .fincast-demo-pointer svg {
          width: 3rem;
          height: 3rem;
        }
        body.fincast-demo-active #fincast-print-summary {
          position: absolute;
          left: -99999px;
          top: 0;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
        }
        @media print {
          body.fincast-demo-active > *:not(#fincast-print-summary) {
            display: none !important;
          }
          body.fincast-demo-active #fincast-print-summary {
            display: block !important;
            position: static !important;
            left: auto !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            clip: auto !important;
            white-space: normal !important;
            margin: 0 !important;
            padding: 0.25in !important;
            background: #fff !important;
            font-family: Arial, Helvetica, sans-serif !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body.fincast-demo-active #fincast-print-summary * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body.fincast-demo-active #fincast-print-summary .recharts-cartesian-axis-tick-value,
          body.fincast-demo-active #fincast-print-summary .recharts-text {
            font-family: Arial, Helvetica, sans-serif !important;
            font-weight: 700 !important;
            fill: #000000 !important;
          }
          body.fincast-demo-active #fincast-print-summary .fincast-print-disclaimer {
            font-weight: 400 !important;
          }
          .fincast-print-talking-point {
            display: block !important;
          }
          .fincast-print-page-1,
          .fincast-print-page-2 {
            position: relative;
            min-height: 7.25in;
            box-sizing: border-box;
          }
          .fincast-print-page-2 {
            page-break-before: always;
            break-before: page;
            padding-top: 0;
            font-size: 12.5px;
            color: #2d2d2d;
            line-height: 1.45;
          }
          .fincast-print-browser-footer--block {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            color: #5f6368;
            line-height: 1.35;
          }
          .fincast-print-browser-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: baseline;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            color: #5f6368;
            line-height: 1.35;
          }
          .fincast-print-browser-date {
            justify-self: start;
            grid-column: 1;
          }
          .fincast-print-browser-title {
            justify-self: center;
            grid-column: 2;
            text-align: center;
          }
          .fincast-print-browser-footer--split {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            color: #5f6368;
            line-height: 1.35;
          }
          .fincast-print-page-2-body {
            padding-top: 18px;
          }
          .fincast-print-browser-footer-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }
          @page { size: letter landscape; margin: 0.25in; }
        }
      `}} />

      {/* MAIN APP — hidden when printing; PDF uses PrintSummary only */}
      <div id="fincast-demo-screen">
      <div className="min-h-screen bg-slate-50 text-slate-950 p-4 md:p-8 relative">
        {isAutoPlaying ? (
          <div
            className="fincast-demo-pointer fixed z-50 text-slate-900 pointer-events-none will-change-[top,left]"
            style={{ top: pointerPos.top, left: pointerPos.left }}
          >
            <div className="relative">
              <MousePointer2 className="w-12 h-12 drop-shadow-lg" />
              <div className="absolute -inset-3 rounded-full border-2 border-slate-400 animate-ping opacity-40" />
            </div>
          </div>
        ) : (
          <motion.div
            className="fincast-demo-pointer fixed z-50 text-slate-900 pointer-events-none"
            animate={{ top: pointerPos.top, left: pointerPos.left }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <div className="relative">
              <MousePointer2 className="w-12 h-12 drop-shadow-lg" />
              <motion.div
                className="absolute -inset-3 rounded-full border-2 border-slate-400"
                animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0.2, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              />
            </div>
          </motion.div>
        )}

        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-[0.77fr_1.23fr] gap-6 items-stretch"
          >
            <Card ref={hookCardRef} className={`fincast-demo-card rounded-2xl shadow-sm border-slate-200 bg-white ${stepFocusRing(demoStep === 0 || demoStep === 4)}`}>
              <CardContent className="p-7 md:p-10 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  <ShieldCheck className="w-5 h-5" /> FinCast — RIA Self-Demo
                </div>

                <div className="space-y-3">
                  <h1 ref={hookTitleRef} className={`font-semibold tracking-tight leading-tight ${demoStep === 0 ? "text-5xl md:text-7xl" : "text-4xl md:text-6xl"}`}>
                    Will your client run out of money?
                  </h1>
                  <p className={`text-slate-600 max-w-2xl ${demoStep === 0 ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`}>
                    FinCast helps advisors transform a difficult retirement discussion into a calm, clear, visual conversation in under 60 seconds.
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className={`font-semibold ${demoStep === 0 ? "text-3xl" : "text-2xl"}`}>60 sec</div>
                    <div className={`text-slate-500 ${demoStep === 0 ? "text-base" : "text-sm"}`}>client clarity demo</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className={`font-semibold ${demoStep === 0 ? "text-3xl" : "text-2xl"}`}>Live</div>
                    <div className={`text-slate-500 ${demoStep === 0 ? "text-base" : "text-sm"}`}>scenario changes</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className={`font-semibold ${demoStep === 0 ? "text-3xl" : "text-2xl"}`}>Visual</div>
                    <div className={`text-slate-500 ${demoStep === 0 ? "text-base" : "text-sm"}`}>depletion risk</div>
                  </div>
                </div>

                <div ref={narrationPanelRef} className="rounded-2xl bg-slate-950 text-white p-5 md:p-6 space-y-3">
                  <div className={`text-slate-300 ${demoStep === 0 || demoStep === 4 ? "text-base" : "text-sm"}`}>
                    {isAutoPlaying ? "Auto-playing" : "Narrated Demo"} · Step {demoStep + 1} of {narrationSteps.length}
                  </div>
                  <div className={`font-semibold ${demoStep === 0 || demoStep === 4 ? "text-2xl" : "text-xl"}`}>
                    {isAutoPlaying && demoStep === 2 ? "Instant Projection" : narrationSteps[demoStep].title}
                  </div>
                  <p className="fincast-demo-narration-quote text-slate-200 text-base md:text-lg leading-relaxed">
                    <KaraokeWords
                      words={isAutoPlaying ? speakingWords : splitWords(
                        demoStep === 2
                          ? chartVoiceLines.join(" ")
                          : narrationSteps[demoStep].voice
                      )}
                      activeIndex={isAutoPlaying ? activeWordIndex : -1}
                      enabled={isAutoPlaying}
                      wordRefs={narrationWordRefs}
                    />
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isPaused ? (
                    <Button onClick={resumeAutoDemo} className="rounded-2xl px-6 py-6 text-base">
                      Resume Narrated Demo
                    </Button>
                  ) : (
                    <Button onClick={startAutoDemo} className="rounded-2xl px-6 py-6 text-base">
                      Start Auto Narrated Demo
                    </Button>
                  )}
                  <Button onClick={nextStep} variant="outline" className="rounded-2xl px-6 py-6 text-base">
                    Next Step
                  </Button>
                  {isAutoPlaying && (
                    <Button onClick={stopAutoDemo} variant="outline" className="rounded-2xl px-6 py-6 text-base">
                      Pause Voice
                    </Button>
                  )}
                  <Button
                    ref={printBtnRef}
                    onClick={handlePrint}
                    variant="outline"
                    className={`rounded-2xl px-6 py-6 text-base ${isAutoPlaying && demoStep === 4 ? "ring-4 ring-blue-400 shadow-lg scale-105" : ""}`}
                  >
                    <Printer className="w-4 h-4 mr-2" /> Save as PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card ref={resultCardRef} className={`fincast-demo-card fincast-demo-result-card rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden ${stepFocusRing(demoStep === 2)}`}>
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`text-slate-500 fincast-demo-focus-label ${demoStep === 2 ? "text-base" : "text-sm"}`}>Instant Result</div>
                    <div className={`fincast-demo-focus-value font-semibold ${riskTone} ${demoStep === 2 ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>{resultMessage}</div>
                  </div>
                  {projection.depletionAge ? (
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  )}
                </div>

                {!hasRun ? (
                  <div className="fincast-demo-result-chart h-[48rem] w-full flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                    <TrendingUp className="w-12 h-12 text-slate-300" />
                    <div className="text-center">
                      <div className="text-base font-semibold text-slate-600">Ready to project</div>
                      <div className="text-sm text-slate-400 mt-1">Set your assumptions, then run</div>
                    </div>
                    <Button onClick={() => handleRun()} className="rounded-2xl px-8 py-6 text-base gap-2">
                      <Play className="w-4 h-4" /> Run Projection
                    </Button>
                  </div>
                ) : (
                  <div className="fincast-demo-result-chart h-[48rem] w-full relative">
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
                        <ReferenceLine x={retireAge} stroke="#475569" strokeDasharray="4 4" strokeWidth={2} label={{ value: "Retire", fontSize: 16, fill: "#0f172a", fontWeight: 700 }} />
                        <Line type="monotone" dataKey="Base Case"     name={`Base Case ($${(retirementSpending/1000).toFixed(0)}k/yr spend)`} stroke="#1e3a8a" strokeWidth={5} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="Retire Later"  name={`Retire Later (age ${Math.min(retireAge + 2, 75)})`} stroke="#047857" strokeWidth={4} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
                        <Line type="monotone" dataKey="Spend Less"    name={`Spend Less ($${(Math.max(retirementSpending - 10000, 40000)/1000).toFixed(0)}k/yr spend)`} stroke="#6d28d9" strokeWidth={4} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
                        <Line type="monotone" dataKey="Stress Return" name={`Stress Return (${(Math.max(annualReturn - 1, 0.1)).toFixed(1)}% return)`} stroke="#c2410c" strokeWidth={4} dot={false} strokeDasharray="8 4" isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="grid sm:grid-cols-2 gap-2 px-1 pb-1 -mt-6 relative z-10">
                      {[
                        { label: `Base Case ($${(retirementSpending / 1000).toFixed(0)}k/yr spend)`, color: "#1e3a8a", dashed: false },
                        { label: `Retire Later (age ${Math.min(retireAge + 2, 75)})`, color: "#047857", dashed: true },
                        { label: `Spend Less ($${(Math.max(retirementSpending - 10000, 40000) / 1000).toFixed(0)}k/yr spend)`, color: "#6d28d9", dashed: true },
                        { label: `Stress Return (${(Math.max(annualReturn - 1, 0.1)).toFixed(1)}% return)`, color: "#c2410c", dashed: true },
                      ].map((item, i) => (
                        <div
                          key={item.label}
                          ref={(el) => { chartLegendRefs.current[i] = el; }}
                          className={`flex items-center gap-2 px-3 py-2 text-sm md:text-base font-semibold text-slate-900 transition-all duration-200 ${
                            isAutoPlaying && demoStep === 2 && Math.floor(chartSubStep / 2) === i
                              ? "fincast-demo-legend--active"
                              : ""
                          }`}
                        >
                          <svg width="28" height="10" aria-hidden>
                            <line
                              x1="0" y1="5" x2="28" y2="5"
                              stroke={item.color}
                              strokeWidth={item.dashed ? 3 : 4}
                              strokeDasharray={item.dashed ? "6 3" : undefined}
                            />
                          </svg>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl bg-slate-100 border border-slate-200 mt-[100px] p-5 flex items-center gap-3 text-slate-900">
                  <TrendingDown className="w-7 h-7 flex-shrink-0" />
                  <p className="text-xl font-semibold leading-snug">
                    Advisor talking point: "This is the moment clients understand retirement survivability without reading a 40-page report."
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6 mb-6">
            <Card ref={inputsCardRef} className={`fincast-demo-card rounded-2xl shadow-sm border-slate-200 bg-white ${stepFocusRing(demoStep === 1)}`}>
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className={`font-semibold ${demoStep === 1 ? "text-3xl" : "text-2xl"}`}>Client Inputs</h2>
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
                  <label
                    ref={(el) => { fieldRefs.current.clientName = el; }}
                    className={`grid grid-cols-[1fr_150px] gap-3 items-center p-1 -m-1 ${isAutoPlaying && activeFieldKey === "clientName" ? "fincast-demo-field--active" : ""}`}
                  >
                    <span className={`font-medium text-slate-600 fincast-demo-focus-label ${demoStep === 1 ? "text-base" : "text-sm"}`}>Client name</span>
                    <div className={INPUT_FIELD_HOVER_CLASS}>
                      <Input
                        className="rounded-xl"
                        type="text"
                        placeholder="e.g. J. Smith"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>
                  </label>
                  <p className="text-xs text-slate-400 text-right pr-0.5">
                    PDF only — never saved or stored
                  </p>
                </div>

                <InputRow label="Current age" value={ageNow} setValue={setAgeNow} fieldKey="ageNow" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "ageNow"} />
                <InputRow label="Retirement age" value={retireAge} setValue={setRetireAge} fieldKey="retireAge" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "retireAge"} />
                <InputRow label="Portfolio savings" value={currentSavings} setValue={setCurrentSavings} prefix="$" fieldKey="currentSavings" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "currentSavings"} />
                <div className="space-y-3 pt-1">
                  <SliderRow label="Pre-retirement contributions" value={annualContributions} setValue={setAnnualContributions} min={0} max={100000} step={1000} prefix="$" fieldKey="annualContributions" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "annualContributions"} />
                </div>

                <div className="space-y-3 pt-2">
                  <SliderRow label="Annual return" value={annualReturn} setValue={setAnnualReturn} min={0} max={12} step={0.1} suffix="%" decimals={1} fieldKey="annualReturn" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "annualReturn"} />
                  <SliderRow label="Retirement spending" value={retirementSpending} setValue={setRetirementSpending} min={50000} max={500000} step={5000} prefix="$" fieldKey="retirementSpending" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "retirementSpending"} />
                  <SliderRow label="SS / retirement income" value={ssIncome} setValue={setSsIncome} min={0} max={60000} step={1000} prefix="$" fieldKey="ssIncome" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "ssIncome"} />
                  <SliderRow label="Other retirement income" value={otherRetirementIncome} setValue={setOtherRetirementIncome} min={0} max={100000} step={1000} prefix="$" fieldKey="otherRetirementIncome" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "otherRetirementIncome"} />
                  <SliderRow label="Spending inflation" value={inflation} setValue={setInflation} min={0} max={8} step={0.1} suffix="%" decimals={1} fieldKey="inflation" fieldRef={fieldRefs} highlighted={isAutoPlaying && activeFieldKey === "inflation"} />
                </div>
              </CardContent>
            </Card>

            <Card ref={scenariosCardRef} className={`fincast-demo-card rounded-2xl shadow-sm border-slate-200 bg-white ${stepFocusRing(demoStep === 3)}`}>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div>
                  <h2 className={`font-semibold ${demoStep === 3 ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>Scenario Conversation</h2>
                  <p className={`text-slate-600 mt-2 ${demoStep === 3 ? "text-lg md:text-xl" : "text-base"}`}>
                    Move one assumption and the client immediately sees how the retirement picture changes.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <ScenarioCard
                    cardRef={(el) => { scenarioCardRefs.current[0] = el; }}
                    highlighted={isAutoPlaying && demoStep === 3 && activeScenarioCard === 0}
                    title="Retire Later"
                    body="Increase retirement age to show how one or two extra working years may change the curve."
                    action={() => setRetireAge((v) => Math.min(v + 2, 75))}
                  />
                  <ScenarioCard
                    cardRef={(el) => { scenarioCardRefs.current[1] = el; }}
                    highlighted={isAutoPlaying && demoStep === 3 && activeScenarioCard === 1}
                    title="Spend Less"
                    body="Lower annual spending to show how lifestyle choices extend portfolio life."
                    action={() => setRetirementSpending((v) => Math.max(v - 10000, 40000))}
                  />
                  <ScenarioCard
                    cardRef={(el) => { scenarioCardRefs.current[2] = el; }}
                    highlighted={isAutoPlaying && demoStep === 3 && activeScenarioCard === 2}
                    title="Stress Return"
                    body="Drops the annual return assumption by 1% — e.g. 6% → 5% — to show how modest market underperformance affects portfolio longevity."
                    action={() => setAnnualReturn((v) => Math.max(v - 1, 1))}
                  />
                </div>

                <div className="rounded-2xl bg-slate-950 text-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div>
                    <div className="text-sm text-slate-300">Advisor CTA</div>
                    <div className="text-2xl font-semibold">See how FinCast works in a client meeting.</div>
                    <p className="text-slate-300 mt-1">Book a 15-minute advisor walkthrough.</p>
                  </div>
                  <CalendlyBookTrigger className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-6 text-base bg-white text-slate-950 hover:bg-slate-100">
                    <Calendar className="w-4 h-4 mr-2" /> Book Walkthrough
                  </CalendlyBookTrigger>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ADVISOR MEETING SCRIPT */}
        <div className="fincast-demo-card max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setScriptOpen((v) => !v)}
            className="w-full flex items-center justify-between px-7 py-5 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-slate-500" />
              <div className="text-left">
                <div className="font-semibold text-lg text-slate-900">Full Advisor Meeting Script</div>
                <div className="text-sm text-slate-500">Step-by-step talking guide for using FinCast in a client meeting</div>
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
                <div key={i} className="fincast-demo-card grid md:grid-cols-[220px_1fr] gap-4">
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

const PRINT_DOC_TITLE = "FinCast — Self-Demo";
const PRINT_DOC_URL = "https://build-freedom.ai/app";

/** Neutral print palette — matches browser PDF (black/grey), not slate UI colors */
const PRINT_COLOR = {
  black: "#000000",
  body: "#2d2d2d",
  section: "#2d2d2d",
  label: "#2d2d2d",
  meta: "#4d4d4d",
  muted: "#808080",
  disclaimer: "#555555",
  risk: "#b45309",
  riskHeading: "#b45309",
  border: "#dddddd",
  grid: "#cccccc",
  axis: "#333333",
} as const;

function formatPrintTimestamp(d: Date) {
  return d.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function PrintBrowserChrome({
  page,
  totalPages,
  layout,
}: {
  page: number;
  totalPages: number;
  layout: "footer-block" | "split";
}) {
  const printedAt = formatPrintTimestamp(new Date());

  if (layout === "split") {
    return (
      <>
        <div className="fincast-print-browser-header" aria-hidden="true">
          <span className="fincast-print-browser-date">{printedAt}</span>
          <span className="fincast-print-browser-title">{PRINT_DOC_TITLE}</span>
        </div>
        <div className="fincast-print-browser-footer fincast-print-browser-footer--split" aria-hidden="true">
          <span>{PRINT_DOC_URL}</span>
          <span>{page}/{totalPages}</span>
        </div>
      </>
    );
  }

  return (
    <div className="fincast-print-browser-footer fincast-print-browser-footer--block" aria-hidden="true">
      <div className="fincast-print-browser-footer-row">
        <span>{printedAt}</span>
        <span>{PRINT_DOC_TITLE}</span>
      </div>
      <div className="fincast-print-browser-footer-row">
        <span>{PRINT_DOC_URL}</span>
        <span>{page}/{totalPages}</span>
      </div>
    </div>
  );
}

function formatPrintCurrency(v: number): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e15) return `$${(n / 1e15).toFixed(1)}Q`;
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPrintPlainNumber(v: number, maxDigits = 10): string {
  const s = String(Math.round(Number(v)));
  if (!Number.isFinite(Number(v))) return "—";
  if (s.length <= maxDigits) return s;
  return `${s.slice(0, maxDigits - 1)}…`;
}

function formatChartAxisValue(v: number): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1e15) return `$${(n / 1e15).toFixed(1)}Q`;
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
}

function maxScenarioBalance(
  data: { "Base Case": number; "Retire Later": number; "Spend Less": number; "Stress Return": number }[]
): number {
  let max = 0;
  for (const row of data) {
    max = Math.max(
      max,
      row["Base Case"] ?? 0,
      row["Retire Later"] ?? 0,
      row["Spend Less"] ?? 0,
      row["Stress Return"] ?? 0,
    );
  }
  return max;
}

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
  const fmt = formatPrintCurrency;
  const isRisk = !!projection.depletionAge;
  const chartMax = maxScenarioBalance(scenarioData);
  const yAxisLabel = formatChartAxisValue(chartMax);
  const yAxisWidth = Math.min(88, Math.max(52, yAxisLabel.length * 6.5 + 10));

  const inputs = [
    { label: "Current Age", value: formatPrintPlainNumber(ageNow) },
    { label: "Retirement Age", value: formatPrintPlainNumber(retireAge) },
    { label: "Portfolio Savings", value: fmt(currentSavings) },
    { label: "Pre-retirement Contributions", value: fmt(annualContributions) },
    { label: "Annual Return", value: `${formatPrintPlainNumber(annualReturn, 6)}%` },
    { label: "Retirement Spending", value: fmt(retirementSpending) },
    { label: "SS / Retirement Income", value: fmt(ssIncome) },
    { label: "Other Retirement Income", value: fmt(otherRetirementIncome) },
    { label: "Spending Inflation", value: `${formatPrintPlainNumber(inflation, 6)}%` },
  ];

  const printValueCellStyle: React.CSSProperties = {
    padding: "4px 0",
    fontWeight: 700,
    textAlign: "right",
    color: PRINT_COLOR.black,
    maxWidth: 0,
    width: "42%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const printLabelCellStyle: React.CSSProperties = {
    padding: "4px 0",
    color: PRINT_COLOR.label,
    fontWeight: 400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="fincast-print-page-1">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: PRINT_COLOR.black, letterSpacing: "-0.5px" }}>
            FinCast — Retirement Projection Summary{clientName ? `: ${clientName}` : ""}
          </div>
          <div style={{ fontSize: 13, color: PRINT_COLOR.meta, marginTop: 4, fontWeight: 400 }}>
            Prepared {today} · For advisor use only · Not a guarantee of future results
          </div>
          <div style={{ fontSize: 11, color: PRINT_COLOR.muted, marginTop: 2, fontWeight: 400 }}>
            No client data was saved or retained in the preparation of this document.
          </div>
        </div>
        <div style={{
          color: isRisk ? PRINT_COLOR.risk : "#15803d",
          fontWeight: 700,
          fontSize: 13,
          background: "transparent",
          whiteSpace: "nowrap",
        }}>
          {isRisk ? "⚠ Depletion Risk" : "✓ On Track"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px minmax(0, 1fr)", gap: 14 }}>
        {/* Left column: inputs + talking points */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0, overflow: "hidden" }}>
          {/* Inputs table */}
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: PRINT_COLOR.section, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Client Assumptions
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, tableLayout: "fixed" }}>
              <tbody>
                {inputs.map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: `1px solid ${PRINT_COLOR.border}` }}>
                    <td style={printLabelCellStyle}>{label}</td>
                    <td style={printValueCellStyle} title={value}>{value}</td>
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
            <div style={{ fontSize: 10, fontWeight: 700, color: isRisk ? PRINT_COLOR.riskHeading : "#166534", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Projection Outcome
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: isRisk ? PRINT_COLOR.risk : "#15803d", lineHeight: 1.35 }}>
              {resultMessage}
            </div>
            {!isRisk && projection.finalBalance > 0 && (
              <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fmt(projection.finalBalance)}>
                Est. balance at age 100: {fmt(projection.finalBalance)}
              </div>
            )}
          </div>

          {/* Talking points */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: PRINT_COLOR.section, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
              Advisor Talking Points
            </div>
            {[
              "This chart shows projected portfolio balance from today through age 100.",
              isRisk
                ? `At the current pace, savings may be exhausted around age ${projection.depletionAge}. Adjusting retirement age, spending, or return assumptions can significantly change the outlook.`
                : "Based on these assumptions, the portfolio is projected to remain positive. Stress-testing scenarios helps clients understand the margin of safety.",
            ].map((point, i) => (
              <div key={i} className="fincast-print-talking-point" style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 12.5, color: PRINT_COLOR.body, lineHeight: 1.45, fontWeight: 400 }}>
                <span style={{ color: PRINT_COLOR.body, flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{point}</span>
              </div>
            ))}
            <div className="fincast-print-talking-point" style={{ display: "flex", gap: 6, marginBottom: 6, fontSize: 12.5, color: PRINT_COLOR.body, lineHeight: 1.45, fontWeight: 400 }}>
              <span style={{ color: PRINT_COLOR.body, flexShrink: 0, marginTop: 1 }}>•</span>
              <span>
                Small changes — retiring 1-2 years later or reducing annual spending by 5-10% — can meaningfully extend portfolio life.
              </span>
            </div>
          </div>
        </div>

        {/* Right column: chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PRINT_COLOR.section, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Projected Portfolio Balance — All Scenarios (Age {ageNow}–100)
          </div>
          <div style={{ overflow: "hidden" }}>
            <LineChart
              width={820}
              height={360}
              data={scenarioData}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={PRINT_COLOR.grid} />
              <XAxis
                dataKey="age"
                type="number"
                domain={[ageNow, 100]}
                ticks={[60, 65, 70, 75, 80, 85, 90, 95, 100]}
                tick={{ fontSize: 15, fill: PRINT_COLOR.black, fontWeight: "bold" }}
                tickMargin={4}
                stroke={PRINT_COLOR.axis}
                height={32}
              />
              <YAxis
                tickFormatter={formatChartAxisValue}
                tick={{ fontSize: 13, fill: PRINT_COLOR.black, fontWeight: "bold" }}
                tickMargin={4}
                stroke={PRINT_COLOR.axis}
                width={yAxisWidth}
              />
              <ReferenceLine x={retireAge} stroke={PRINT_COLOR.axis} strokeDasharray="4 4" strokeWidth={2} label={{ value: "Retire", fontSize: 15, fill: PRINT_COLOR.black, fontWeight: "bold" }} />
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
            fontWeight: 700,
            color: PRINT_COLOR.black,
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
          <div className="fincast-print-disclaimer" style={{
            fontSize: 10.5,
            color: PRINT_COLOR.disclaimer,
            borderTop: `1px solid ${PRINT_COLOR.border}`,
            paddingTop: 6,
            lineHeight: 1.45,
            fontWeight: 400,
          }}>
            This projection is based on the assumptions entered above and uses a straight-line return model. It does not account for taxes, investment fees, or income sources beyond those entered. This document is for illustrative and discussion purposes only and does not constitute financial advice. Past performance is not indicative of future results.
          </div>
        </div>
      </div>

      <PrintBrowserChrome page={1} totalPages={1} layout="footer-block" />
      </div>
    </div>
  );
}

// Sub-components

function InputRow({
  label, value, setValue, prefix = "", fieldKey, fieldRef, highlighted,
}: {
  label: string; value: number; setValue: (v: number) => void; prefix?: string;
  fieldKey?: FieldKey;
  fieldRef?: React.MutableRefObject<Record<FieldKey, HTMLElement | null>>;
  highlighted?: boolean;
}) {
  return (
    <label
      ref={(el) => { if (fieldKey && fieldRef) fieldRef.current[fieldKey] = el; }}
      className={`grid grid-cols-[1fr_150px] gap-3 items-center p-1 -m-1 transition-all duration-200 ${highlighted ? "fincast-demo-field--active" : ""}`}
    >
      <span className={`font-medium text-slate-600 fincast-demo-focus-label ${highlighted ? "text-base" : "text-sm"}`}>{label}</span>
      <div className={INPUT_FIELD_HOVER_CLASS}>
        {prefix && <span className="absolute left-3 top-2.5 z-10 text-slate-400">{prefix}</span>}
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
  label, value, setValue, min, max, step = 1, prefix = "", suffix = "", decimals = 0,
  fieldKey, fieldRef, highlighted,
}: {
  label: string; value: number; setValue: (v: number) => void;
  min: number; max: number; step?: number; prefix?: string; suffix?: string; decimals?: number;
  fieldKey?: FieldKey;
  fieldRef?: React.MutableRefObject<Record<FieldKey, HTMLElement | null>>;
  highlighted?: boolean;
}) {
  const display = decimals > 0 ? Number(value).toFixed(decimals) : Number(value).toLocaleString();
  return (
    <div
      ref={(el) => { if (fieldKey && fieldRef) fieldRef.current[fieldKey] = el; }}
      className={`space-y-2 p-2 -m-2 rounded-xl transition-all duration-200 ${highlighted ? "fincast-demo-field--active" : ""}`}
    >
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium text-slate-600 fincast-demo-focus-label ${highlighted ? "text-base" : "text-sm"}`}>{label}</span>
        <span className={`font-semibold ${highlighted ? "text-lg" : ""}`}>{prefix}{display}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => setValue(v[0])} />
    </div>
  );
}

function ScenarioCard({
  title, body, action, cardRef, highlighted,
}: {
  title: string; body: string; action: () => void;
  cardRef?: (el: HTMLButtonElement | null) => void;
  highlighted?: boolean;
}) {
  return (
    <button
      ref={cardRef}
      onClick={action}
      className={`fincast-demo-card text-left rounded-2xl border border-slate-200 p-5 hover:bg-slate-50 transition-all duration-200 ${highlighted ? "fincast-demo-scenario--active" : ""}`}
    >
      <div className="font-semibold text-lg">{title}</div>
      <p className="text-sm text-slate-600 mt-2">{body}</p>
    </button>
  );
}
