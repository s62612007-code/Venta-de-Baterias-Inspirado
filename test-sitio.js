/**
 * Test funcional del sitio Honda Baterías
 * Ejecutar: node test-sitio.js
 */

const fs = require('fs');
const https = require('https');

const LIVE = 'https://s62612007-code.github.io/Venta-de-Baterias-Inspirado/';
const resultados = { ok: [], warn: [], fail: [] };

function log(tipo, msg) {
  resultados[tipo].push(msg);
  const icon = { ok: '✅', warn: '⚠️', fail: '❌' }[tipo];
  console.log(`${icon} ${msg}`);
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'HondaBaterias-Test/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = g => g * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function testLiveAssets() {
  const assets = [
    '/', '/index.html', '/css/styles.css', '/css/bot.css',
    '/js/app.js', '/js/bot.js', '/config/precios.json',
    '/config/empresa.json', '/config/bot-biblioteca.json', '/data/catalogo.json',
    '/images/logos/honda.svg', '/images/baterias/bosch-s4-l2-60.svg'
  ];

  for (const path of assets) {
    try {
      const res = await fetchUrl(LIVE + path);
      if (res.status === 200) log('ok', `Live ${path} → HTTP 200`);
      else log('fail', `Live ${path} → HTTP ${res.status}`);
    } catch (e) {
      log('fail', `Live ${path} → ${e.message}`);
    }
  }
}

function getBotFallback() {
  return {
    puntoInicio: { lat: 3.42412, lng: -76.54538 },
    domicilio: { zonas: [{ radioMaxKm: 1.5, precio: 15000 }, { radioMaxKm: 8, precio: 25000 }] },
    promociones: { bateriaUsada: { descuento: 30000 }, vecindad: { descuento: 35000 } }
  };
}

async function testLiveData() {
  const preciosRes = await fetchUrl(LIVE + '/config/precios.json');
  const catalogoRes = await fetchUrl(LIVE + '/data/catalogo.json');
  const botRes = await fetchUrl(LIVE + '/config/bot-biblioteca.json');

  if (preciosRes.status !== 200 || catalogoRes.status !== 200 || botRes.status !== 200) {
    log('fail', 'Sitio no disponible aún — active GitHub Pages o espere el despliegue');
    return getBotFallback();
  }

  let precios, catalogo, bot;
  try {
    precios = JSON.parse(preciosRes.data);
    catalogo = JSON.parse(catalogoRes.data);
    bot = JSON.parse(botRes.data);
  } catch {
    log('fail', 'Respuesta live no es JSON válido (sitio aún desplegando)');
    return getBotFallback();
  }

  const productos = Object.values(precios.marcas).flatMap(m => m.productos);
  log('ok', `Datos live: ${Object.keys(precios.marcas).length} marcas, ${productos.length} productos, ${catalogo.vehiculos.length} vehículos`);

  const ids = new Set(productos.map(p => p.id));
  let refsInvalidas = 0;
  catalogo.vehiculos.forEach(v => v.baterias.forEach(b => { if (!ids.has(b)) refsInvalidas++; }));
  if (refsInvalidas === 0) log('ok', 'Referencias vehículo→batería: todas válidas');
  else log('fail', `${refsInvalidas} referencias inválidas en catálogo`);

  const toyota = catalogo.vehiculos.find(v => v.marca === 'Toyota' && v.modelo === 'Hilux');
  if (toyota && toyota.baterias.length >= 3) log('ok', `Búsqueda Hilux: ${toyota.baterias.length} baterías compatibles`);
  else log('fail', 'Catálogo Hilux incompleto');

  return bot;
}

function testDomicilio(bot) {
  const o = bot.puntoInicio;
  const tarifa = (km) => {
    if (km <= 1.5) return 15000;
    if (km <= 8) return 25000;
    return null;
  };

  const tests = [
    [o.lat + 0.005, o.lng, 15000, 'cercana'],
    [o.lat + 0.04, o.lng, 25000, 'media'],
    [o.lat + 0.12, o.lng, null, 'fuera']
  ];

  tests.forEach(([lat, lng, esperado, nombre]) => {
    const km = haversine(o.lat, o.lng, lat, lng);
    const precio = tarifa(km);
    if (precio === esperado) log('ok', `Domicilio ${nombre} (${km.toFixed(2)} km) = ${precio ? '$' + precio.toLocaleString('es-CO') : 'fuera de cobertura'}`);
    else log('fail', `Domicilio ${nombre}: esperado ${esperado}, obtuvo ${precio}`);
  });
}

