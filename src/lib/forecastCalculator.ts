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
const customRound = (value: number) =>
  value < 0 ? Math.floor(value) : Math.round(value);
const makeNegative = (value: number) => -value;
const roundPointValue = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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
  const roiRate = input.returnOnInvestmentRate / 100;
  const inflationRate = input.costOfLivingInflationRate / 100;
  const incomeGrowthRate = input.incomeGrowthRate / 100;
  const realEstateRate = input.realEstateAppreciationRate / 100;
  const withdrawalTaxRate = input.withdrawalTaxRate / 100;

  const results: ForecastYearRow[] = [];

  let balance = Number(input.beginningBalance || 0);
  let annualLastingFunds = Number(input.annualLastingFunds || 0);
  let recurringExpenses = makeNegative(Number(input.recurringExpensesPerYear || 0));
  let realEstateValue = Number(input.totalRealEstateValue || 0);

  //recurringExpenses = roundMoney((recurringExpenses * inflationRate) + recurringExpenses);
  for (let yearNumber = 1; yearNumber <= forecastYears; yearNumber += 1) {
    const age = input.retirementAge + yearNumber -1;
    let beginningBalance = balance;
    let investmentGain = customRound(beginningBalance * roiRate);
    let linesource3 = annualLastingFunds;
    let sumSources = investmentGain + annualLastingFunds;
    let usesExpenses = (recurringExpenses * inflationRate) + recurringExpenses;
    let netFlowBeforeTax = sumSources + usesExpenses;
    let withdrawalTax = netFlowBeforeTax < 0 ? withdrawalTaxRate * usesExpenses : 0;
    let sumWithdrawalTax = withdrawalTax + netFlowBeforeTax;
    if (yearNumber > 1) {
      console.log("greater============================")
      balance = beginningBalance + sumWithdrawalTax;
      console.log("bgreateralance============================", balance);
      balance = beginningBalance + sumWithdrawalTax;
      investmentGain = customRound(beginningBalance * roiRate);
      linesource3 = (annualLastingFunds * incomeGrowthRate) + annualLastingFunds;
      sumSources = investmentGain + linesource3;
      usesExpenses = (usesExpenses * inflationRate) + usesExpenses;
      netFlowBeforeTax = sumSources + usesExpenses;
      withdrawalTax = Math.trunc(netFlowBeforeTax < 0 ? withdrawalTaxRate * usesExpenses : 0);
      sumWithdrawalTax = withdrawalTax + netFlowBeforeTax;
    }
    console.log("balance============================", balance);
    console.log("investmentGain============================", investmentGain);
    console.log("linesource3============================", linesource3);
    // console.log("sumSources============================", sumSources);
    // console.log("usesExpenses============================", usesExpenses);
    // console.log("netFlowBeforeTax============================", netFlowBeforeTax);
    // console.log("withdrawalTax============================", withdrawalTax);
    //console.log("sumWithdrawalTax============================", sumWithdrawalTax);
  
  }

  return results;
}