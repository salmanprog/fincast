"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileDown, Loader2 } from "lucide-react";
import ForecastDetailReport from "@/components/forecasts/ForecastDetailReport";
import { downloadForecastPdf } from "@/lib/downloadForecastPdf";
import { useForecastDetail } from "@/hooks/useForecastDetail";
import Button from "@/components/ui/button/Button";

function safeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80) || "forecast";
}

export default function ForecastPdfPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const { detail, error, loading } = useForecastDetail(id);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [autoDownload, setAutoDownload] = useState(false);

  useEffect(() => {
    document.title = "Admin | Forecast PDF";
    setAutoDownload(new URLSearchParams(window.location.search).get("download") === "1");
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!detail) return;
    setPdfError(null);
    setDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      await downloadForecastPdf(
        "forecast-pdf-report",
        `${safeFilename(detail.name)}-${detail.id.slice(0, 8)}.pdf`
      );
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "Could not generate PDF.");
    } finally {
      setDownloading(false);
    }
  }, [detail]);

  useEffect(() => {
    if (!autoDownload || loading || !detail) return;
    const t = window.setTimeout(() => {
      void handleDownloadPdf();
    }, 1200);
    return () => window.clearTimeout(t);
  }, [autoDownload, loading, detail, handleDownloadPdf]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Forecast PDF</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <Link
              href={`/admin/forecasts/${id}`}
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              ← Back to view
            </Link>
            {" · "}
            <Link
              href="/admin/forecasts"
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              All forecasts
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            size="sm"
            loading={downloading}
            disabled={downloading || loading || !detail}
            startIcon={<FileDown className="h-4 w-4 shrink-0" aria-hidden />}
            onClick={() => void handleDownloadPdf()}
          >
            Download PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || !detail}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </div>

      {pdfError ? (
        <p className="no-print text-sm text-red-600 dark:text-red-400">{pdfError}</p>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading forecast…
        </p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : detail ? (
        <div
          id="forecast-pdf-report"
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm print:border-0 print:p-0 print:shadow-none sm:p-6"
        >
          <ForecastDetailReport detail={detail} exportMode />
        </div>
      ) : null}

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
