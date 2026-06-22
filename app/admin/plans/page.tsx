"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import useApi from "@/utils/useApi";

type PlanRow = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  amount: number;
  credits: number;
  status: boolean;
};

type PlanForm = {
  title: string;
  description: string;
  amount: string;
  credits: string;
  status: boolean;
};

const emptyForm = (): PlanForm => ({
  title: "",
  description: "",
  amount: "",
  credits: "",
  status: true,
});

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

export default function AdminPlansPage() {
  const [rows, setRows] = useState<PlanRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, loading, fetchApi } = useApi({
    url: "/api/admin/plans",
    method: "GET",
    type: "manual",
    requiresAuth: true,
  });

  useEffect(() => {
    document.title = "Admin | Plans";
  }, []);

  useEffect(() => {
    void fetchApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setRows(data as PlanRow[]);
    }
  }, [data]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (plan: PlanRow) => {
    setEditingId(plan.id);
    setForm({
      title: plan.title,
      description: plan.description ?? "",
      amount: String(plan.amount),
      credits: String(plan.credits),
      status: plan.status,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      amount: Number.parseInt(form.amount, 10),
      credits: Number.parseInt(form.credits, 10),
      status: form.status,
    };

    try {
      const token = getToken();
      const url =
        editingId != null ? `/api/admin/plans/${editingId}` : "/api/admin/plans";
      const method = editingId != null ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        code?: number;
        message?: string;
        data?: Record<string, string>;
      };

      if (!res.ok) {
        const fieldMsg =
          json.data && typeof json.data === "object"
            ? Object.values(json.data).join(" ")
            : null;
        setFormError(fieldMsg || json.message || "Could not save plan.");
        return;
      }

      closeModal();
      void fetchApi();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: PlanRow) => {
    if (
      !window.confirm(
        `Delete plan "${plan.title}"? This will hide it from pricing and admin lists.`
      )
    ) {
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        window.alert(json.message || "Could not delete plan.");
        return;
      }

      void fetchApi();
    } catch {
      window.alert("Network error while deleting.");
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pricing plans
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage plans shown on the public pricing page and used at Square checkout.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            Add plan
          </Button>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Title
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Slug
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Credits
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={6}>
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length > 0 ? (
                rows.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                      <div className="font-medium">{plan.title}</div>
                      {plan.description ? (
                        <div className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                          {plan.description}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {plan.slug}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {formatMoney(plan.amount)}
                    </TableCell>
                    <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {plan.credits}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={plan.status ? "success" : "warning"}>
                        {plan.status ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(plan)}
                          className="text-theme-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(plan)}
                          className="text-theme-xs font-medium text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500" colSpan={6}>
                    No plans found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} className="max-w-lg p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {editingId != null ? "Edit plan" : "Add plan"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The slug is generated automatically from the title when you create a plan.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
          {formError ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
              {formError}
            </p>
          ) : null}

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (USD)
              <input
                required
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Credits
              <input
                required
                type="number"
                min={0}
                value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Active (visible on pricing page)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving} disabled={saving}>
              {editingId != null ? "Save changes" : "Create plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
