import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";

export default function ContatoPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / CONTATO"
      title="Contato"
      subtitle="Canal único. Respostas sóbrias."
    >
      <div className="space-y-4 font-[var(--font-noto-serif)] text-[15px] leading-[1.95] text-[var(--liceu-text)]">
        <p>
          Envie um email para{" "}
          <Link
            href="mailto:contato@liceu.example"
            className="underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-secondary)]"
          >
            contato@liceu.example
          </Link>
          .
        </p>
      </div>
    </ReadingLayout>
  );
}

