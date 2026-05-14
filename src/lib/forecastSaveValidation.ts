import type { ForecastInput } from "@/lib/forecastCalculator";

function isFiniteNonNegative(n: number): boolean {
  return Number.isFinite(n) && n >= 0;
}

/** Server/client validation before persisting or trusting a forecast payload. */
export function validateForecastSavePayload(p: ForecastInput): string[] {
  const errors: string[] = [];

  if (!isFiniteNonNegative(p.beginningBalance)) {
    errors.push("Beginning balance is required and must be a valid non-negative number.");
  }
  if (!Number.isFinite(p.retirementAge) || p.retirementAge <= 0) {
    errors.push("Retirement age is required and must be greater than zero.");
  }
  if (!Number.isFinite(p.forecastYears) || p.forecastYears <= 0) {
    errors.push("Forecast years is required and must be greater than zero.");
  }
  if (!isFiniteNonNegative(p.returnOnInvestmentRate)) {
    errors.push("Return on investment rate is required.");
  }
  if (!isFiniteNonNegative(p.costOfLivingInflationRate)) {
    errors.push("Cost of living inflation rate is required.");
  }
  if (!isFiniteNonNegative(p.incomeGrowthRate)) {
    errors.push("Income growth rate is required.");
  }
  if (!isFiniteNonNegative(p.withdrawalTaxRate)) {
    errors.push("Withdrawal tax rate is required.");
  }
  if (!isFiniteNonNegative(p.recurringExpensesPerYear)) {
    errors.push("Recurring expenses per year is required.");
  }

  return errors;
}

/** Additional non-negative checks for optional numeric fields (matches prior client validation). */
export function validateForecastOptionalNonNegative(p: ForecastInput): string[] {
  const errors: string[] = [];
  const numericChecks: Array<{ label: string; value: number }> = [
    { label: "Total value of real estate", value: p.totalRealEstateValue },
    { label: "Annual lasting funds", value: p.annualLastingFunds },
    { label: "Real estate appreciation rate", value: p.realEstateAppreciationRate },
    { label: "Source 1 amount per year", value: p.source1?.amountPerYear ?? 0 },
    { label: "Source 1 beginning year", value: p.source1?.beginningYear ?? 0 },
    { label: "Source 1 ending year", value: p.source1?.endingYear ?? 0 },
    { label: "Source 2 amount per year", value: p.source2?.amountPerYear ?? 0 },
    { label: "Source 2 beginning year", value: p.source2?.beginningYear ?? 0 },
    { label: "Source 2 ending year", value: p.source2?.endingYear ?? 0 },
    { label: "Purchase 1 year", value: p.purchases?.[0]?.year ?? 0 },
    { label: "Purchase 1 amount", value: p.purchases?.[0]?.amount ?? 0 },
    { label: "Purchase 2 year", value: p.purchases?.[1]?.year ?? 0 },
    { label: "Purchase 2 amount", value: p.purchases?.[1]?.amount ?? 0 },
  ];

  for (const { label, value } of numericChecks) {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${label} cannot be negative or invalid.`);
    }
  }

  return errors;
}

export function validateForecastFormPayload(p: ForecastInput): string[] {
  return [...validateForecastSavePayload(p), ...validateForecastOptionalNonNegative(p)];
}
