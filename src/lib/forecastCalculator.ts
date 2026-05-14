export type TermSource = {
  amountPerYear: number;
  beginningYear: number;
  endingYear: number;
};

export type OneTimePurchase = {
  description?: string;
  year: number;
  amount: number;
};

export type ForecastInput = {
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
  source1?: TermSource;
  source2?: TermSource;
  recurringExpensesNotes?: string;
  purchases?: OneTimePurchase[];
};

export type ForecastYearRow = {
  yearNumber: number;
  age: number;
  beginningBalance: number;
  investmentGain: number;
  lastingFunds: number;
  source1Amount: number;
  source2Amount: number;
  totalSources: number;
  recurringExpenses: number;
  oneTimePurchases: number;
  totalUses: number;
  netFlowBeforeTax: number;
  withdrawalTax: number;
  finalNetFlow: number;
  endingBalance: number;
  realEstateValue: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Parse form / API values: strips commas and $, supports number passthrough. */
export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  const cleaned = String(value ?? "0")
    .replace(/,/g, "")
    .replace(/\$/g, "")
    .trim();

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Convert a stored percentage value (e.g. 5.5) to a decimal rate (0.055). */
export function percent(value: number): number {
  return value / 100;
}

export function getTermSourceAmount(source: TermSource | undefined, yearNumber: number): number {
  
  if (!source) return 0;
  const { amountPerYear, beginningYear, endingYear } = source;
  if (!Number.isFinite(amountPerYear) || !Number.isFinite(beginningYear) || !Number.isFinite(endingYear)) {
    return 0;
  }
  //if (yearNumber >= beginningYear && yearNumber <= endingYear) {
    return amountPerYear;
 // }
  //return 0;
}

export function getOneTimePurchaseTotal(
  purchases: OneTimePurchase[] | undefined,
  yearNumber: number
): number {
  if (!purchases?.length) return 0;
  return purchases.reduce((sum, p) => {
    if (p.year === yearNumber && Number.isFinite(p.amount)) {
      return sum + p.amount;
    }
    return sum;
  }, 0);
}

export function calculateForecast(input: ForecastInput): ForecastYearRow[] {
  const forecastYears = Math.max(0, Math.floor(input.forecastYears));
  const roiRate = input.returnOnInvestmentRate;
  const inflationRate = input.costOfLivingInflationRate;
  const incomeGrowthRate = input.incomeGrowthRate;
  const realEstateRate = input.realEstateAppreciationRate;
  const withdrawalTaxRate = input.withdrawalTaxRate;

  const results: ForecastYearRow[] = [];

  let balance = Number(input.beginningBalance || 0);
  let lastingFunds = Number(input.annualLastingFunds || 0);
  let recurringExpenses = Number(input.recurringExpensesPerYear || 0);
  let realEstateValue = Number(input.totalRealEstateValue || 0);
  recurringExpenses = roundMoney((recurringExpenses * inflationRate) + recurringExpenses);
  for (let yearNumber = 1; yearNumber <= forecastYears; yearNumber += 1) {
    const age = input.retirementAge + yearNumber -1;

    if (yearNumber > 1) {
      lastingFunds = roundMoney(lastingFunds * (1 + incomeGrowthRate));
      recurringExpenses = roundMoney(recurringExpenses * (1 + inflationRate));
      realEstateValue = roundMoney(realEstateValue * (1 + realEstateRate));
    }
    console.log("recurringExpenses", recurringExpenses);
    
    const beginningBalance = roundMoney(balance);

    const source1AmountRaw = getTermSourceAmount(input.source1, yearNumber);
    const source2AmountRaw = getTermSourceAmount(input.source2, yearNumber);
    const source1Amount = roundMoney(source1AmountRaw);
    const source2Amount = roundMoney(source2AmountRaw);
    const oneTimePurchases = roundMoney(getOneTimePurchaseTotal(input.purchases, yearNumber));
    const investmentGain = beginningBalance * roiRate;
    const totalSources = roundMoney(investmentGain + lastingFunds + source1Amount + source2Amount);
    const totalUses = roundMoney(recurringExpenses + oneTimePurchases);
    const netFlowBeforeTax = roundMoney(totalSources - totalUses);
    const withdrawalTax =
      netFlowBeforeTax < 0 ? roundMoney(totalUses * withdrawalTaxRate) : 0;
    const finalNetFlow = roundMoney(netFlowBeforeTax - withdrawalTax);
    const endingBalance = roundMoney(beginningBalance + finalNetFlow);

    results.push({
      yearNumber,
      age,
      beginningBalance,
      investmentGain,
      lastingFunds: roundMoney(lastingFunds),
      source1Amount,
      source2Amount,
      totalSources,
      recurringExpenses: roundMoney(recurringExpenses),
      oneTimePurchases,
      totalUses,
      netFlowBeforeTax,
      withdrawalTax,
      finalNetFlow,
      endingBalance,
      realEstateValue: roundMoney(realEstateValue),
    });

    balance = endingBalance;
  }

  return results;
}
