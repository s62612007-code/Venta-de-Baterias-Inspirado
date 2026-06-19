# Dominio y hosting – Honda Baterías

**Dominio oficial:** `hondabateriacali.com`  
**Hosting:** Piensa Solutions (`217.76.150.40`)  
**Panel de control:** https://control.hondabateriacali.com

---

## Registros DNS (ya configurados)

| Tipo | Nombre/Host | Valor |
|------|-------------|-------|
| **A** | `@` | `217.76.150.40` |
| **CNAME** | `ftp` | `www.hondabateriacali.com` |
| **CNAME** | `control` | `pdc.piensasolutions.com` |
| **CNAME** | `autoconfig` | `autoconfig.buzondecorreo.com` |
| **CNAME** | `autodiscover` | `autodiscover.buzondecorreo.com` |
| **MX 10** | `@` | `mx.buzondecorreo.com` |
| **TXT (SPF)** | `@` | `v=spf1 include:_spf.buzondecorreo.com ~all` |
| **TXT (DKIM)** | `1781826039845._domainkey` | *(registro DKIM de correo)* |

### Registro recomendado adicional

Si `www.hondabateriacali.com` no abre, agrega en tu registrador:

| Tipo | Nombre/Host | Valor |
|------|-------------|-------|
| **A** | `www` | `217.76.150.40` |

---

## Subir el sitio por FTP

1. Entra al panel: https://control.hondabateriacali.com
2. Busca **FTP** o **Administrador de archivos**
3. Abre la carpeta pública del sitio (`public_html`, `httpdocs` o `www`)
4. Sube **todo el contenido** del proyecto (no la carpeta `.git`):

```
index.html
config/
css/
data/
images/
js/
```

5. Verifica que `index.html` quede en la raíz de `public_html`
6. Abre https://hondabateriacali.com y prueba el cotizador

### Datos FTP típicos (en el panel de Piensa)

- **Servidor:** `ftp.hondabateriacali.com` o `217.76.150.40`
- **Usuario y contraseña:** los creas en el panel de hosting
- **Puerto:** 21 (FTP) o 22 (SFTP si está disponible)

---

## Archivos que NO debes subir

| Archivo/carpeta | Motivo |
|-----------------|--------|
| `.git/` | Solo control de versiones |
| `test-sitio.js` | Pruebas locales |
| `.env` / `.env.example` | Config local, no se usa en el navegador |
| `CNAME` | Solo para GitHub Pages |
| `.nojekyll` | Solo para GitHub Pages |

---

## Comprobar que funciona

```bash
# Ver que el dominio apunta al hosting
dig hondabateriacali.com +short
# Debe mostrar: 217.76.150.40

# Probar el sitio
curl -I https://hondabateriacali.com
```

URLs finales:
- https://hondabateriacali.com
- https://www.hondabateriacali.com

---

## Contacto

- **Honda Baterías** – Santiago Martinez Vasquez
- WhatsApp: 318 269 2794
- Correo: s62612007@gmail.com
