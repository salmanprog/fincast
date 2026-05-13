"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import {
  calculateForecast,
  toNumber,
  type ForecastYearRow,
} from "@/lib/forecastCalculator";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

type TermSource = {
  amountPerYear: string;
  beginningYear: string;
  endingYear: string;
};

type PurchaseRow = {
  description: string;
  year: string;
  amount: string;
};

type FormDataState = {
  forecastYears: string;
  beginningBalance: string;
  totalRealEstateValue: string;
  annualLastingFunds: string;
  recurringExpensesPerYear: string;
  retirementAge: string;
  returnOnInvestmentRate: string;
  costOfLivingInflationRate: string;
  incomeGrowthRate: string;
  realEstateAppreciationRate: string;
  withdrawalTaxRate: string;
  source1: TermSource;
  source2: TermSource;
  recurringExpensesNotes: string;
  purchases: [PurchaseRow, PurchaseRow];
};

export type ForecastSavePayload = {
  forecastYears: number;
  beginningBalance: number;
  totalRealEstateValue: number;
  annualLastingFunds: number;
  recurringExpensesPerYear: number;
  retirementAge: number;
  returnOnInvestmentRate: number;
  costOfLivingInflationRate: number;
  incomeGrowthRate: number;
  realEstateAppreciationRate: number;
  withdrawalTaxRate: number;
  source1: {
    amountPerYear: number;
    beginningYear: number;
    endingYear: number;
  };
  source2: {
    amountPerYear: number;
    beginningYear: number;
    endingYear: number;
  };
  recurringExpensesNotes: string;
  purchases: [
    { description: string; year: number; amount: number },
    { description: string; year: number; amount: number },
  ];
};

const initialFormData = (): FormDataState => ({
  forecastYears: "30",
  beginningBalance: "",
  totalRealEstateValue: "",
  annualLastingFunds: "",
  recurringExpensesPerYear: "",
  retirementAge: "",
  returnOnInvestmentRate: "",
  costOfLivingInflationRate: "",
  incomeGrowthRate: "",
  realEstateAppreciationRate: "0",
  withdrawalTaxRate: "",
  source1: {
    amountPerYear: "",
    beginningYear: "",
    endingYear: "",
  },
  source2: {
    amountPerYear: "",
    beginningYear: "",
    endingYear: "",
  },
  recurringExpensesNotes: "",
  purchases: [
    { description: "", year: "", amount: "" },
    { description: "", year: "", amount: "" },
  ],
});

function buildForecastPayload(formData: FormDataState): ForecastSavePayload {
  return {
    forecastYears: toNumber(formData.forecastYears),
    beginningBalance: toNumber(formData.beginningBalance),
    totalRealEstateValue: toNumber(formData.totalRealEstateValue),
    annualLastingFunds: toNumber(formData.annualLastingFunds),
    recurringExpensesPerYear: toNumber(formData.recurringExpensesPerYear),
    retirementAge: toNumber(formData.retirementAge),
    returnOnInvestmentRate: toNumber(formData.returnOnInvestmentRate),
    costOfLivingInflationRate: toNumber(formData.costOfLivingInflationRate),
    incomeGrowthRate: toNumber(formData.incomeGrowthRate),
    realEstateAppreciationRate: toNumber(formData.realEstateAppreciationRate),
    withdrawalTaxRate: toNumber(formData.withdrawalTaxRate),
    source1: {
      amountPerYear: toNumber(formData.source1.amountPerYear),
      beginningYear: toNumber(formData.source1.beginningYear),
      endingYear: toNumber(formData.source1.endingYear),
    },
    source2: {
      amountPerYear: toNumber(formData.source2.amountPerYear),
      beginningYear: toNumber(formData.source2.beginningYear),
      endingYear: toNumber(formData.source2.endingYear),
    },
    recurringExpensesNotes: formData.recurringExpensesNotes,
    purchases: [
      {
        description: formData.purchases[0].description,
        year: toNumber(formData.purchases[0].year),
        amount: toNumber(formData.purchases[0].amount),
      },
      {
        description: formData.purchases[1].description,
        year: toNumber(formData.purchases[1].year),
        amount: toNumber(formData.purchases[1].amount),
      },
    ],
  };
}