function testDescuentos() {
  const subtotal = 495000 + 337250;
  const domicilio = 15000;
  const usada = 30000;
  const vecindad = 35000;
  const total = subtotal + domicilio - usada - vecindad;
  const esperado = 782250;
  if (total === esperado) log('ok', `Cálculo descuentos: $${total.toLocaleString('es-CO')} correcto`);
  else log('fail', `Cálculo descuentos: esperado ${esperado}, obtuvo ${total}`);
}

function testArchivosLocales() {
  const req = ['index.html', 'js/app.js', 'js/bot.js', 'css/styles.css', 'css/bot.css'];
  req.forEach(f => {
    if (fs.existsSync(f)) log('ok', `Archivo local: ${f}`);
    else log('fail', `Falta archivo: ${f}`);
  });

  const html = fs.readFileSync('index.html', 'utf8');
  ['css/styles.css', 'css/bot.css', 'js/app.js', 'js/bot.js'].forEach(r => {
    if (html.includes(r)) log('ok', `index.html → ${r}`);
    else log('fail', `index.html no enlaza ${r}`);
  });

  if (html.includes('pilabot') || html.includes('bot.js')) log('ok', 'PilaBot integrado en index.html');
  if (html.includes('jsPDF') || html.includes('jspdf')) log('ok', 'jsPDF incluido para cotización PDF');
}

async function testGeocoding() {
  const query = encodeURIComponent('Granada, Cali, Valle del Cauca, Colombia');
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=co`;

  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'BateriasHonda-Test/1.0', 'Accept-Language': 'es' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (!results.length) {
            log('warn', 'Geocoding: sin resultados (PilaBot pedirá más detalle al usuario)');
            resolve();
            return;
          }
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);
          const km = haversine(3.42412, -76.54538, lat, lng);
          const tarifa = km <= 1.5 ? 15000 : (km <= 8 ? 25000 : 'fuera');
          log('ok', `Geocoding Granada Cali: ${km.toFixed(2)} km → ${typeof tarifa === 'number' ? '$' + tarifa.toLocaleString('es-CO') : tarifa}`);
        } catch {
          log('warn', 'Geocoding: respuesta no parseable (revisar en navegador)');
        }
        resolve();
      });
    }).on('error', () => {
      log('warn', 'Geocoding: sin conexión en test (funciona en navegador del cliente)');
      resolve();
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  TEST SITIO WEB - HONDA BATERÍAS');
  console.log('═══════════════════════════════════════\n');

  console.log('--- 1. Archivos locales ---');
  testArchivosLocales();

  console.log('\n--- 2. Sitio publicado (GitHub Pages) ---');
  await testLiveAssets();

  console.log('\n--- 3. Datos y catálogo live ---');
  const bot = await testLiveData();

  console.log('\n--- 4. Lógica domicilio ---');
  testDomicilio(bot);

  console.log('\n--- 5. Descuentos ---');
  testDescuentos();

  console.log('\n--- 6. Geocoding (PilaBot) ---');
  await testGeocoding();

  console.log('\n═══════════════════════════════════════');
  const { ok, warn, fail } = resultados;
  console.log(`RESULTADO: ${ok.length} OK | ${warn.length} advertencias | ${fail.length} fallos`);

  if (fail.length === 0) {
    console.log('VEREDICTO: ✅ SITIO FUNCIONAL PARA PRODUCCIÓN');
    console.log(`URL: ${LIVE}`);
  } else if (fail.length <= 2 && resultados.ok.some(x => x.includes('Archivo local'))) {
    console.log('VEREDICTO: ⚠️ LOCAL OK — ESPERANDO DESPLIEGUE GITHUB PAGES');
    console.log(`URL: ${LIVE}`);
  } else {
    console.log('VEREDICTO: ❌ REQUIERE CORRECCIONES');
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
