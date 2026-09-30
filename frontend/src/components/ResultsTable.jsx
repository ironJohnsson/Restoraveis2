import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { api } from '../services/api';

export default function ResultsTable({ ranking = [], simulacaoId, tempoExecucaoMs }) {
  const [busca, setBusca] = useState('');

  if (!ranking || ranking.length === 0) return null;

  const filtrados = ranking.filter(r => 
    r.nome.toLowerCase().includes(busca.toLowerCase()) || 
    r.uf.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra Superior com Métricas e Exportações */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-lg font-serif">
              Classificação Oficial do Ranking TOPSIS
            </h3>
            {tempoExecucaoMs && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                ⏱ {tempoExecucaoMs}ms
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Alternativas ordenadas pelo coeficiente de proximidade relativa (Ci) decrescente.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Busca Rápida */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar município..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>

          {/* Botões de Download */}
          {simulacaoId && (
            <div className="flex items-center space-x-2">
              <a
                href={api.getRelatorioCSVUrl(simulacaoId)}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                title="Exportar planilha CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </a>
              <a
                href={api.getRelatorioPDFUrl(simulacaoId)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
                title="Exportar relatório em PDF"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>PDF</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
              <th className="py-3 px-4 w-14 text-center">Pos</th>
              <th className="py-3 px-4">Município / UF</th>
              <th className="py-3 px-4">População</th>
              <th className="py-3 px-4">IDH</th>
              <th className="py-3 px-4">Distância D+</th>
              <th className="py-3 px-4">Distância D-</th>
              <th className="py-3 px-4 text-center">Índice Ci</th>
              <th className="py-3 px-4">Diagnóstico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((item) => {
              let badgeEstilo = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (item.ci < 0.40) {
                badgeEstilo = 'bg-rose-50 text-rose-700 border-rose-200';
              } else if (item.ci < 0.70) {
                badgeEstilo = 'bg-amber-50 text-amber-700 border-amber-200';
              }

              return (
                <tr key={item.municipioId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <span className="w-6 h-6 rounded-md bg-slate-100 font-bold text-slate-800 inline-flex items-center justify-center text-xs">
                      #{item.posicao}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {item.nome}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Estado: {item.uf}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {item.populacao ? item.populacao.toLocaleString('pt-BR') : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {item.idh ? item.idh.toFixed(3) : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.distanciaPositiva?.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.distanciaNegativa?.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      {item.ci?.toFixed(4)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold text-[11px] border ${badgeEstilo}`}>
                      {item.nivelVulnerabilidade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
