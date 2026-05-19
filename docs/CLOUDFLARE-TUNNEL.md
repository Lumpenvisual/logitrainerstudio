# Cloudflare Tunnel — LogiTrainer Studio

Expone tu entorno local (`localhost:8080`) en Internet con un dominio fijo y acceso unificado en `/studio`.

## URLs

| Entorno | URL |
|---------|-----|
| **Túnel (objetivo)** | https://studio.logitrainerstudio.com/studio |
| **Alternativa DNS** | https://tunel.logitrainerstudio.com/studio |
| **Local** | http://localhost:8080/studio |
| **Producción Vercel** | https://logitrainerstudio.vercel.app/studio |

**Contraseña de acceso (hub):** `LTS-Mayo2026-7kQ!`  
**Back-office Supabase:** `backoffice@logitrainerstudio.app` (login en `/auth` tras entrar a la app)

---

## Requisitos previos (manual, una vez)

1. Cuenta [Cloudflare](https://dash.cloudflare.com) con el dominio **logitrainerstudio.com** activo.
2. Node.js ≥ 20 y dependencias: `npm install`
3. Windows con PowerShell (scripts incluidos).

---

## Instalación rápida (Windows)

```bat
cd C:\proyectos\logitrainerstudio

REM 1) Instalar cloudflared
scripts\install-cloudflared.bat

REM 2) Configurar túnel (abre navegador para login Cloudflare)
scripts\setup-tunnel.ps1

REM 3) Iniciar app + túnel
npm run tunnel:platform
```

O en **dos terminales**:

```bat
npm start
npm run tunnel:start
```

---

## Comandos npm

| Comando | Descripción |
|---------|-------------|
| `npm run tunnel:install` | Instala cloudflared (winget) |
| `npm run tunnel:setup` | Login Cloudflare + crea túnel + `config.yml` |
| `npm run tunnel:start` | Inicia el túnel (requiere app en :8080) |
| `npm run tunnel:stop` | Detiene procesos cloudflared |
| `npm run tunnel:platform` | Vite + túnel en un solo script |
| `npm start` | Solo la app en :8080 |

---

## Servicio Windows 24/7

Ejecutar **PowerShell como Administrador**:

```powershell
cd C:\proyectos\logitrainerstudio
.\scripts\install-tunnel-service.ps1
```

La app debe estar siempre en `:8080` (por ejemplo con `npm start` en otro servicio o PM2).

Comandos del servicio:

```bat
sc query cloudflared
sc stop cloudflared
sc start cloudflared
```

---

## Variables de entorno opcionales (`.env.local`)

```env
# Hostname del túnel (detección en el frontend)
VITE_TUNNEL_HOST=studio.logitrainerstudio.com
VITE_TUNNEL_PUBLIC_URL=https://studio.logitrainerstudio.com

# Scripts de setup (PowerShell)
CLOUDFLARE_TUNNEL_NAME=logitrainer-studio
CLOUDFLARE_TUNNEL_HOST=studio.logitrainerstudio.com
```

---

## Cloudflare Access (opcional, capa extra)

1. [Zero Trust](https://one.dash.cloudflare.com/) → **Access** → **Applications**
2. Añade aplicación self-hosted: `studio.logitrainerstudio.com`
3. Política: email OTP o lista de correos del equipo
4. El login `/studio` sigue siendo la segunda capa con la contraseña LTS

---

## Estructura de archivos

```
.cloudflared/
  config.yml.example   # Plantilla
  config.yml           # Generado por setup (gitignored)
  <tunnel-uuid>.json   # Credenciales (gitignored)
scripts/
  install-cloudflared.bat / .ps1
  setup-tunnel.ps1
  start-tunnel.bat / .ps1
  stop-tunnel.bat / .ps1
  install-tunnel-service.ps1
  write-tunnel-info.mjs
src/pages/StudioHub.tsx   # Login + dashboard
src/lib/studioHub.ts      # Sesión + detección túnel
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `cloudflared` no reconocido | Cierra y abre la terminal, o ejecuta `npm run tunnel:install` |
| Error 502 en el túnel | Comprueba que `npm start` escucha en **8080** |
| DNS no resuelve | En Cloudflare DNS, CNAME `studio` → `<id>.cfargotunnel.com` (proxy ON) |
| Login ok pero app bloqueada | Misma contraseña activa `localStorage`; prueba ventana privada |
| `config.yml` no existe | Ejecuta `npm run tunnel:setup` de nuevo |

---

## Acceso desde cualquier dispositivo

1. Asegúrate de que el PC con el proyecto tiene `npm start` y el túnel activos.
2. Abre **https://studio.logitrainerstudio.com/studio**
3. Contraseña: `LTS-Mayo2026-7kQ!`
4. En el dashboard: **App principal**, **Demo** o **Producción (Vercel)**.
