"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useApi from "@/utils/useApi";
import { useUser } from "@/context/UserContext";

type PurchaseRow = {
  id: number;
  userId: number;
  planId: number;
  purchaseDate: string;
  user: { id: number; name: string | null; email: string | null };
  plan: { id: number; slug: string; title: string; amount: number };
  transactions: {
    id: number;
    transactionId: string;
    amount: number;
    purchaseDate: string;
  }[];
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateOnly(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function UserPurchasePlansPage() {
  const { user } = useUser();
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const { data, loading, fetchApi } = useApi({
    url: "/api/admin/user-purchase-plans",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  const isAdminReporter =
    user?.userType === "ADMIN" ||
    user?.role?.slug === "admin" ||
    user?.role?.isSuperAdmin === true;

  useEffect(() => {
    document.title = "Admin | Plan purchases";
  }, []);

  useEffect(() => {
    void fetchApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setRows(data as PurchaseRow[]);
    }
  }, [data]);

  const colCount = isAdminReporter ? 7 : 6;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {isAdminReporter ? "Plan purchases (all users)" : "My plan purchases"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isAdminReporter
            ? "Reporting view: every purchase linked to a user and plan."
            : "Purchases linked to your account only."}
        </p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                ID
              </TableCell>
              {isAdminReporter ? (
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Customer
                </TableCell>
              ) : null}
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Plan
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Plan amount
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Purchased on
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Stripe ref
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Paid
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <TableRow>
                <TableCell className="py-8 text-center text-gray-500" colSpan={colCount}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length > 0 ? (
              rows.map((r) => {
                const tx = r.transactions[0];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                      {r.id}
                    </TableCell>
                    {isAdminReporter ? (
                      <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                        <div className="font-medium text-gray-800 dark:text-white/90">
                          {r.user?.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{r.user?.email || "—"}</div>
                      </TableCell>
                    ) : null}
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {r.plan?.title}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">({r.plan?.slug})</span>
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {formatMoney(r.plan?.amount ?? 0)}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {formatDateOnly(r.purchaseDate)}
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {tx?.transactionId ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {tx ? formatMoney(tx.amount) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center text-gray-500" colSpan={colCount}>
                  No purchases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
