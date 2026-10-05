import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

/** Faixa de retorno de uma operação. `mensagem`: { tipo: 'sucesso' | 'erro', texto }. */
export default function Mensagem({ mensagem }) {
  if (!mensagem) return null;
  const sucesso = mensagem.tipo === 'sucesso';

  return (
    <div
      role={sucesso ? 'status' : 'alert'}
      data-testid={`mensagem-${mensagem.tipo}`}
      className={`p-4 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
        sucesso
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-rose-50 text-rose-800 border-rose-200'
      }`}
    >
      {sucesso ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      <span>{mensagem.texto}</span>
    </div>
  );
}
