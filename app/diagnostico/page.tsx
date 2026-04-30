import DiagnosticoLiceu from "@/components/diagnostico/DiagnosticoLiceu";

export const metadata = {
  title: "Diagnóstico Retórico — Liceu Underground",
  description: "Descubra seu arquétipo retórico.",
};

export const dynamic = 'force-dynamic';

export default function DiagnosticoPage() {
  return <DiagnosticoLiceu />;
}