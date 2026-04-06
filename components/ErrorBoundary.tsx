"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[200px] flex items-center justify-center border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-6 py-8">
          <div className="text-center">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-critical)]">
              Component Error
            </div>
            <p className="mt-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
              Something went wrong rendering this section.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-4 text-left font-[var(--font-roboto-mono)] text-[10px] text-[var(--liceu-muted)] overflow-auto max-w-lg">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
