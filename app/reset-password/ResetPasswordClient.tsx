"use client";

import { Suspense } from "react";
import { ReadingLayout } from "@/components/ReadingLayout";
import ResetPasswordLogic from './ResetPasswordLogic';

export default function ResetPasswordClient() {
  return (
    <Suspense fallback={(
      <ReadingLayout eyebrow="LICEU UNDERGROUND / RECUPERAÇÃO" title="Carregando...">
        <div className="border border-stone-200 bg-surface px-5 py-5">
          <p className="text-sm text-muted">Carregando interface...</p>
        </div>
      </ReadingLayout>
    )}>
      <ResetPasswordLogic />
    </Suspense>
  );
}