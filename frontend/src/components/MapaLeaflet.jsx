import React, { useEffect, useRef } from 'react';
import L from '../utils/leaflet';
import 'leaflet.heat';
import { classificar } from '../utils/vulnerabilidade';
import { formatarNumero } from '../utils/formato';

/** Cria um elemento com texto puro (nunca HTML): nomes vindos do banco não são interpretados. */
function el(tag, texto, estilo) {
  const no = document.createElement(tag);
  if (texto !== undefined) no.textContent = texto;
  if (estilo) no.style.cssText = estilo;
  return no;
}

function linhaPopup(rotulo, valor, corValor) {
  const linha = el('div');
  linha.appendChild(el('strong', `${rotulo}: `));
  linha.appendChild(el('span', valor, corValor ? `color:${corValor};font-weight:bold;` : ''));
  return linha;
}

function conteudoPopup(item, cor, lat, lng) {
  const raiz = el('div', undefined, 'min-width:200px;padding:2px;');

  const topo = el('div', undefined, 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;');
  topo.appendChild(el('strong', `${item.nome} (${item.uf})`, 'font-size:14px;color:#0f172a;'));
  topo.appendChild(el('span', `#${item.posicao ?? '-'}`, `font-size:11px;padding:2px 6px;border-radius:9999px;background:${cor}20;color:${cor};font-weight:bold;`));
  raiz.appendChild(topo);

  const corpo = el('div', undefined, 'font-size:12px;color:#475569;line-height:1.5;');
  corpo.appendChild(linhaPopup('Coeficiente Ci', formatarNumero(item.ci, 4), cor));
  corpo.appendChild(linhaPopup('Classificação', item.nivelVulnerabilidade || classificar(item.ci).nivel));
  corpo.appendChild(linhaPopup('População', item.populacao ? `${formatarNumero(item.populacao)} hab` : '-'));
  corpo.appendChild(linhaPopup('IDH', formatarNumero(item.idh, 3)));
  corpo.appendChild(linhaPopup('Coord', `${lat.toFixed(4)}, ${lng.toFixed(4)}`));
  raiz.appendChild(corpo);

  return raiz;
}

/**
 * Mapa georreferenciado (RF07).
 * - camada 'marcadores': pontos coloridos pela faixa de vulnerabilidade, com popup;
 * - camada 'calor': mapa de calor cuja intensidade vem de `intensidade(item)` (0 a 1),
 *   por exemplo a vulnerabilidade (1 - Ci) ou o valor relativo de um indicador.
 */
export default function MapaLeaflet({ ranking = [], altura = '450px', camada = 'marcadores', intensidade, legendaCalor }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Cria o mapa uma única vez e o destrói ao desmontar o componente
  useEffect(() => {
    const map = L.map(mapContainerRef.current, {
      center: [-12.5, -41.5], // Bahia
      zoom: 6,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const pontos = [];
    const pontosCalor = [];

    ranking.forEach((item) => {
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      pontos.push([lat, lng]);
      const cor = item.corVulnerabilidade || classificar(item.ci).cor;

      if (camada === 'calor') {
        const peso = intensidade ? intensidade(item) : 1 - item.ci;
        if (Number.isFinite(peso)) pontosCalor.push([lat, lng, Math.min(Math.max(peso, 0), 1)]);
      }

      const marcador = L.circleMarker([lat, lng], camada === 'calor'
        ? { radius: 4, fillColor: '#0f172a', color: '#ffffff', weight: 1, opacity: 1, fillOpacity: 0.8 }
        : { radius: 9, fillColor: cor, color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.85 });
      marcador.bindPopup(() => conteudoPopup(item, cor, lat, lng));
      marcador.addTo(layerGroup);
    });

    if (camada === 'calor' && pontosCalor.length > 0) {
      L.heatLayer(pontosCalor, {
        radius: 45,
        blur: 30,
        max: 1,
        minOpacity: 0.35,
        gradient: { 0.2: '#22c55e', 0.5: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' }
      }).addTo(layerGroup);
    }

    if (pontos.length > 0) {
      map.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 10 });
    }
  }, [ranking, camada, intensidade]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div
        ref={mapContainerRef}
        data-testid="mapa"
        role="application"
        aria-label="Mapa dos municípios avaliados"
        style={{ height: altura, width: '100%', zIndex: 1 }}
      />
      {/* Legenda Flutuante */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 pointer-events-auto max-w-[220px]">
        {camada === 'calor' ? (
          <>
            <div className="font-semibold text-slate-800 mb-1">Mapa de calor</div>
            <div className="text-slate-600">{legendaCalor || 'Vulnerabilidade (1 − Ci)'}</div>
            <div className="h-2 rounded-full" style={{ background: 'linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)' }}></div>
            <div className="flex justify-between text-[10px] text-slate-500"><span>menor</span><span>maior</span></div>
          </>
        ) : (
          <>
            <div className="font-semibold text-slate-800 mb-1">Índice TOPSIS (Ci)</div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Baixa Vuln. (Ci ≥ 0.70)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-600">Média Vuln. (0.40 ≤ Ci &lt; 0.70)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-600">Alta Vuln. (Ci &lt; 0.40)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
