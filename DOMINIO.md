# Configuración de dominios – Honda Baterías

Sitio GitHub Pages: https://s62612007-code.github.io/Venta-de-Baterias-Inspirado/

## Dominios configurados

| Rol | Dominio | Uso |
|-----|---------|-----|
| **A (principal)** | `hondabaterias.com` | Dominio principal en GitHub Pages |
| **B (alterno)** | `hondabateriascali.com` | Redirige al dominio principal |

---

## Paso 1 – Dominio A: `hondabaterias.com`

En el panel de tu registrador (GoDaddy, Namecheap, Google Domains, etc.):

### Registros DNS

| Tipo | Nombre/Host | Valor | TTL |
|------|-------------|-------|-----|
| **A** | `@` | `185.199.108.153` | 3600 |
| **A** | `@` | `185.199.109.153` | 3600 |
| **A** | `@` | `185.199.110.153` | 3600 |
| **A** | `@` | `185.199.111.153` | 3600 |
| **CNAME** | `www` | `s62612007-code.github.io` | 3600 |

### En GitHub (ya configurado en este repo)

- Archivo `CNAME` → `hondabaterias.com`
- HTTPS forzado activado automáticamente cuando DNS propague (24–48 h)

---

## Paso 2 – Dominio B: `hondabateriascali.com`

GitHub Pages permite **un** dominio custom por repositorio. Para el dominio B:

### Opción recomendada: Redirección en el registrador

Configura **redirección 301** de:
- `hondabateriascali.com` → `https://hondabaterias.com`
- `www.hondabateriascali.com` → `https://hondabaterias.com`

### Opción alternativa: Mismos registros A (solo si el registrador lo permite como alias)

| Tipo | Nombre | Valor |
|------|--------|-------|
| **A** | `@` | `185.199.108.153` (y las otras 3 IPs) |
| **CNAME** | `www` | `hondabaterias.com` |

> Si usas esta opción y GitHub no emite certificado SSL para el dominio B, usa la redirección 301.

---

## Paso 3 – Verificar en GitHub

1. Ir a: https://github.com/s62612007-code/Venta-de-Baterias-Inspirado/settings/pages
2. En **Custom domain** debe aparecer: `hondabaterias.com`
3. Marcar **Enforce HTTPS** cuando esté disponible

---

## Paso 4 – Comprobar propagación DNS

```bash
# Dominio A
dig hondabaterias.com +short
dig www.hondabaterias.com +short

# Debe responder las IPs de GitHub o el CNAME a github.io
```

Prueba en navegador:
- https://hondabaterias.com
- https://www.hondabaterias.com

---

## Contacto del proyecto

- **Empresa:** Honda Baterías
- **Socio principal:** Santiago Martinez Vasquez
- **WhatsApp:** 318 269 2794
- **Correo:** s62612007@gmail.com
