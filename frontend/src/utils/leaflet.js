// O plugin leaflet.heat espera encontrar o Leaflet na variável global `L`.
// Este módulo precisa ser importado ANTES de 'leaflet.heat'.
import L from 'leaflet';

window.L = L;

export default L;
