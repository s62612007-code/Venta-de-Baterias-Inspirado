# Venta de Baterías Inspirado – Batericars Cali

> Plataforma web para cotización, domicilios y catálogo de baterías automotrices en Cali. Distribuidor **Coéxito** – marcas Bosch, MAC, Varta, Coéxito, Duncan y Willard.

---

## 🚀 Características Principales

* **Cotizador Inteligente:** Filtro de baterías por marca, modelo y año del vehículo.
* **Solicitud de Domicilios:** Asistente **PilaBot** integrado para calcular envío en Cali (zonas 1.5 km y 8 km).
* **Catálogo de Productos:** Visualización de marcas líderes (MAC, Coéxito, Willard, Bosch, Varta, Duncan) con logos e imágenes por referencia.
* **Cotización en PDF:** Generación instantánea de cotización para el cliente.
* **Promociones Automáticas:** Descuento por batería usada (-$30.000) y Promoción Vecindad en segunda pila (-$35.000).
* **Diseño Responsivo:** Optimizado para dispositivos móviles y computadoras.

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Estilos:** Bootstrap 5 + CSS personalizado
* **Datos:** JSON local (`precios.json`, `catalogo.json`, `bot-biblioteca.json`)
* **PDF:** jsPDF
* **Geocoding:** OpenStreetMap Nominatim + enlace Google Maps
* **Despliegue:** GitHub Pages

## 📦 Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/s62612007-code/Venta-de-Baterias-Inspirado.git
   cd Venta-de-Baterias-Inspirado
   ```

2. **Iniciar servidor local:**
   Este proyecto es estático, no requiere `npm install`. Usa un servidor HTTP simple:
   ```bash
   python3 -m http.server 8080
   ```

3. **Abrir en el navegador:**
   Visita [http://localhost:8080](http://localhost:8080) para ver el cotizador.

4. **Configuración opcional (variables de entorno):**
   Para futuras integraciones (WhatsApp, panel admin, base de datos), copia la plantilla:
   ```bash
   cp .env.example .env
   ```

## 🗺️ Estructura del Proyecto

```text
├── config/
│   ├── precios.json          # Tarifas por marca y referencia
│   └── bot-biblioteca.json   # Promociones, domicilio y atajos PilaBot
├── css/
│   ├── styles.css            # Estilos del cotizador
│   └── bot.css               # Estilos del chat PilaBot
├── data/
│   └── catalogo.json         # Compatibilidad vehículo → batería
├── images/
│   ├── logos/                # Logos de marcas
│   └── baterias/             # Imagen por referencia
├── js/
│   ├── app.js                # Motor de búsqueda y cotización
│   └── bot.js                # Asistente PilaBot (domicilio y descuentos)
├── index.html                # Página principal
├── test-sitio.js             # Pruebas automatizadas del sitio
├── .env.example              # Plantilla de variables de entorno
└── README.md                 # Documentación del proyecto
```

## 🛵 Domicilio en Cali

Punto de inicio del recorrido: **Carrera 54A #7-05**

| Zona | Radio | Precio |
|------|-------|--------|
| Cercana | hasta 1.5 km | $15.000 COP |
| Amplia | hasta 8 km | $25.000 COP |

## 🧪 Ejecutar pruebas

```bash
node test-sitio.js
```

Verifica recursos, catálogo, domicilio, descuentos y geocoding del sitio publicado.

## 🌐 Sitio en línea

Una vez desplegado en GitHub Pages:

```
https://s62612007-code.github.io/Venta-de-Baterias-Inspirado/
```

---

**Venta de Baterías Inspirado** – *Energía confiable para tu camino.*
