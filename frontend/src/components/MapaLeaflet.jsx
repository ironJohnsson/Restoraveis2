import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapaLeaflet({ ranking = [], altura = '450px' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centro padrão: Bahia (-12.5, -41.5)
      const map = L.map(mapContainerRef.current, {
        center: [-12.5, -41.5],
        zoom: 6,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const pontos = [];

    ranking.forEach((item) => {
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      pontos.push([lat, lng]);

      let cor = item.corVulnerabilidade || '#22c55e';
      if (!item.corVulnerabilidade) {
        if (item.ci >= 0.70) cor = '#22c55e';
        else if (item.ci >= 0.40) cor = '#eab308';
        else cor = '#ef4444';
      }

      const circle = L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: cor,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 14px; color: #0f172a;">${item.nome} (${item.uf})</strong>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 9999px; background: ${cor}20; color: ${cor}; font-weight: bold;">
              #${item.posicao || '-'}
            </span>
          </div>
          <div style="font-size: 12px; color: #475569; line-height: 1.5;">
            <div><strong>Coeficiente Ci:</strong> <span style="color: ${cor}; font-weight: bold;">${item.ci ? item.ci.toFixed(4) : '-'}</span></div>
            <div><strong>Classificação:</strong> ${item.nivelVulnerabilidade || '-'}</div>
            <div><strong>População:</strong> ${item.populacao ? item.populacao.toLocaleString('pt-BR') : '-'} hab</div>
            <div><strong>IDH:</strong> ${item.idh ? item.idh.toFixed(3) : '-'}</div>
            <div><strong>Coord:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.addTo(layerGroup);
    });

    if (pontos.length > 0) {
      try {
        const bounds = L.latLngBounds(pontos);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      } catch (e) {
        // Fallback para centro padrão
      }
    }

    return () => {
      // Mantém instância ativa
    };
  }, [ranking]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      <div 
        ref={mapContainerRef} 
        style={{ height: altura, width: '100%', zIndex: 1 }}
      />
      {/* Legenda Flutuante */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 pointer-events-auto">
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
      </div>
    </div>
  );
}
