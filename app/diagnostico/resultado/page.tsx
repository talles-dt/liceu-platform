import { Suspense } from "react";
import DiagnosticoResultadoClient from "./DiagnosticoResultadoClient";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)] animate-pulse">
          Carregando resultado...
        </div>
      </div>
    </div>
  );
}

export default function DiagnosticoResultadoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiagnosticoResultadoClient />
    </Suspense>
  );
}
