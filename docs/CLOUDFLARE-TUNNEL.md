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

## Publicar en trycloudflare.com (Quick Tunnel)

Un comando publica la app y configura persistencia local:

```powershell
cd C:\proyectos\logitrainerstudio
npm run publish:trycloudflare
```

- URL actual: `TRYCLOUDFLARE-URL.txt` y `.cloudflared\quick-tunnel-url.txt`
- Tareas: `LogiTrainerStudio-TunnelStack` (al iniciar sesión) + `LogiTrainerStudio-TunnelWatchdog` (cada 5 min)
- E2E: `npm run tunnel:verify`

Según [Cloudflare Quick Tunnels](https://trycloudflare.com/), la URL es **efímera** si reinicias `cloudflared`; mientras el proceso siga activo en tu PC, la URL se mantiene.

## Instalación rápida (Windows)

### Opción A — Comandos Cloudflare (manual)

PowerShell (Admin solo para `winget install`):

```powershell
# 1) Instalar cloudflared
winget install --id Cloudflare.cloudflared

# 2) Login (abre el navegador — elige logitrainerstudio.com)
cloudflared tunnel login

# 3) Crear túnel
cloudflared tunnel create logitrainer-studio

# 4) DNS público (subdominio)
cloudflared tunnel route dns logitrainer-studio studio.logitrainerstudio.com

# 5) App local en otra terminal
cd C:\proyectos\logitrainerstudio
npm start

# 6) Iniciar túnel (usa config del proyecto)
cloudflared tunnel --config .cloudflared\config.yml run logitrainer-studio
```

Tras el paso 3, ejecuta **una vez** `scripts\tunnel-cloudflare-cli.ps1` o `npm run tunnel:setup` para generar `.cloudflared\config.yml` (ingress → `localhost:8080`).

### Opción B — Script automático

```bat
cd C:\proyectos\logitrainerstudio
scripts\tunnel-cloudflare-cli.bat
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

## Túnel persistente 24/7 (recomendado)

1. **Login** (una vez): `scripts\open-cloudflare-login.bat` o `cloudflared tunnel login`
2. **Instalar servicio + tarea Vite** (PowerShell **como Administrador**):

```powershell
cd C:\proyectos\logitrainerstudio
npm run tunnel:persistent
```

Esto registra:
- Servicio Windows `cloudflared` (arranque automático → `studio.logitrainerstudio.com`)
- Tarea `LogiTrainerStudio-Vite` (`npm start` al iniciar sesión)

## Servicio Windows (solo túnel)

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
| Ventana negra vacía (System32) | Tarea `LogiTrainerStudio-TunnelStack` abría PowerShell visible. **Solución:** doble clic en `scripts\disable-local-tunnel-admin.bat` (acepta UAC) o `npm run tunnel:disable:admin`. Luego `npm run tunnel:silence` si quieres túnel sin ventanas. |
| `config.yml` no existe | Ejecuta `npm run tunnel:setup` de nuevo |

---

## Acceso desde cualquier dispositivo

1. Asegúrate de que el PC con el proyecto tiene `npm start` y el túnel activos.
2. Abre **https://studio.logitrainerstudio.com/studio**
3. Contraseña: `LTS-Mayo2026-7kQ!`
4. En el dashboard: **App principal**, **Demo** o **Producción (Vercel)**.
