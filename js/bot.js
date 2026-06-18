/**
 * PilaBot - Asistente virtual inclusivo
 * Baterías Honda · Distribuidor Coéxito Cali
 *
 * Biblioteca interna: config/bot-biblioteca.json
 * Ecuación domicilio: haversine(puntoInicio, cliente) → zona → precio
 */

const PilaBot = {
  biblioteca: null,
  abierto: false,

  estado: {
    paso: 'inicio',
    domicilio: null,
    distanciaKm: null,
    ubicacionCliente: null,
    direccionTexto: null,
    bateriaUsada: null,
    googleMapsUrl: null
  },

  elementos: {},

  async init() {
    try {
      const res = await fetch('config/bot-biblioteca.json');
      this.biblioteca = await res.json();
    } catch {
      this.biblioteca = this.getBibliotecaFallback();
    }

    this.crearInterfaz();
    this.vincularEventos();

    if (typeof App !== 'undefined') {
      App.descuentosBot = App.descuentosBot || {
        domicilio: 0,
        bateriaUsada: false,
        rebajaUsada: 0,
        rebajaVecindad: 0
      };
    }
  },

  getBibliotecaFallback() {
    return {
      puntoInicio: { direccion: 'Carrera 54A #7-05', ciudad: 'Cali', lat: 3.42412, lng: -76.54538 },
      domicilio: { zonas: [{ radioMaxKm: 1.5, precio: 15000 }, { radioMaxKm: 8, precio: 25000 }] },
      promociones: {
        bateriaUsada: { descuento: 30000 },
        vecindad: { nombre: 'Promoción Vecindad', descuento: 35000 }
      },
      frases: { pidiendoDireccion: '¿Pa\' dónde le mandamos la pila?' }
    };
  },

  crearInterfaz() {
    const html = `
      <button class="pilabot-launcher" id="pilabotLauncher"
              aria-label="Abrir asistente PilaBot" aria-expanded="false" aria-controls="pilabotWindow">
        <i class="bi bi-chat-dots-fill" aria-hidden="true"></i>
        <span class="pilabot-badge" aria-hidden="true">Ayuda</span>
      </button>

      <div class="pilabot-window" id="pilabotWindow" role="dialog"
           aria-label="${this.biblioteca.accesibilidad?.ariaLabel || 'Asistente PilaBot'}"
           aria-hidden="true">
        <div class="pilabot-header">
          <div class="pilabot-header__avatar" aria-hidden="true">🔋</div>
          <div class="pilabot-header__info">
            <h2>PilaBot</h2>
            <p>Baterías Honda · Cali</p>
          </div>
          <button class="pilabot-header__close" id="pilabotCerrar" aria-label="Cerrar chat">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div class="pilabot-messages" id="pilabotMessages" role="log" aria-live="polite" aria-relevant="additions"></div>

        <div class="pilabot-quick" id="pilabotQuick" role="group" aria-label="Respuestas rápidas"></div>

        <div class="pilabot-atajos" id="pilabotAtajos" role="toolbar" aria-label="Atajos de comandos"></div>

        <form class="pilabot-input-area" id="pilabotForm" role="search">
          <label for="pilabotInput" class="visually-hidden">Escriba su mensaje</label>
          <input type="text" class="pilabot-input" id="pilabotInput"
                 placeholder="Escriba aquí, parce..." autocomplete="off" maxlength="300">
          <button type="submit" class="pilabot-send" id="pilabotEnviar" aria-label="Enviar mensaje">
            <i class="bi bi-send-fill" aria-hidden="true"></i>
          </button>
        </form>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    this.elementos = {
      launcher: document.getElementById('pilabotLauncher'),
      window: document.getElementById('pilabotWindow'),
      messages: document.getElementById('pilabotMessages'),
      quick: document.getElementById('pilabotQuick'),
      atajos: document.getElementById('pilabotAtajos'),
      form: document.getElementById('pilabotForm'),
      input: document.getElementById('pilabotInput'),
      cerrar: document.getElementById('pilabotCerrar')
    };

    this.renderAtajos();
  },

  vincularEventos() {
    this.elementos.launcher.addEventListener('click', () => this.toggle());
    this.elementos.cerrar.addEventListener('click', () => this.cerrar());
    this.elementos.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const texto = this.elementos.input.value.trim();
      if (texto) {
        this.procesarEntrada(texto);
        this.elementos.input.value = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.abierto) this.cerrar();
    });
  },

  toggle() {
    this.abierto ? this.cerrar() : this.abrir();
  },

  abrir() {
    this.abierto = true;
    this.elementos.window.classList.add('pilabot-window--open');
    this.elementos.window.setAttribute('aria-hidden', 'false');
    this.elementos.launcher.setAttribute('aria-expanded', 'true');
    this.elementos.input.focus();

    if (this.elementos.messages.children.length === 0) {
      this.iniciarConversacion();
    }
  },

  cerrar() {
    this.abierto = false;
    this.elementos.window.classList.remove('pilabot-window--open');
    this.elementos.window.setAttribute('aria-hidden', 'true');
    this.elementos.launcher.setAttribute('aria-expanded', 'false');
    this.elementos.launcher.focus();
  },

  renderAtajos() {
    const atajos = this.biblioteca.atajos || {};
    this.elementos.atajos.innerHTML = Object.entries(atajos).map(([cmd, info]) =>
      `<button type="button" class="pilabot-atajo" data-cmd="${cmd}" title="${info.texto}">${cmd}</button>`
    ).join('');

    this.elementos.atajos.querySelectorAll('.pilabot-atajo').forEach(btn => {
      btn.addEventListener('click', () => {
        this.procesarEntrada(btn.dataset.cmd);
      });
    });
  },

  mostrarQuick(opciones) {
    this.elementos.quick.innerHTML = opciones.map(op =>
      `<button type="button" class="pilabot-quick__btn" data-valor="${op.valor}">${op.texto}</button>`
    ).join('');

    this.elementos.quick.querySelectorAll('.pilabot-quick__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.elementos.quick.innerHTML = '';
        this.procesarEntrada(btn.dataset.valor);
      });
    });
  },

  limpiarQuick() {
    this.elementos.quick.innerHTML = '';
  },

  async iniciarConversacion() {
    const saludos = this.biblioteca.saludos || ['¡Hola!'];
    for (const s of saludos) {
      await this.responder(s, 400);
    }
    await this.responder(this.biblioteca.frases.pidiendoDireccion, 600);
    this.estado.paso = 'esperando_direccion';
  },

  agregarMensaje(texto, tipo = 'bot') {
    const div = document.createElement('div');
    div.className = `pilabot-msg pilabot-msg--${tipo}`;
    div.innerHTML = texto;
    this.elementos.messages.appendChild(div);
    this.elementos.messages.scrollTop = this.elementos.messages.scrollHeight;
  },

  agregarMensajeUsuario(texto) {
    this.agregarMensaje(this.escapeHtml(texto), 'user');
  },

  escapeHtml(texto) {
    const d = document.createElement('div');
    d.textContent = texto;
    return d.innerHTML;
  },

  mostrarTyping() {
    const el = document.createElement('div');
    el.className = 'pilabot-typing';
    el.id = 'pilabotTyping';
    el.innerHTML = '<span></span><span></span><span></span>';
    this.elementos.messages.appendChild(el);
    this.elementos.messages.scrollTop = this.elementos.messages.scrollHeight;
  },

  quitarTyping() {
    document.getElementById('pilabotTyping')?.remove();
  },

  async responder(texto, delay = 300) {
    this.mostrarTyping();
    await this.esperar(delay);
    this.quitarTyping();
    this.agregarMensaje(texto, 'bot');
  },

  esperar(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  /* ── Ecuación de distancia (Haversine) ── */

  calcularDistanciaKm(lat1, lng1, lat2, lng2) {
    const R = this.biblioteca.ecuacion?.radioTierraKm || 6371;
    const toRad = (g) => g * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  calcularDomicilio(distanciaKm) {
    const zonas = [...this.biblioteca.domicilio.zonas].sort((a, b) => a.radioMaxKm - b.radioMaxKm);

    for (const zona of zonas) {
      if (distanciaKm <= zona.radioMaxKm) {
        return {
          cubierto: true,
          zona: zona.nombre,
          zonaId: zona.id,
          precio: zona.precio,
          distanciaKm: Math.round(distanciaKm * 100) / 100
        };
      }
    }

    return {
      cubierto: false,
      distanciaKm: Math.round(distanciaKm * 100) / 100,
      mensaje: this.biblioteca.domicilio.fueraDeCobertura?.mensaje
    };
  },

  async geocodificar(direccion) {
    const origen = this.biblioteca.puntoInicio;
    const query = `${direccion}, ${origen.ciudad}, ${origen.departamento || 'Valle del Cauca'}, Colombia`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=co`;

    const res = await fetch(url, {
      headers: { 'Accept-Language': 'es' }
    });

    if (!res.ok) throw new Error('Geocoding falló');

    const data = await res.json();
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
      googleMapsUrl: this.generarUrlGoogleMaps(direccion)
    };
  },

  generarUrlGoogleMaps(direccionDestino) {
    const origen = this.biblioteca.puntoInicio.googleMapsQuery ||
      encodeURIComponent(`${this.biblioteca.puntoInicio.direccion} ${this.biblioteca.puntoInicio.ciudad}`);
    const destino = encodeURIComponent(`${direccionDestino}, Cali, Colombia`);
    return `https://www.google.com/maps/dir/${origen}/${destino}`;
  },

  /* ── Descuentos y total ── */

  calcularDescuentos() {
    const cotizacion = (typeof App !== 'undefined' && App.cotizacion) ? App.cotizacion : [];
    const promo = this.biblioteca.promociones;

    let subtotalProductos = 0;
    let rebajaVecindad = 0;
    let rebajaUsada = 0;
    let totalUnidades = 0;

    cotizacion.forEach(item => {
      subtotalProductos += item.precio * item.cantidad;
      totalUnidades += item.cantidad;
    });

    if (this.estado.bateriaUsada === true && cotizacion.length > 0) {
      rebajaUsada = promo.bateriaUsada.descuento;
    }

    if (totalUnidades >= 2) {
      rebajaVecindad = promo.vecindad.descuento;
    }

    const domicilio = this.estado.domicilio?.precio || 0;
    const totalDescuentos = rebajaUsada + rebajaVecindad;
    const total = Math.max(0, subtotalProductos + domicilio - totalDescuentos);

    const resumen = {
      subtotalProductos,
      domicilio,
      rebajaUsada,
      rebajaVecindad,
      totalDescuentos,
      total,
      totalUnidades,
      distanciaKm: this.estado.distanciaKm
    };

    if (typeof App !== 'undefined' && App.descuentosBot) {
      App.descuentosBot = {
        domicilio,
        bateriaUsada: this.estado.bateriaUsada === true,
        rebajaUsada,
        rebajaVecindad,
        distanciaKm: this.estado.distanciaKm,
        zona: this.estado.domicilio?.zona || null
      };
    }

    return resumen;
  },

  syncDescuentosACotizacion() {
    this.calcularDescuentos();
    if (typeof App !== 'undefined' && typeof App.renderCotizacion === 'function') {
      App.renderCotizacion(true);
    }
  },

  formatearResumenHTML(r) {
    const fmt = (n) => new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(n);

    let html = '<div class="pilabot-resumen">';
    html += `<div class="pilabot-resumen__linea"><span>Subtotal pilas:</span><span>${fmt(r.subtotalProductos)}</span></div>`;

    if (r.domicilio > 0) {
      html += `<div class="pilabot-resumen__linea"><span>Domicilio (${r.distanciaKm} km):</span><span>${fmt(r.domicilio)}</span></div>`;
    }
    if (r.rebajaUsada > 0) {
      html += `<div class="pilabot-resumen__linea pilabot-resumen__linea--descuento"><span>↓ Batería usada:</span><span>-${fmt(r.rebajaUsada)}</span></div>`;
    }
    if (r.rebajaVecindad > 0) {
      html += `<div class="pilabot-resumen__linea pilabot-resumen__linea--descuento"><span>↓ Promoción Vecindad (2ª pila):</span><span>-${fmt(r.rebajaVecindad)}</span></div>`;
    }

    html += `<div class="pilabot-resumen__linea pilabot-resumen__total"><span>Total estimado:</span><span>${fmt(r.total)}</span></div>`;
    html += '</div>';
    return html;
  },

  /* ── Procesamiento de mensajes ── */

  async procesarEntrada(texto) {
    const entrada = texto.trim();
    if (!entrada) return;

    const cmd = entrada.toLowerCase();
    const atajo = this.biblioteca.atajos?.[cmd];

    if (!atajo || cmd === entrada.toLowerCase()) {
      this.agregarMensajeUsuario(entrada);
    }

    if (atajo) {
      return this.ejecutarAtajo(atajo.accion);
    }

    if (this.estado.paso === 'esperando_direccion') {
      return this.procesarDireccion(entrada);
    }

    if (this.estado.paso === 'esperando_usada') {
      return this.procesarBateriaUsada(entrada);
    }

    return this.procesarLibre(entrada);
  },

  async ejecutarAtajo(accion) {
    const acciones = {
      preguntarDistancia: () => {
        this.estado.paso = 'esperando_direccion';
        this.responder(this.biblioteca.frases.pidiendoDireccion);
      },
      preguntarBateriaUsada: () => {
        this.estado.paso = 'esperando_usada';
        this.preguntarBateriaUsada();
      },
      mostrarVecindad: () => {
        const p = this.biblioteca.promociones.vecindad;
        this.responder(`<strong>${p.nombre}</strong><br>${p.mensaje || p.condicion}`);
      },
      mostrarCotizacion: () => this.mostrarEstadoCotizacion(),
      calcularTotal: () => this.mostrarTotal(),
      mostrarAyuda: () => this.mostrarAyuda(),
      saludar: () => this.iniciarConversacion()
    };

    if (acciones[accion]) acciones[accion]();
  },

  async procesarDireccion(direccion) {
    await this.responder(this.biblioteca.frases.calculando, 500);

    try {
      const ubicacion = await this.geocodificar(direccion);

      if (!ubicacion) {
        await this.responder(this.biblioteca.frases.errorGeocoding);
        return;
      }

      const origen = this.biblioteca.puntoInicio;
      const distancia = this.calcularDistanciaKm(origen.lat, origen.lng, ubicacion.lat, ubicacion.lng);
      const domicilio = this.calcularDomicilio(distancia);

      this.estado.distanciaKm = domicilio.distanciaKm;
      this.estado.ubicacionCliente = ubicacion;
      this.estado.direccionTexto = direccion;
      this.estado.googleMapsUrl = ubicacion.googleMapsUrl;

      if (!domicilio.cubierto) {
        await this.responder(
          `📍 Su dirección queda a <strong>${domicilio.distanciaKm} km</strong> de Carrera 54A #7-05.<br>${domicilio.mensaje}`
        );
        this.estado.paso = 'libre';
        return;
      }

      this.estado.domicilio = domicilio;

      const fmt = (n) => new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP', minimumFractionDigits: 0
      }).format(n);

      const msg = this.biblioteca.frases.resultadoDomicilio
        .replace('{distancia}', domicilio.distanciaKm)
        .replace('{zona}', domicilio.zona)
        .replace('{precio}', fmt(domicilio.precio));

      await this.responder(
        `📍 ${msg}<br><br>` +
        `<a href="${ubicacion.googleMapsUrl}" target="_blank" rel="noopener">🗺️ Ver ruta en Google Maps</a>`
      );

      this.syncDescuentosACotizacion();

      this.estado.paso = 'esperando_usada';
      await this.esperar(400);
      this.preguntarBateriaUsada();

    } catch {
      await this.responder('Uy, se me fue la señal ubicando la dirección. Intente de nuevo o escriba más detalle, ¿vea?');
    }
  },

  preguntarBateriaUsada() {
    const promo = this.biblioteca.promociones.bateriaUsada;
    this.responder(promo.pregunta || this.biblioteca.frases.preguntaUsada);
    this.mostrarQuick([
      { texto: '✅ Sí, tengo usada', valor: 'si tengo bateria usada' },
      { texto: '❌ No, no tengo', valor: 'no tengo bateria usada' }
    ]);
  },

  async procesarBateriaUsada(respuesta) {
    this.limpiarQuick();
    const texto = respuesta.toLowerCase();
    const promo = this.biblioteca.promociones.bateriaUsada;

    const esSi = /^(si|sí|s|yes|claro|dale|obvio|tengo|afirmativo|✅)/.test(texto) ||
      texto.includes('si tengo') || texto.includes('sí tengo') || texto.includes('tengo usada');

    const esNo = /^(no|n|nop|para nada|negativo|❌)/.test(texto) ||
      texto.includes('no tengo');

    if (esSi) {
      this.estado.bateriaUsada = true;
      await this.responder(promo.confirmacionSi);
      this.syncDescuentosACotizacion();
    } else if (esNo) {
      this.estado.bateriaUsada = false;
      await this.responder(promo.confirmacionNo);
      this.syncDescuentosACotizacion();
    } else {
      await this.responder('No le entendí bien, parce. ¿Tiene batería usada pa\' entregar? Responda <strong>sí</strong> o <strong>no</strong>.');
      this.mostrarQuick([
        { texto: '✅ Sí', valor: 'si' },
        { texto: '❌ No', valor: 'no' }
      ]);
      return;
    }

    this.estado.paso = 'libre';

    const vecindad = this.biblioteca.promociones.vecindad;
    await this.esperar(500);
    await this.responder(`💡 <strong>${vecindad.nombre}</strong>: ${vecindad.mensaje || vecindad.condicion}`);

    this.mostrarQuick([
      { texto: '📋 Ver total', valor: '/total' },
      { texto: '🛵 Domicilio', valor: '/domicilio' },
      { texto: '❓ Ayuda', valor: '/ayuda' }
    ]);
  },

  async procesarLibre(texto) {
    const t = texto.toLowerCase();

    if (t.includes('domicilio') || t.includes('distancia') || t.includes('cuanto cuesta el envio') || t.includes('envío')) {
      this.estado.paso = 'esperando_direccion';
      return this.responder(this.biblioteca.frases.pidiendoDireccion);
    }

    if (t.includes('usada') || t.includes('vieja') || t.includes('change') || t.includes('cambio')) {
      this.estado.paso = 'esperando_usada';
      return this.preguntarBateriaUsada();
    }

    if (t.includes('vecindad') || t.includes('segunda') || t.includes('promocion') || t.includes('promoción')) {
      const p = this.biblioteca.promociones.vecindad;
      return this.responder(`<strong>${p.nombre}</strong>: la segunda pila de su compra tiene <strong>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p.descuento)}</strong> de descuento. ¡Pa' el vecino o pa' otro carro!`);
    }

    if (t.includes('total') || t.includes('cuanto') || t.includes('cuánto') || t.includes('precio final')) {
      return this.mostrarTotal();
    }

    if (t.includes('cotiz') || t.includes('carrito') || t.includes('seleccion')) {
      return this.mostrarEstadoCotizacion();
    }

    if (t.includes('gracias') || t.includes('chao') || t.includes('adios') || t.includes('adiós')) {
      return this.responder(this.biblioteca.frases.despedida);
    }

    if (t.includes('hola') || t.includes('buenas') || t.includes('qué hubo') || t.includes('que hubo')) {
      return this.responder('¡Qué hubo, parce! ¿Le calculo el domicilio, le explico los descuentos o miramos el total? Escriba <strong>/ayuda</strong> pa\' ver los comandos.');
    }

    return this.responder(
      'Mmm, no le cogí la vuelta. Pruebe con:<br>' +
      '• <strong>/domicilio</strong> – calcular envío<br>' +
      '• <strong>/usada</strong> – descuento batería usada<br>' +
      '• <strong>/vecindad</strong> – promoción 2ª pila<br>' +
      '• <strong>/total</strong> – precio final con descuentos<br>' +
      '• <strong>/ayuda</strong> – menú completo'
    );
  },

  async mostrarTotal() {
    const r = this.calcularDescuentos();

    if (r.subtotalProductos === 0 && r.domicilio === 0) {
      return this.responder('Todavía no hay pilas en la cotización. Busque su carro arriba, agregue una referencia y yo le saco la cuenta con domicilio y descuentos, ¿listo?');
    }

    let msg = '🧮 <strong>Cuenta clarita:</strong>';
    msg += this.formatearResumenHTML(r);

    if (this.estado.domicilio) {
      msg += `<br><small class="text-muted">Domicilio desde Carrera 54A #7-05 · ${this.estado.domicilio.zona}</small>`;
    } else {
      msg += '<br><small>💡 Escriba <strong>/domicilio</strong> pa\' incluir el envío.</small>';
    }

    await this.responder(msg);
  },

  async mostrarEstadoCotizacion() {
    const cot = (typeof App !== 'undefined' && App.cotizacion) ? App.cotizacion : [];

    if (cot.length === 0) {
      return this.responder('La cotización está vacía, vea. Use el buscador de arriba, elija la pila y déle en <strong>Cotizar</strong>. Yo quedo pendiente.');
    }

    const fmt = (n) => new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(n);

    let msg = '📋 <strong>Su cotización:</strong><ul style="margin:0.5rem 0;padding-left:1.2rem">';
    cot.forEach(item => {
      msg += `<li>${item.nombre} (x${item.cantidad}) – ${fmt(item.precio * item.cantidad)}</li>`;
    });
    msg += '</ul>';

    const r = this.calcularDescuentos();
    msg += this.formatearResumenHTML(r);

    await this.responder(msg);
  },

  async mostrarAyuda() {
    const zonas = this.biblioteca.domicilio.zonas;
    const fmt = (n) => new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(n);

    let msg = '🇨🇴 <strong>PilaBot – Menú de ayuda</strong><br><br>';
    msg += `<strong>📍 Domicilio</strong> (desde Carrera 54A #7-05):<br>`;
    msg += `• Hasta ${zonas[0].radioMaxKm} km → ${fmt(zonas[0].precio)}<br>`;
    msg += `• Hasta ${zonas[1].radioMaxKm} km → ${fmt(zonas[1].precio)}<br><br>`;
    msg += `<strong>🔋 Descuentos:</strong><br>`;
    msg += `• Batería usada: -${fmt(this.biblioteca.promociones.bateriaUsada.descuento)}<br>`;
    msg += `• ${this.biblioteca.promociones.vecindad.nombre} (2ª pila): -${fmt(this.biblioteca.promociones.vecindad.descuento)}<br><br>`;
    msg += '<strong>Atajos:</strong> /domicilio · /usada · /vecindad · /total · /cotizar';

    await this.responder(msg);
    this.mostrarQuick([
      { texto: '🛵 Calcular domicilio', valor: '/domicilio' },
      { texto: '🔋 ¿Tengo usada?', valor: '/usada' },
      { texto: '🧮 Ver total', valor: '/total' }
    ]);
  }
};

document.addEventListener('DOMContentLoaded', () => PilaBot.init());
