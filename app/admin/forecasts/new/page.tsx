"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";

type TermSource = {
  amountPerYear: string;
  beginningYear: string;
  endingYear: string;
};

type OneTimeUse = {
  description: string;
  purchaseYear: string;
  amount: string;
};

const emptyTerm = (): TermSource => ({
  amountPerYear: "",
  beginningYear: "",
  endingYear: "",
});

const emptyOneTime = (): OneTimeUse => ({
  description: "",
  purchaseYear: "",
  amount: "",
});

export default function ForecastNewPage() {
  const router = useRouter();
  const [realEstateTotal, setRealEstateTotal] = useState("");
  const [source1, setSource1] = useState<TermSource>(emptyTerm);
  const [source2, setSource2] = useState<TermSource>(emptyTerm);
  const [purchase1, setPurchase1] = useState<OneTimeUse>(emptyOneTime);
  const [purchase2, setPurchase2] = useState<OneTimeUse>(emptyOneTime);
  const [realEstateAppreciation, setRealEstateAppreciation] = useState("0");
  const [recurringNotes, setRecurringNotes] = useState("");

  useEffect(() => {
    document.title = "Admin | New forecast";
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">New forecast</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter scenario details. Save will connect when your API is ready.
          </p>
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
          <Button type="button" size="sm" disabled title="Wire to save endpoint">
            Save forecast
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Forecast worksheet
        </h3>

        <div className="space-y-6">
          <div>
            <Label htmlFor="real-estate-total">Total value of Real Estate</Label>
            <Input
              id="real-estate-total"
              type="text"
              value={realEstateTotal}
              onChange={(e) => setRealEstateTotal(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-white/90">Sources of term funds</span>{" "}
              (these have a beginning year and ending year).
            </p>

            <TermSourceFields n={1} row={source1} onChange={setSource1} />
            <div className="my-6 border-t border-gray-100 dark:border-gray-800" />
            <TermSourceFields n={2} row={source2} onChange={setSource2} />
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            <h4 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
              Uses of funds (recurring)
            </h4>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Rent, food, dining, entertainment, insurance, mortgage, etc.
            </p>
            <Label>Recurring expenses (notes)</Label>
            <TextArea
              rows={4}
              value={recurringNotes}
              onChange={setRecurringNotes}
              placeholder="Describe recurring items or amounts"
              hint="Optional — align with your spreadsheet notes."
            />
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-white/90">Uses of funds (one time)</span>{" "}
              — examples: purchase of car, real estate, college tuition.
            </p>

            <OneTimeFields label="Purchase 1" row={purchase1} onChange={setPurchase1} prefix="p1" />
            <div className="my-6 border-t border-gray-100 dark:border-gray-800" />
            <OneTimeFields label="Purchase 2" row={purchase2} onChange={setPurchase2} prefix="p2" />
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Assumptions</h4>
            <div>
              <Label htmlFor="re-appreciation">Real estate appreciation rate (%)</Label>
              <Input
                id="re-appreciation"
                type="text"
                value={realEstateAppreciation}
                onChange={(e) => setRealEstateAppreciation(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/forecasts")}>
            Close
          </Button>
          <Button type="button" size="sm" disabled title="Wire to save endpoint">
            Save forecast
          </Button>
        </div>
      </div>
    </div>
  );
}

function TermSourceFields({
  n,
  row,
  onChange,
}: {
  n: 1 | 2;
  row: TermSource;
  onChange: (next: TermSource) => void;
}) {
  const base = `s${n}`;
  return (
    <div>
      <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Source #{n}</h4>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
        <div className="lg:col-span-1">
          <Label htmlFor={`${base}-amount`}>Amount per year</Label>
          <Input
            id={`${base}-amount`}
            type="text"
            value={row.amountPerYear}
            onChange={(e) => onChange({ ...row, amountPerYear: e.target.value })}
            placeholder="Enter value"
          />
        </div>
        <div className="lg:col-span-1">
          <Label htmlFor={`${base}-begin`}>Beginning year</Label>
          <Input
            id={`${base}-begin`}
            type="text"
            value={row.beginningYear}
            onChange={(e) => onChange({ ...row, beginningYear: e.target.value })}
            placeholder="Enter year"
          />
        </div>
        <div className="lg:col-span-1">
          <Label htmlFor={`${base}-end`}>Ending year</Label>
          <Input
            id={`${base}-end`}
            type="text"
            value={row.endingYear}
            onChange={(e) => onChange({ ...row, endingYear: e.target.value })}
            placeholder="Enter year"
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
  prefix,
}: {
  label: string;
  row: OneTimeUse;
  onChange: (next: OneTimeUse) => void;
  prefix: string;
}) {
  return (
    <div>
      <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">{label}</h4>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Label htmlFor={`${prefix}-desc`}>Description of purchase</Label>
          <Input
            id={`${prefix}-desc`}
            type="text"
            value={row.description}
            onChange={(e) => onChange({ ...row, description: e.target.value })}
            placeholder="Enter description"
          />
        </div>
        <div className="lg:col-span-1">
          <Label htmlFor={`${prefix}-year`}>Year of purchase</Label>
          <Input
            id={`${prefix}-year`}
            type="text"
            value={row.purchaseYear}
            onChange={(e) => onChange({ ...row, purchaseYear: e.target.value })}
            placeholder="Enter year"
          />
        </div>
        <div className="lg:col-span-1">
          <Label htmlFor={`${prefix}-amount`}>Amount</Label>
          <Input
            id={`${prefix}-amount`}
            type="text"
            value={row.amount}
            onChange={(e) => onChange({ ...row, amount: e.target.value })}
            placeholder="Enter value"
          />
        </div>
      </div>
    </div>
  );
}