function isNonNegativeFinite(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

function validatePayload(payload: ForecastSavePayload): string[] {
  const errors: string[] = [];

  if (!isNonNegativeFinite(payload.beginningBalance)) {
    errors.push("Beginning balance is required and must be zero or greater.");
  }
  if (!isNonNegativeFinite(payload.forecastYears) || payload.forecastYears <= 0) {
    errors.push("Forecast years is required and must be greater than zero.");
  }

  const numericChecks: Array<{ label: string; value: number }> = [
    { label: "Total value of real estate", value: payload.totalRealEstateValue },
    { label: "Annual lasting funds", value: payload.annualLastingFunds },
    { label: "Recurring expenses per year", value: payload.recurringExpensesPerYear },
    { label: "Retirement age", value: payload.retirementAge },
    { label: "Return on investment rate", value: payload.returnOnInvestmentRate },
    { label: "Cost of living inflation rate", value: payload.costOfLivingInflationRate },
    { label: "Income growth rate", value: payload.incomeGrowthRate },
    { label: "Real estate appreciation rate", value: payload.realEstateAppreciationRate },
    { label: "Withdrawal tax rate", value: payload.withdrawalTaxRate },
    { label: "Source 1 amount per year", value: payload.source1.amountPerYear },
    { label: "Source 1 beginning year", value: payload.source1.beginningYear },
    { label: "Source 1 ending year", value: payload.source1.endingYear },
    { label: "Source 2 amount per year", value: payload.source2.amountPerYear },
    { label: "Source 2 beginning year", value: payload.source2.beginningYear },
    { label: "Source 2 ending year", value: payload.source2.endingYear },
    { label: "Purchase 1 year", value: payload.purchases[0].year },
    { label: "Purchase 1 amount", value: payload.purchases[0].amount },
    { label: "Purchase 2 year", value: payload.purchases[1].year },
    { label: "Purchase 2 amount", value: payload.purchases[1].amount },
  ];

  for (const { label, value } of numericChecks) {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${label} cannot be negative or invalid.`);
    }
  }

  return errors;
}

export default function ForecastNewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormDataState>(initialFormData);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"beginningBalance" | "forecastYears", string>>>({});
  const [forecastRows, setForecastRows] = useState<ForecastYearRow[]>([]);

  useEffect(() => {
    document.title = "Admin | New forecast";
  }, []);

  const handleChange = (key: keyof Omit<FormDataState, "source1" | "source2" | "purchases">, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "beginningBalance" || key === "forecastYears") {
      setFieldErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  const handleSourceChange = (
    sourceKey: "source1" | "source2",
    fieldKey: keyof TermSource,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [sourceKey]: { ...prev[sourceKey], [fieldKey]: value },
    }));
  };

  const handlePurchaseChange = (index: 0 | 1, fieldKey: keyof PurchaseRow, value: string) => {
    setFormData((prev) => {
      const next = [...prev.purchases] as [PurchaseRow, PurchaseRow];
      next[index] = { ...next[index], [fieldKey]: value };
      return { ...prev, purchases: next };
    });
  };

  const handleSubmit = () => {
    setSubmitErrors([]);
    const nextField: Partial<Record<"beginningBalance" | "forecastYears", string>> = {};

    if (formData.beginningBalance.trim() === "") {
      nextField.beginningBalance = "Beginning balance is required.";
    }
    if (formData.forecastYears.trim() === "") {
      nextField.forecastYears = "Forecast years is required.";
    }

    setFieldErrors(nextField);
    if (Object.keys(nextField).length > 0) {
      setForecastRows([]);
      return;
    }

    const payload = buildForecastPayload(formData);
    console.log("Raw formData:", formData);
    console.log("Forecast payload:", payload);

    const errors = validatePayload(payload);
    if (errors.length > 0) {
      setSubmitErrors(errors);
      setForecastRows([]);
      return;
    }

    const results = calculateForecast(payload);
    setForecastRows(results);

    console.log("Forecast results:", results);
  };

  const finalEndingBalance = forecastRows[forecastRows.length - 1]?.endingBalance ?? 0;
  const totalInvestmentGain = forecastRows.reduce((sum, row) => sum + row.investmentGain, 0);
  const totalSources = forecastRows.reduce((sum, row) => sum + row.totalSources, 0);
  const totalUses = forecastRows.reduce((sum, row) => sum + row.totalUses, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">New forecast</h2>
          <p className="mt-2 text-sm">
            <Link
              href="/admin/forecasts"
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              ← Back to forecasts
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/forecasts")}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit}>
            Save forecast
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Forecast worksheet
        </h3>

        {submitErrors.length > 0 ? (
          <div
            className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-200"
            role="alert"
          >
            <p className="font-medium">Please fix the following:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {submitErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-6">
          <FormSection title="Starting Values" showDivider={false}>
            <FieldGrid>
              <div>
                <Label htmlFor="beginning-balance">Beginning balance</Label>
                <Input
                  id="beginning-balance"
                  type="text"
                  placeholder="Enter beginning balance"
                  value={formData.beginningBalance}
                  onChange={(e) => handleChange("beginningBalance", e.target.value)}
                  error={!!fieldErrors.beginningBalance}
                  hint={fieldErrors.beginningBalance}
                />
              </div>
              <div>
                <Label htmlFor="total-real-estate">Total value of real estate</Label>
                <Input
                  id="total-real-estate"
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="Enter real estate value"
                  value={formData.totalRealEstateValue}
                  onChange={(e) => handleChange("totalRealEstateValue", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="retirement-age">Retirement age</Label>
                <Input
                  id="retirement-age"
                  type="number"
                  min="0"
                  step={1}
                  placeholder="Enter retirement age"
                  value={formData.retirementAge}
                  onChange={(e) => handleChange("retirementAge", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="forecast-years">Forecast years</Label>
                <Input
                  id="forecast-years"
                  type="number"
                  min="0"
                  step={1}
                  placeholder="30"
                  value={formData.forecastYears}
                  onChange={(e) => handleChange("forecastYears", e.target.value)}
                  error={!!fieldErrors.forecastYears}
                  hint={fieldErrors.forecastYears}
                />
              </div>
            </FieldGrid>
          </FormSection>

          <FormSection
            title="Income / sources"
            description="Annual income and growth, plus term-limited sources."
          >
            <FieldGrid>
              <div>
                <Label htmlFor="annual-lasting-funds">Annual lasting funds / annual income</Label>
                <Input
                  id="annual-lasting-funds"
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="Enter annual amount"
                  value={formData.annualLastingFunds}
                  onChange={(e) => handleChange("annualLastingFunds", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="income-growth-rate">Income growth rate (%)</Label>
                <Input
                  id="income-growth-rate"
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="Example: 2.8"
                  value={formData.incomeGrowthRate}
                  onChange={(e) => handleChange("incomeGrowthRate", e.target.value)}
                />
              </div>
            </FieldGrid>

            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
              <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Sources of term funds</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                These have a beginning year and ending year.
              </p>
              <div className="mt-6 space-y-8">
                <TermSourceFields
                  n={1}
                  row={formData.source1}
                  onChange={(fieldKey, value) => handleSourceChange("source1", fieldKey, value)}
                />
                <div className="border-t border-gray-100 dark:border-gray-800" />
                <TermSourceFields
                  n={2}
                  row={formData.source2}
                  onChange={(fieldKey, value) => handleSourceChange("source2", fieldKey, value)}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Expenses / uses" description="Living expenses and one-time uses of funds.">
            <FieldGrid>
              <div className="md:col-span-2">
                <Label htmlFor="recurring-expenses">Recurring living expenses amount per year</Label>
                <Input
                  id="recurring-expenses"
                  type="text"
                  placeholder="Enter annual recurring expenses"
                  value={formData.recurringExpensesPerYear}
                  onChange={(e) => handleChange("recurringExpensesPerYear", e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="recurring-notes">Recurring expenses notes</Label>
                <TextArea
                  id="recurring-notes"
                  rows={4}
                  value={formData.recurringExpensesNotes}
                  onChange={(v) => handleChange("recurringExpensesNotes", v)}
                  placeholder="Describe recurring items or amounts"
                  hint="Optional — align with your spreadsheet notes."
                />
              </div>
            </FieldGrid>

            <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800">
              <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">Uses of funds (one time)</h4>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Examples: purchase of car, real estate, college tuition.
              </p>
              <div className="mt-6 space-y-8">
                <OneTimeFields
                  label="Purchase 1"
                  row={formData.purchases[0]}
                  index={0}
                  onChange={(fieldKey, value) => handlePurchaseChange(0, fieldKey, value)}
                />
                <div className="border-t border-gray-100 dark:border-gray-800" />
                <OneTimeFields
                  label="Purchase 2"
                  row={formData.purchases[1]}
                  index={1}
                  onChange={(fieldKey, value) => handlePurchaseChange(1, fieldKey, value)}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Assumptions" description="Rates used for the forecast model.">
            <FieldGrid>
              <div>
                <Label htmlFor="roi-rate">Return on investment rate (%)</Label>
                <Input
                  id="roi-rate"
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="Example: 5.5"
                  value={formData.returnOnInvestmentRate}
                  onChange={(e) => handleChange("returnOnInvestmentRate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="inflation-rate">Cost of living inflation rate (%)</Label>
                <Input
                  id="inflation-rate"
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="Example: 3"
                  value={formData.costOfLivingInflationRate}
                  onChange={(e) => handleChange("costOfLivingInflationRate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="re-appreciation">Real estate appreciation rate (%)</Label>
                <Input
                  id="re-appreciation"
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="0"
                  value={formData.realEstateAppreciationRate}
                  onChange={(e) => handleChange("realEstateAppreciationRate", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="withdrawal-tax">Withdrawal tax rate (%)</Label>
                <Input
                  id="withdrawal-tax"
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="Example: 6"
                  value={formData.withdrawalTaxRate}
                  onChange={(e) => handleChange("withdrawalTaxRate", e.target.value)}
                />
              </div>
            </FieldGrid>
          </FormSection>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/forecasts")}>
            Close
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit}>
            Save forecast
          </Button>
        </div>
      </div>

      {forecastRows.length > 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Forecast Results</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {forecastRows.length}-year projection based on the entered assumptions.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setForecastRows([])}>
              Clear results
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Final ending balance
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                {formatCurrency(finalEndingBalance)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total investment gain
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                {formatCurrency(totalInvestmentGain)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total sources
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                {formatCurrency(totalSources)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total uses
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white/90">
                {formatCurrency(totalUses)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1280px] w-full border-collapse text-left text-xs text-gray-700 dark:text-gray-300">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-gray-50 px-2.5 py-2.5 font-semibold text-gray-800 dark:bg-gray-900/90 dark:text-white/90">
                    Year
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Age
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Beginning Balance
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Investment Gain
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Lasting Funds
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Source #1
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Source #2
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Total Sources
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Recurring Expenses
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    One-Time Purchases
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Total Uses
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Net Flow
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Withdrawal Tax
                  </th>
                  <th className="whitespace-nowrap px-2.5 py-2.5 font-semibold text-gray-800 dark:text-white/90">
                    Ending Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {forecastRows.map((row) => (
                  <tr
                    key={row.yearNumber}
                    className="border-b border-gray-100 odd:bg-white even:bg-gray-50/60 dark:border-gray-800 dark:odd:bg-transparent dark:even:bg-white/[0.02]"
                  >
                    <td className="sticky left-0 z-10 whitespace-nowrap odd:bg-white even:bg-gray-50/60 px-2.5 py-2 font-medium tabular-nums text-gray-900 dark:odd:bg-gray-950/95 dark:even:bg-gray-900/50 dark:text-white/90">
                      {row.yearNumber}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">{row.age}</td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.beginningBalance)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.investmentGain)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.lastingFunds)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.source1Amount)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.source2Amount)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.totalSources)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.recurringExpenses)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.oneTimePurchases)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.totalUses)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.netFlowBeforeTax)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                      {formatCurrency(row.withdrawalTax)}
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2 tabular-nums font-semibold text-gray-900 dark:text-white/90">
                      {formatCurrency(row.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
  showDivider = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  showDivider?: boolean;
}) {
  return (
    <div
      className={
        showDivider
          ? "border-t border-gray-200 pt-6 dark:border-gray-800"
          : ""
      }
    >
      <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h4>
      {description ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      ) : null}
      <div className="mt-5 space-y-6">{children}</div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>;
}

function TermSourceFields({
  n,
  row,
  onChange,
}: {
  n: 1 | 2;
  row: TermSource;
  onChange: (fieldKey: keyof TermSource, value: string) => void;
}) {
  const base = `s${n}`;
  return (
    <div>
      <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Source #{n}
      </h5>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor={`${base}-amount`}>Amount per year</Label>
          <Input
            id={`${base}-amount`}
            type="number"
            min="0"
            step={0.01}
            placeholder="Enter value"
            value={row.amountPerYear}
            onChange={(e) => onChange("amountPerYear", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${base}-begin`}>Beginning year</Label>
          <Input
            id={`${base}-begin`}
            type="number"
            min="0"
            step={1}
            placeholder="Enter year"
            value={row.beginningYear}
            onChange={(e) => onChange("beginningYear", e.target.value)}
          />
        </div>
        <div className="md:col-span-1">
          <Label htmlFor={`${base}-end`}>Ending year</Label>
          <Input
            id={`${base}-end`}
            type="number"
            min="0"
            step={1}
            placeholder="Enter year"
            value={row.endingYear}
            onChange={(e) => onChange("endingYear", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function OneTimeFields({
  label,
  row,
  onChange,
  index,
}: {
  label: string;
  row: PurchaseRow;
  onChange: (fieldKey: keyof PurchaseRow, value: string) => void;
  index: 0 | 1;
}) {
  const prefix = `p${index}`;
  return (
    <div>
      <h5 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">{label}</h5>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor={`${prefix}-desc`}>Description of purchase</Label>
          <Input
            id={`${prefix}-desc`}
            type="text"
            placeholder="Enter description"
            value={row.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-year`}>Year of purchase</Label>
          <Input
            id={`${prefix}-year`}
            type="number"
            min="0"
            step={1}
            placeholder="Enter year"
            value={row.year}
            onChange={(e) => onChange("year", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-amount`}>Amount</Label>
          <Input
            id={`${prefix}-amount`}
            type="number"
            min="0"
            step={0.01}
            placeholder="Enter value"
            value={row.amount}
            onChange={(e) => onChange("amount", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
