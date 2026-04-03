import { ReadingLayout } from "@/components/ReadingLayout";

export default function PrivacidadePage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / PRIVACIDADE"
      title="Política de privacidade"
      subtitle="Placeholder. Substitua pelo texto jurídico final."
    >
      <div className="space-y-4 font-[var(--font-noto-serif)] text-[15px] leading-[1.95] text-[var(--liceu-text)]">
        <p>
          Este documento define coleta, uso e retenção de dados. Publique aqui o
          texto final de privacidade.
        </p>
      </div>
    </ReadingLayout>
  );
}

