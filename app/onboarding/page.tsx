"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OnboardingStatus = {
  hasAccount: boolean;
  hasPurchase: boolean;
  hasDiagnosis: boolean;
  firstModuleId: string | null;
  moduleName: string | null;
};

type UserState =
  | "loading"
  | "brand_new"
  | "has_purchase_no_progress"
  | "has_diagnosis_no_purchase";

export default function OnboardingPage() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [userState, setUserState] = useState<UserState>("loading");

  useEffect(() => {
    fetch("/api/onboarding/status")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((data: OnboardingStatus | null) => {
        if (!data) return;
        setStatus(data);

        if (!data.hasPurchase && !data.hasDiagnosis) {
          setUserState("brand_new");
        } else if (data.hasPurchase && !data.firstModuleId) {
          setUserState("has_purchase_no_progress");
        } else if (data.hasDiagnosis && !data.hasPurchase) {
          setUserState("has_diagnosis_no_purchase");
        } else {
          // Default fallback — send to dashboard
          window.location.href = "/dashboard";
        }
      })
      .catch(() => {
        // On error, fall back to dashboard
        window.location.href = "/dashboard";
      });
  }, []);

  if (userState === "loading") {
    return (
      <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)] animate-pulse">
            Initializing session...
          </div>
        </div>
      </div>
    );
  }

  if (userState === "brand_new") {
    return <BrandNewFlow />;
  }

  if (userState === "has_purchase_no_progress" && status) {
    return <HasPurchaseFlow status={status} />;
  }

  if (userState === "has_diagnosis_no_purchase") {
    return <HasDiagnosisFlow />;
  }

  // Fallback
  return null;
}

// --- Sub-components ---

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      {/* Header */}
      <header className="border-b border-[var(--liceu-stone)]/30 bg-[var(--liceu-surface)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="font-[var(--font-noto-serif)] text-lg font-black uppercase tracking-tight text-[var(--liceu-accent)]">
            Liceu Underground
          </div>
          <Link
            href="/dashboard"
            className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] transition-colors underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-accent)]"
          >
            Skip onboarding
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {children}
      </main>
    </div>
  );
}

function BrandNewFlow() {
  return (
    <OnboardingShell>
      {/* Eyebrow */}
      <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.3em] text-[var(--liceu-secondary)]">
        WELCOME TO LICEU
      </div>

      {/* Headline */}
      <h1 className="mt-4 font-[var(--font-noto-serif)] text-4xl md:text-5xl font-black uppercase leading-tight tracking-tight">
        Begin with the Sifting
      </h1>

      {/* Body */}
      <div className="mt-8 space-y-5 font-[var(--font-work-sans)] text-[15px] leading-relaxed text-[var(--liceu-muted)]">
        <p>
          Before any module, any lesson, any purchase — you start here.
          The diagnostic is free. It takes about 45 minutes. It maps where
          your structure fails under live pressure.
        </p>
        <p>
          We do not sell motivation. We sell correction. The diagnostic
          tells us which correction you need.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-12 border-t border-[var(--liceu-stone)]/30 pt-10">
        <Link
          href="/diagnostico"
          className="inline-block bg-[var(--liceu-primary)] px-10 py-5 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.2em] text-[var(--liceu-text)] transition-all hover:bg-[var(--liceu-accent)] hover:text-[var(--liceu-on-primary)]"
        >
          Start Free Diagnostic
        </Link>
        <p className="mt-4 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
          No payment required. This is your first step.
        </p>
      </div>

      {/* Journey steps */}
      <div className="mt-16 grid grid-cols-3 gap-6">
        {[
          {
            step: "01",
            title: "Diagnóstico",
            desc: "Map your structural failures under pressure.",
            done: false,
          },
          {
            step: "02",
            title: "Recommendation",
            desc: "Receive the program that fits your profile.",
            done: false,
          },
          {
            step: "03",
            title: "Training",
            desc: "Begin your course with strict progression.",
            done: false,
          },
        ].map((s) => (
          <div
            key={s.step}
            className={`border p-5 ${
              s.done
                ? "border-[var(--liceu-accent)]/30 bg-[var(--liceu-accent)]/5"
                : "border-[var(--liceu-stone)]/20 bg-[var(--liceu-surface-container-low)]"
            }`}
          >
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-accent)]">
              {s.step}
            </div>
            <div className="mt-2 font-[var(--font-noto-serif)] text-sm font-bold uppercase text-[var(--liceu-text)]">
              {s.title}
            </div>
            <div className="mt-1 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
              {s.desc}
            </div>
          </div>
        ))}
      </div>
    </OnboardingShell>
  );
}

