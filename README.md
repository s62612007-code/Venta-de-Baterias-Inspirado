# Honda Baterías – Cotizador Cali

> Plataforma web para cotización, domicilios y catálogo de baterías automotrices. Marcas Bosch, MAC, Varta, Coéxito, Duncan y Willard.

**Socio principal:** Santiago Martinez Vasquez  
**WhatsApp:** [318 269 2794](https://wa.me/573182692794)  
**Correo:** s62612007@gmail.com

---

## 🚀 Características Principales

* **Cotizador Inteligente:** Filtro de baterías por marca, modelo y año del vehículo.
* **Solicitud de Domicilios:** Asistente **PilaBot** para calcular envío en Cali (zonas 1.5 km y 8 km).
* **Catálogo de Productos:** Visualización de marcas líderes con logos e imágenes por referencia.
* **Cotización en PDF:** Generación instantánea para el cliente.
* **Promociones:** Batería usada (-$30.000) y Promoción Vecindad en segunda pila (-$35.000).
* **Diseño Responsivo:** Optimizado para móviles y computadoras.

## 🛠️ Tecnologías Utilizadas

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
* **Estilos:** Bootstrap 5 + CSS personalizado
* **Datos:** JSON local
* **PDF:** jsPDF
* **Geocoding:** OpenStreetMap Nominatim
* **Despliegue:** GitHub Pages

## 📦 Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/s62612007-code/Venta-de-Baterias-Inspirado.git
   cd Venta-de-Baterias-Inspirado
   ```

2. **Iniciar servidor local:**
   ```bash
   python3 -m http.server 8080
   ```

3. **Abrir en el navegador:** [http://localhost:8080](http://localhost:8080)

4. **Variables de entorno (opcional):**
   ```bash
   cp .env.example .env
   ```

## 🗺️ Estructura del Proyecto

```text
├── config/
│   ├── empresa.json          # Datos Honda Baterías y contacto
│   ├── precios.json          # Tarifas por marca
│   └── bot-biblioteca.json   # PilaBot, domicilio y promociones
├── css/                      # Estilos
├── data/                     # Catálogo vehicular
├── images/                   # Logos e imágenes por referencia
├── js/                       # app.js y bot.js
├── index.html
├── test-sitio.js
└── README.md
```

## 🛵 Domicilio en Cali

| Zona | Radio | Precio |
|------|-------|--------|
| Cercana | hasta 1.5 km | $15.000 COP |
| Amplia | hasta 8 km | $25.000 COP |

## 🧪 Pruebas

```bash
node test-sitio.js
```

## 🌐 Sitio en línea

| URL | Uso |
|-----|-----|
| https://hondabaterias.com | Dominio principal (A) |
| https://hondabateriascali.com | Dominio alterno (B) → redirige al A |
| https://s62612007-code.github.io/Venta-de-Baterias-Inspirado/ | GitHub Pages |

Configuración DNS detallada en [DOMINIO.md](DOMINIO.md).

---

**Honda Baterías** – *Energía confiable para tu camino.*
