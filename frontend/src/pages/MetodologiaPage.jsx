import React from 'react';
import { BookOpen } from 'lucide-react';

export default function MetodologiaPage({ criterios = [] }) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Fundamentação Científica & Normativa</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
          Método TOPSIS e Qualidade de Software (ISO/IEC)
        </h1>
        <p className="mt-2 text-slate-600 text-sm leading-relaxed">
          Roteiro e arquitetura concebidos pelo <strong>Prof. Me. Celso Barreto</strong> com fundamentação nas normas 
          internacionais <strong>ISO/IEC 12207</strong> (Processos de Ciclo de Vida do Software), <strong>ISO/IEC 15504</strong> (SPICE) 
          e <strong>ISO/IEC 25010</strong> (Sistemas e Qualidade de Software), alinhado ao <strong>ODS 7 da ONU</strong> (Energia Limpa e Acessível).
        </p>
      </div>

      {/* Seção 1: O Método TOPSIS Passo a Passo */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 font-serif border-b border-slate-100 pb-3">
          1. O Algoritmo Matemático TOPSIS
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          O <strong>TOPSIS</strong> (<em>Technique for Order Preference by Similarity to Ideal Solution</em>), desenvolvido por Hwang e Yoon (1981), 
          baseia-se no princípio de que a alternativa selecionada deve ter a <strong>menor distância da Solução Ideal Positiva (A+)</strong> e a 
          <strong>maior distância da Solução Ideal Negativa (A-)</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Passo 1 — Normalização Vetorial</span>
            <code className="text-xs font-mono block bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800">
              r_ij = x_ij / √(∑ x_kj²)
            </code>
            <p className="text-xs text-slate-500">
              Transforma os critérios com diferentes unidades de medida (R$, %, kW/hab) em uma escala adimensional homogênea.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Passo 2 — Matriz Ponderada</span>
            <code className="text-xs font-mono block bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800">
              v_ij = w_j × r_ij  (onde ∑ w_j = 1.0)
            </code>
            <p className="text-xs text-slate-500">
              Multiplica a matriz normalizada pelos pesos de importância relativa definidos pelos especialistas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Passo 3 e 4 — Soluções Ideais</span>
            <div className="text-xs font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 space-y-1">
              <div>A+ = max(v_ij) [benefício] ou min(v_ij) [custo]</div>
              <div>A- = min(v_ij) [benefício] ou max(v_ij) [custo]</div>
            </div>
            <p className="text-xs text-slate-500">
              Identifica os cenários hipotéticos de melhor desempenho global (A+) e pior desempenho global (A-).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Passo 5 e 6 — Distâncias e Coeficiente Ci</span>
            <code className="text-xs font-mono block bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800">
              Ci = D- / (D+ + D-)  ∈ [0, 1]
            </code>
            <p className="text-xs text-slate-500">
              D+ e D- são distâncias euclidianas. Quanto mais próximo Ci for de 1, menor a vulnerabilidade do município.
            </p>
          </div>

        </div>
      </div>

      {/* Seção 2: Indicadores Cadastrados */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-serif border-b border-slate-100 pb-3">
          2. Indicadores de Vulnerabilidade Social Energética
        </h2>
        <p className="text-xs text-slate-500">
          Critérios e pesos padrão atualmente cadastrados na plataforma (editáveis na aba "Critérios").
          Critérios com peso 0 ficam disponíveis no simulador, mas não influenciam o cálculo padrão.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Cód</th>
                <th className="py-2.5 px-3">Nome do Indicador</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Unidade</th>
                <th className="py-2.5 px-3">Fonte Oficial</th>
                <th className="py-2.5 px-3">Peso Padrão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criterios.map(c => (
                <tr key={c.codigo}>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{c.codigo}</td>
                  <td className="py-2.5 px-3">
                    {c.nome}
                    {c.descricao && <span className="block text-[11px] text-slate-400">{c.descricao}</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    {c.tipo === 'custo'
                      ? <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">Custo</span>
                      : <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Benefício</span>}
                  </td>
                  <td className="py-2.5 px-3">{c.unidade || '-'}</td>
                  <td className="py-2.5 px-3">{c.fonte || '-'}</td>
                  <td className="py-2.5 px-3 font-mono">
                    {Number(c.peso).toFixed(2)} ({Math.round(Number(c.peso) * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção 3: Conformidade com Normas ISO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-serif border-b border-slate-100 pb-3">
          3. Modelo de Qualidade de Software ISO/IEC 25010
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <strong className="block text-slate-900 mb-1">Eficiência de Desempenho</strong>
            <p className="text-slate-600">Tempo de resposta do cálculo TOPSIS inferior a 3 segundos para 500 alternativas (RNF01), verificado por teste automatizado.</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <strong className="block text-slate-900 mb-1">Segurança da Informação</strong>
            <p className="text-slate-600">Autenticação via JSON Web Token (JWT), senhas com hash bcrypt e controle de acesso por perfil em todas as rotas (RNF04).</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <strong className="block text-slate-900 mb-1">Manutenibilidade & Testes</strong>
            <p className="text-slate-600">Cobertura de testes automatizados superior a 80%, exigida na integração contínua, e arquitetura em camadas (RNF05).</p>
          </div>
        </div>
      </div>

    </div>
  );
}