function HasPurchaseFlow({ status }: { status: OnboardingStatus }) {
  return (
    <OnboardingShell>
      {/* Eyebrow */}
      <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.3em] text-[var(--liceu-accent)]">
        ACCESS GRANTED
      </div>

      {/* Headline */}
      <h1 className="mt-4 font-[var(--font-noto-serif)] text-4xl md:text-5xl font-black uppercase leading-tight tracking-tight">
        Welcome to Liceu
      </h1>

      {/* Body */}
      <div className="mt-8 space-y-5 font-[var(--font-work-sans)] text-[15px] leading-relaxed text-[var(--liceu-muted)]">
        <p>
          Your access is confirmed. Training begins at the first module.
          Progression is strict — each module requires a passing assessment
          and approved assignment before the next unlocks.
        </p>
        <p>
          There are no shortcuts. There is only structure.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-12 border-t border-[var(--liceu-stone)]/30 pt-10">
        <Link
          href={status.firstModuleId ? `/modules/${status.firstModuleId}` : "/dashboard"}
          className="inline-block bg-[var(--liceu-primary)] px-10 py-5 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.2em] text-[var(--liceu-text)] transition-all hover:bg-[var(--liceu-accent)] hover:text-[var(--liceu-on-primary)]"
        >
          {status.firstModuleId ? `Start: ${status.moduleName}` : "Go to Your Dashboard"}
        </Link>
        <p className="mt-4 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
          {status.firstModuleId ? "Your first module is ready." : "Your modules are waiting. Begin with Module 1."}
        </p>
      </div>

      {/* Quick-start card */}
      <div className="mt-12 border border-[var(--liceu-accent)]/30 bg-[var(--liceu-primary)]/10 p-8">
        <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-secondary)]">
          QUICK START
        </div>
        <div className="mt-4 space-y-3 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--liceu-accent)]" />
            <span>Study each module&apos;s text and lessons.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--liceu-accent)]" />
            <span>Complete the quiz (minimum 70% to pass).</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--liceu-accent)]" />
            <span>Submit your assignment for review.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--liceu-accent)]" />
            <span>Next module unlocks automatically.</span>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

function HasDiagnosisFlow() {
  return (
    <OnboardingShell>
      {/* Eyebrow */}
      <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.3em] text-[var(--liceu-secondary)]">
        YOUR DIAGNOSTIC IS COMPLETE
      </div>

      {/* Headline */}
      <h1 className="mt-4 font-[var(--font-noto-serif)] text-4xl md:text-5xl font-black uppercase leading-tight tracking-tight">
        Your Recommendation Awaits
      </h1>

      {/* Body */}
      <div className="mt-8 space-y-5 font-[var(--font-work-sans)] text-[15px] leading-relaxed text-[var(--liceu-muted)]">
        <p>
          You completed the diagnostic. Based on your profile, we identified
          the program that matches your structural needs.
        </p>
        <p>
          View your full recommendation below and begin training when
          you&apos;re ready.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-12 border-t border-[var(--liceu-stone)]/30 pt-10 flex flex-wrap gap-4">
        <Link
          href="/diagnostico/resultado"
          className="inline-block bg-[var(--liceu-primary)] px-10 py-5 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.2em] text-[var(--liceu-text)] transition-all hover:bg-[var(--liceu-accent)] hover:text-[var(--liceu-on-primary)]"
        >
          View Recommendation
        </Link>
        <Link
          href="/dashboard"
          className="inline-block border border-[var(--liceu-stone)] px-10 py-5 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.2em] text-[var(--liceu-muted)] transition-all hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)]/60"
        >
          Back to Dashboard
        </Link>
      </div>
    </OnboardingShell>
  );
}
