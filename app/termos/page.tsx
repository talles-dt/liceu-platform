import { ReadingLayout } from "@/components/ReadingLayout";

export default function TermosPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / TERMOS"
      title="Termos de uso"
      subtitle="Placeholder. Substitua pelo texto jurídico final."
    >
      <div className="space-y-4 font-[var(--font-noto-serif)] text-[15px] leading-[1.95] text-[var(--liceu-text)]">
        <p>
          Este documento define regras de uso, responsabilidades e limites.
          Publique aqui o texto final de termos.
        </p>
      </div>
    </ReadingLayout>
  );
}

