import Stripe from "stripe";

// Load env from .env.local (run with `node --env-file=.env.local` or `tsx --env-file=.env.local`)

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  const catalog = [
    {
      kind: "ebook",
      name: "Ebook — As Armas da Palavra",
      unit_amount: 14900, // R$149
    },
    {
      kind: "video",
      name: "Aulas em vídeo — Formação Retórica Clássica",
      unit_amount: 129700, // R$1297
    },
    {
      kind: "mentoring",
      name: "Programa de Mentoria — Liceu Underground",
      unit_amount: 499900, // R$4999
    },
  ] as const;

  for (const item of catalog) {
    const product = await stripe.products.create({
      name: item.name,
      description: "Pagamento único. Disciplina, método e correção.",
      metadata: { kind: item.kind },
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: "brl",
      unit_amount: item.unit_amount,
    });

    console.log(`kind=${item.kind}`);
    console.log(`  product=${product.id}`);
    console.log(`  price=${price.id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

