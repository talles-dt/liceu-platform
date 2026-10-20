'use client';
export default function AdminError({reset}:{reset:()=>void}){return <div className="p-6 space-y-4" role="alert"><h2>Não foi possível carregar os dados administrativos.</h2><p>Os indicadores não estão disponíveis neste momento. Nenhuma contagem foi substituída por zero.</p><button className="border p-2" onClick={reset}>Tentar novamente</button></div>}
