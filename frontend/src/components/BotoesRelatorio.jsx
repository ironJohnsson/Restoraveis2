import React, { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { api } from '../services/api';
import { baixarBlob } from '../utils/download';

/**
 * Botões de exportação CSV/PDF de uma simulação salva (RF06).
 * O download é autenticado: o arquivo é buscado com o token e entregue como Blob.
 */
export default function BotoesRelatorio({ simulacaoId, compacto = false }) {
  const [baixando, setBaixando] = useState(null);
  const [erro, setErro] = useState(null);

  if (simulacaoId === null || simulacaoId === undefined) return null;

  const baixar = async (formato) => {
    setErro(null);
    setBaixando(formato);
    try {
      const blob = await api.baixarRelatorio(simulacaoId, formato);
      baixarBlob(blob, `relatorio_topsis_simulacao_${simulacaoId}.${formato}`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setBaixando(null);
    }
  };

  const classeBase = compacto
    ? 'p-2 rounded-lg transition-colors disabled:opacity-50'
    : 'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50';

  return (
    <div className="flex items-center space-x-2">
      {erro && <span role="alert" className="text-[11px] text-rose-700 font-semibold">{erro}</span>}
      <button
        type="button"
        data-testid={`exportar-csv-${simulacaoId}`}
        onClick={() => baixar('csv')}
        disabled={baixando !== null}
        title="Exportar planilha CSV"
        aria-label="Exportar planilha CSV"
        className={`${classeBase} bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200`}
      >
        <FileSpreadsheet className={`${compacto ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-600`} />
        {!compacto && <span>{baixando === 'csv' ? 'Gerando...' : 'CSV'}</span>}
      </button>
      <button
        type="button"
        data-testid={`exportar-pdf-${simulacaoId}`}
        onClick={() => baixar('pdf')}
        disabled={baixando !== null}
        title="Exportar relatório em PDF"
        aria-label="Exportar relatório em PDF"
        className={`${classeBase} bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200`}
      >
        <FileText className={`${compacto ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
        {!compacto && <span>{baixando === 'pdf' ? 'Gerando...' : 'PDF'}</span>}
      </button>
    </div>
  );
}
