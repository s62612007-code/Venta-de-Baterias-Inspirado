/**
 * Honda Baterías - Motor de búsqueda y cotización
 * Santiago Martinez Vasquez
 */

const App = {
  precios: null,
  catalogo: null,
  empresa: null,
  productosMap: {},
  marcasMap: {},
  cotizacion: [],
  descuentosBot: {
    domicilio: 0,
    bateriaUsada: false,
    rebajaUsada: 0,
    rebajaVecindad: 0,
    distanciaKm: null,
    zona: null
  },

  async init() {
    try {
      const [preciosRes, catalogoRes, empresaRes] = await Promise.all([
        fetch('config/precios.json'),
        fetch('data/catalogo.json'),
        fetch('config/empresa.json')
      ]);

      this.precios = await preciosRes.json();
      this.catalogo = await catalogoRes.json();
      this.empresa = await empresaRes.json();
      this.buildMaps();
      this.populateMarcas();
      this.setupEventListeners();
      this.renderCatalogoCompleto();
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.showError('No se pudieron cargar los datos. Verifique su conexión o recargue la página.');
    }
  },

  buildMaps() {
    for (const [marcaKey, marca] of Object.entries(this.precios.marcas)) {
      this.marcasMap[marcaKey] = marca;
      for (const producto of marca.productos) {
        this.productosMap[producto.id] = {
          ...producto,
          marcaKey,
          marcaNombre: marca.nombre,
          marcaLogo: marca.logo,
          marcaColor: this.getMarcaColor(marcaKey)
        };
      }
    }
  },

  getMarcaColor(marcaKey) {
    const colores = {
      bosch: '#003399', mac: '#e63900', varta: '#0066cc',
      coexito: '#003366', duncan: '#2d6a4f', willard: '#d4a017'
    };
    return colores[marcaKey] || '#333';
  },

  getLogo(marcaKey) {
    return this.marcasMap[marcaKey]?.logo || `images/logos/${marcaKey}.svg`;
  },

  getImagen(producto) {
    return producto.imagen || `images/baterias/${producto.id}.svg`;
  },

  renderMarcaHeader(marcaKey, marca) {
    const count = marca.productos.length;
    return `
      <div class="marca-header brand-${marcaKey}" style="--marca-color: ${this.getMarcaColor(marcaKey)}">
        <img src="${marca.logo}" alt="Logo ${marca.nombre}" class="marca-header__logo">
        <div class="marca-header__info">
          <h4 class="marca-header__titulo">${marca.nombre}</h4>
          <p class="marca-header__desc">${marca.descripcion}</p>
        </div>
        <div class="marca-header__count">
          <i class="bi bi-battery-charging"></i> ${count} referencia${count !== 1 ? 's' : ''}
        </div>
      </div>
    `;
  },

  renderBatteryCard(producto, esMejorPrecio = false) {
    const logo = producto.marcaLogo || this.getLogo(producto.marcaKey);
    const imagen = this.getImagen(producto);
    const destacada = esMejorPrecio ? 'battery-card--destacada' : '';

    return `
      <div class="card battery-card brand-${producto.marcaKey} ${destacada} position-relative">
        ${esMejorPrecio ? '<span class="badge bg-warning text-dark badge-mejor-precio">Mejor precio</span>' : ''}
        <div class="battery-card__top">
          <img src="${logo}" alt="${producto.marcaNombre}" class="battery-card__brand-logo">
          <span class="battery-card__gama">${producto.gama}</span>
        </div>
        <div class="battery-card__image-wrap">
          <img src="${imagen}" alt="${producto.nombre}" class="battery-card__image" loading="lazy">
        </div>
        <div class="battery-card__body">
          <h6 class="battery-card__referencia">${producto.nombre}</h6>
          <p class="battery-card__uso">${producto.uso}</p>
          <div class="mb-2">
            <span class="badge bg-secondary spec-badge">${producto.ah} Ah</span>
            <span class="badge bg-secondary spec-badge">${producto.cca} CA</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <span class="price-tag">${this.formatPrecio(producto.precio)}</span>
            <button class="btn btn-sm btn-honda" onclick="App.agregarACotizacion('${producto.id}')">
              <i class="bi bi-plus-circle"></i> Cotizar
            </button>
          </div>
        </div>
      </div>
    `;
  },

  populateMarcas() {
    const select = document.getElementById('selectMarca');
    const marcas = [...new Set(this.catalogo.vehiculos.map(v => v.marca))].sort();
    marcas.forEach(marca => {
      const option = document.createElement('option');
      option.value = marca;
      option.textContent = marca;
      select.appendChild(option);
    });
  },

  setupEventListeners() {
    document.getElementById('selectMarca').addEventListener('change', (e) => {
      this.populateModelos(e.target.value);
    });

    document.getElementById('btnBuscar').addEventListener('click', () => {
      this.buscarPorVehiculo();
    });

    document.getElementById('btnLimpiar').addEventListener('click', () => {
      this.limpiarBusqueda();
    });

    document.getElementById('btnGenerarPDF').addEventListener('click', () => {
      this.generarPDF();
    });

    document.getElementById('btnLimpiarCotizacion').addEventListener('click', () => {
      this.limpiarCotizacion();
    });

    document.getElementById('inputBusquedaTexto').addEventListener('input', (e) => {
      this.buscarPorTexto(e.target.value);
    });
  },

  populateModelos(marca) {
    const select = document.getElementById('selectModelo');
    select.innerHTML = '<option value="">Seleccione modelo...</option>';
    if (!marca) return;

    const modelos = this.catalogo.vehiculos
      .filter(v => v.marca === marca)
      .map(v => v.modelo);

    [...new Set(modelos)].sort().forEach(modelo => {
      const option = document.createElement('option');
      option.value = modelo;
      option.textContent = modelo;
      select.appendChild(option);
    });
  },

  buscarPorVehiculo() {
    const marca = document.getElementById('selectMarca').value;
    const modelo = document.getElementById('selectModelo').value;
    const anio = parseInt(document.getElementById('inputAnio').value) || null;

    if (!marca || !modelo) {
      alert('Seleccione marca y modelo del vehículo.');
      return;
    }

    const vehiculo = this.catalogo.vehiculos.find(
      v => v.marca === marca && v.modelo === modelo
    );

    if (anio && vehiculo) {
      if (anio < vehiculo.anioDesde || anio > vehiculo.anioHasta) {
        alert(`El año ${anio} está fuera del rango (${vehiculo.anioDesde}-${vehiculo.anioHasta}). Se mostrarán opciones compatibles.`);
      }
    }

    if (!vehiculo) {
      this.mostrarSinResultados();
      return;
    }

    this.mostrarVehiculo(vehiculo);
    const baterias = vehiculo.baterias
      .map(id => this.productosMap[id])
      .filter(Boolean)
      .sort((a, b) => a.precio - b.precio);

    this.renderResultados(baterias, vehiculo);
  },

  buscarPorTexto(texto) {
    const container = document.getElementById('resultadosBusqueda');
    if (!texto || texto.length < 2) {
      container.innerHTML = '';
      return;
    }

    const termino = texto.toLowerCase();
    const resultados = Object.values(this.productosMap).filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      p.marcaNombre.toLowerCase().includes(termino) ||
      p.uso.toLowerCase().includes(termino) ||
      p.gama.toLowerCase().includes(termino)
    );

    if (resultados.length === 0) {
      container.innerHTML = '<p class="text-muted small px-2">Sin coincidencias</p>';
      return;
    }

    container.innerHTML = resultados.slice(0, 8).map(p => `
      <div class="list-group-item list-group-item-action py-2"
           onclick="App.agregarACotizacion('${p.id}')">
        <div class="busqueda-item">
          <img src="${this.getImagen(p)}" alt="${p.nombre}" class="busqueda-item__img">
          <div class="flex-grow-1">
            <img src="${p.marcaLogo}" alt="${p.marcaNombre}" class="busqueda-item__logo mb-1">
            <strong class="d-block small">${p.nombre}</strong>
            <small class="text-muted">${p.ah} Ah / ${p.cca} CA</small>
          </div>
          <span class="price-tag" style="font-size:1rem">${this.formatPrecio(p.precio)}</span>
        </div>
      </div>
    `).join('');
  },

  mostrarVehiculo(vehiculo) {
    const container = document.getElementById('infoVehiculo');
    container.style.display = 'block';
    container.innerHTML = `
      <div class="vehicle-info">
        <h5 class="mb-2"><i class="bi bi-car-front"></i> ${vehiculo.marca} ${vehiculo.modelo}</h5>
        <div class="row">
          <div class="col-md-3"><small class="text-muted">Cilindraje</small><br><strong>${vehiculo.cilindraje}</strong></div>
          <div class="col-md-3"><small class="text-muted">Años</small><br><strong>${vehiculo.anioDesde} - ${vehiculo.anioHasta}</strong></div>
          <div class="col-md-3"><small class="text-muted">Tipo</small><br><strong>${vehiculo.tipo}</strong></div>
          <div class="col-md-3"><small class="text-muted">Opciones</small><br><strong>${vehiculo.baterias.length} baterías</strong></div>
        </div>
      </div>
    `;
  },

  renderResultados(baterias) {
    const container = document.getElementById('resultadosContainer');
    document.getElementById('loadingSpinner').style.display = 'none';

    if (baterias.length === 0) {
      this.mostrarSinResultados();
      return;
    }

    const precioMin = Math.min(...baterias.map(b => b.precio));

    container.innerHTML = `
      <h4 class="mb-3">Baterías compatibles <span class="badge bg-secondary">${baterias.length}</span></h4>
      <div class="table-responsive mb-4">
        <table class="table table-hover comparison-table">
          <thead>
            <tr>
              <th>Marca</th>
              <th>Referencia</th>
              <th>Gama</th>
              <th>Ah</th>
              <th>CCA</th>
              <th>Precio Neto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${baterias.map(b => `
              <tr class="${b.precio === precioMin ? 'best-price' : ''}">
                <td>
                  <div class="marca-cell">
                    <img src="${b.marcaLogo}" alt="${b.marcaNombre}">
                    <strong>${b.marcaNombre}</strong>
                  </div>
                </td>
                <td>
                  <div class="ref-cell">
                    <img src="${this.getImagen(b)}" alt="${b.nombre}" class="ref-thumb">
                    <span>${b.nombre}</span>
                  </div>
                </td>
                <td><span class="badge bg-light text-dark gama-badge">${b.gama}</span></td>
                <td>${b.ah} Ah</td>
                <td>${b.cca} CA</td>
                <td class="price-tag" style="font-size:1.1rem">${this.formatPrecio(b.precio)}</td>
                <td>
                  <button class="btn btn-sm btn-honda" onclick="App.agregarACotizacion('${b.id}')">
                    <i class="bi bi-plus-circle"></i> Agregar
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="row g-3">
        ${baterias.map(b => `
          <div class="col-md-6 col-lg-4">
            ${this.renderBatteryCard(b, b.precio === precioMin)}
          </div>
        `).join('')}
      </div>
    `;
  },

  renderCatalogoCompleto() {
    const tabsContainer = document.getElementById('tabsMarcas');
    const contentContainer = document.getElementById('catalogoMarcas');
    const marcas = Object.entries(this.precios.marcas);

    tabsContainer.innerHTML = marcas.map(([key, marca], i) => `
      <li class="nav-item" role="presentation">
        <button class="nav-link ${i === 0 ? 'active' : ''}" data-bs-toggle="tab"
                data-bs-target="#tab-${key}" type="button">
          <img src="${marca.logo}" alt="${marca.nombre}">
          ${marca.nombre}
        </button>
      </li>
    `).join('');

    contentContainer.innerHTML = marcas.map(([key, marca], i) => `
      <div class="tab-pane fade ${i === 0 ? 'show active' : ''}" id="tab-${key}">
        ${this.renderMarcaHeader(key, marca)}
        <div class="row g-3">
          ${marca.productos.map(p => {
            const prod = { ...p, marcaKey: key, marcaNombre: marca.nombre, marcaLogo: marca.logo };
            return `<div class="col-md-6 col-lg-4">${this.renderBatteryCard(prod, false)}</div>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  },

  agregarACotizacion(productoId) {
    const producto = this.productosMap[productoId];
    if (!producto) return;

    const existe = this.cotizacion.find(c => c.id === productoId);
    if (existe) {
      existe.cantidad++;
    } else {
      this.cotizacion.push({ ...producto, cantidad: 1 });
    }

    this.renderCotizacion();
  },

  quitarDeCotizacion(productoId) {
    this.cotizacion = this.cotizacion.filter(c => c.id !== productoId);
    this.renderCotizacion();
  },

  calcularResumen() {
    let subtotal = 0;
    let unidades = 0;

    this.cotizacion.forEach(item => {
      subtotal += item.precio * item.cantidad;
      unidades += item.cantidad;
    });

    const d = this.descuentosBot;
    const rebajaUsada = d.bateriaUsada ? d.rebajaUsada || 30000 : 0;
    const rebajaVecindad = unidades >= 2 ? d.rebajaVecindad || 35000 : 0;
    const domicilio = d.domicilio || 0;
    const total = Math.max(0, subtotal + domicilio - rebajaUsada - rebajaVecindad);

    return { subtotal, domicilio, rebajaUsada, rebajaVecindad, total, unidades };
  },

  renderCotizacion(desdeBot = false) {
    const container = document.getElementById('cotizacionItems');
    const totalEl = document.getElementById('cotizacionTotal');
    const descuentosEl = document.getElementById('cotizacionDescuentos');
    const btnPDF = document.getElementById('btnGenerarPDF');

    if (!desdeBot && typeof PilaBot !== 'undefined' && PilaBot.calcularDescuentos) {
      PilaBot.calcularDescuentos();
    }

    if (this.cotizacion.length === 0) {
      container.innerHTML = '<p class="text-muted text-center small">Agregue baterías a la cotización</p>';
      if (descuentosEl) descuentosEl.innerHTML = '';
      totalEl.textContent = '$0';
      btnPDF.disabled = true;
      return;
    }

    btnPDF.disabled = false;

    container.innerHTML = this.cotizacion.map(item => {
      const subtotal = item.precio * item.cantidad;
      return `
        <div class="cotizacion-item">
          <div class="cotizacion-item__row">
            <img src="${this.getImagen(item)}" alt="${item.nombre}" class="cotizacion-item__thumb">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <img src="${item.marcaLogo}" alt="${item.marcaNombre}" style="height:14px;margin-bottom:2px">
                  <strong class="small d-block">${item.nombre}</strong>
                  <div class="text-muted" style="font-size:0.75rem">${item.ah}Ah / ${item.cca}CA</div>
                </div>
                <button class="btn btn-sm btn-link text-danger p-0" onclick="App.quitarDeCotizacion('${item.id}')">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <div class="d-flex justify-content-between mt-1">
                <span class="small">${item.cantidad} x ${this.formatPrecio(item.precio)}</span>
                <strong>${this.formatPrecio(subtotal)}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const r = this.calcularResumen();

    if (descuentosEl) {
      let extra = '';
      if (r.domicilio > 0) {
        extra += `<div class="d-flex justify-content-between text-muted"><span>Domicilio${this.descuentosBot.zona ? ' (' + this.descuentosBot.zona + ')' : ''}</span><span>+${this.formatPrecio(r.domicilio)}</span></div>`;
      }
      if (r.rebajaUsada > 0) {
        extra += `<div class="d-flex justify-content-between text-success"><span>↓ Batería usada</span><span>-${this.formatPrecio(r.rebajaUsada)}</span></div>`;
      }
      if (r.rebajaVecindad > 0) {
        extra += `<div class="d-flex justify-content-between text-success"><span>↓ Promoción Vecindad</span><span>-${this.formatPrecio(r.rebajaVecindad)}</span></div>`;
      }
      descuentosEl.innerHTML = extra;
    }

    totalEl.textContent = this.formatPrecio(r.total);
  },

  generarPDF() {
    if (this.cotizacion.length === 0) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const vehiculoEl = document.querySelector('#infoVehiculo h5');
    const vehiculo = vehiculoEl ? vehiculoEl.textContent.trim() : '';

    doc.setFontSize(18);
    doc.setTextColor(204, 0, 0);
    doc.text(this.empresa?.nombre || 'Honda Baterías', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Cotización de Baterías - Cali', 105, 28, { align: 'center' });
    if (this.empresa?.contacto) {
      doc.text(`WhatsApp: ${this.empresa.contacto.whatsapp}`, 105, 34, { align: 'center' });
    }

    doc.setDrawColor(204, 0, 0);
    doc.line(20, 38, 190, 38);

    doc.setFontSize(10);
    doc.setTextColor(0);
    const fecha = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Fecha: ${fecha}`, 20, 48);

    if (vehiculo) {
      doc.text(`Vehículo: ${vehiculo}`, 20, 55);
    }

    let y = vehiculo ? 68 : 58;

    doc.setFontSize(9);
    doc.setFillColor(0, 51, 102);
    doc.rect(20, y - 5, 170, 8, 'F');
    doc.setTextColor(255);
    doc.text('Referencia', 22, y);
    doc.text('Marca', 90, y);
    doc.text('Specs', 120, y);
    doc.text('Precio', 160, y);
    y += 10;

    doc.setTextColor(0);

    this.cotizacion.forEach(item => {
      const subtotal = item.precio * item.cantidad;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const nombre = item.cantidad > 1
        ? `${item.nombre} (x${item.cantidad})`
        : item.nombre;

      doc.text(nombre.substring(0, 35), 22, y);
      doc.text(item.marcaNombre, 90, y);
      doc.text(`${item.ah}Ah/${item.cca}CA`, 120, y);
      doc.text(this.formatPrecio(subtotal), 160, y);
      y += 8;
    });

    const r = this.calcularResumen();

    if (r.domicilio > 0) {
      y += 4;
      doc.text(`Domicilio: ${this.formatPrecio(r.domicilio)}`, 22, y);
      y += 7;
    }
    if (r.rebajaUsada > 0) {
      doc.setTextColor(25, 135, 84);
      doc.text(`Desc. batería usada: -${this.formatPrecio(r.rebajaUsada)}`, 22, y);
      doc.setTextColor(0);
      y += 7;
    }
    if (r.rebajaVecindad > 0) {
      doc.setTextColor(25, 135, 84);
      doc.text(`Promoción Vecindad: -${this.formatPrecio(r.rebajaVecindad)}`, 22, y);
      doc.setTextColor(0);
      y += 7;
    }

    y += 5;
    doc.setDrawColor(204, 0, 0);
    doc.line(120, y, 190, y);
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(204, 0, 0);
    doc.text('TOTAL:', 130, y);
    doc.text(this.formatPrecio(r.total), 160, y);

    y += 15;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Precios netos en COP. Sujetos a disponibilidad de inventario.', 20, y);
    doc.text('Garantía de 12 a 18 meses según marca.', 20, y + 5);
    doc.text(`${this.empresa?.nombre || 'Honda Baterías'} - ${this.empresa?.slogan || 'Energía confiable para tu camino.'}`, 105, y + 15, { align: 'center' });

    doc.save(`cotizacion-honda-baterias-${Date.now()}.pdf`);
  },

  limpiarBusqueda() {
    document.getElementById('selectMarca').value = '';
    document.getElementById('selectModelo').innerHTML = '<option value="">Seleccione modelo...</option>';
    document.getElementById('inputAnio').value = '';
    document.getElementById('infoVehiculo').style.display = 'none';
    document.getElementById('resultadosContainer').innerHTML = '';
    document.getElementById('inputBusquedaTexto').value = '';
    document.getElementById('resultadosBusqueda').innerHTML = '';
  },

  limpiarCotizacion() {
    this.cotizacion = [];
    this.renderCotizacion();
  },

  mostrarSinResultados() {
    document.getElementById('resultadosContainer').innerHTML = `
      <div class="no-results">
        <i class="bi bi-search display-4 text-muted"></i>
        <p class="mt-3">No se encontraron baterías para este vehículo.</p>
        <p class="text-muted small">Intente con otra combinación o consulte el catálogo completo.</p>
      </div>
    `;
  },

  showError(mensaje) {
    document.getElementById('resultadosContainer').innerHTML = `
      <div class="alert alert-danger">${mensaje}</div>
    `;
  },

  formatPrecio(valor) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
