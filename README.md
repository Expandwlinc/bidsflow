# BidsFlow — CRM de licitaciones de PanamaCompra

CRM interno para darle seguimiento a las licitaciones publicadas en [panamacompra.gob.pa](https://www.panamacompra.gob.pa/), el sistema electrónico de contrataciones públicas de Panamá.

## Qué incluye

- **Portal de descubrimiento**: licitaciones cargadas automáticamente por el scraper (o manualmente), donde el equipo marca cuáles interesan.
- **Pipeline de oportunidades**: `Interesado → En preparación → Propuesta enviada → Ganada / Perdida / Descartada`.
- **Por oportunidad**: montos e historial de cambios, gestor de tareas (con requisitos generados desde el análisis de IA), documentos, notas del equipo, log de actividad, fechas clave y recordatorios.
- **Análisis con IA** (Claude Opus 5): sube o pega el pliego de cargos y obtén un resumen, un checklist de requisitos, un análisis legal de cláusulas riesgosas y un análisis técnico buscando posibles señales de **direccionamiento** en las especificaciones.
- **Roles**: `ADMIN` (acceso completo, gestión de usuarios y del scraper) y `VENDEDOR` (acceso operativo, sin administración).
- **Autenticación en dos pasos (TOTP)**: cada usuario puede activar, desde "Mi cuenta", un código de autenticación generado por apps como Google Authenticator o Authy (escaneando un QR). Una vez activado, el login pide ese código además de la contraseña.
- **Scraper automático diario** vía GitHub Actions, con fuente primaria en el formato de datos abiertos OCDS de PanamaCompraenCifras.

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Configuración local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env` y ajusta las variables (ver tabla abajo). Como mínimo necesitas `DATABASE_URL` apuntando a un Postgres accesible.

3. Aplica las migraciones y crea el usuario admin inicial:

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

   Esto crea un usuario admin con el correo/contraseña definidos en `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (cámbiala después del primer login).

4. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión a PostgreSQL. |
| `NEXTAUTH_SECRET` | Sí | Secreto para firmar las sesiones (genera uno con `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Sí en producción | URL pública de la app. |
| `ANTHROPIC_API_KEY` | Para el análisis IA | API key de Anthropic. Sin esto, la pestaña "Análisis IA" mostrará un error controlado al intentar analizar un pliego. |
| `CRON_SECRET` | Para el scraper automático | Token bearer que protege `POST /api/cron/scrape`. Debe coincidir con el secret `CRON_SECRET` configurado en GitHub Actions. |
| `OCDS_BASE_URL` | No | Dominio base de la fuente de datos abiertos OCDS de PanamaCompraenCifras. Ver advertencia abajo. |
| `PORTAL_LIVE_SCRAPER_ENABLED` | No | `"true"` para habilitar el conector experimental del portal en vivo (deshabilitado por defecto). |

## ⚠️ Notas importantes sobre el scraper

El scraper tiene dos conectores (`lib/scrapers/`):

1. **`OcdsBulkConnector` (primario)**: usa la descarga masiva en formato **OCDS** de PanamaCompraenCifras — la fuente de datos abiertos oficial. Se actualiza semanalmente. El dominio configurado por defecto (`ocdsv2dev.panamacompraencifras.gob.pa`) es el que se observó durante el desarrollo y **parece ser un entorno de pruebas, no necesariamente el de producción** — verifícalo antes de depender de él en producción.
2. **`PortalLiveConnector` (experimental, deshabilitado por defecto)**: intenta leer el buscador del portal transaccional (`www.panamacompra.gob.pa`) para tener mayor frescura en procesos "en curso". **No pudo verificarse su HTML real durante el desarrollo** (las solicitudes salientes al dominio devolvieron 403, posiblemente por geo-bloqueo o protección anti-bot). Sus selectores CSS son de mejor esfuerzo — ajústalos en `lib/scrapers/portal-live-connector.ts` tras inspeccionar el HTML real, y luego habilítalo con `PORTAL_LIVE_SCRAPER_ENABLED=true`.

Como red de seguridad, siempre puedes agregar licitaciones manualmente desde **Portal → Agregar manualmente**, sin depender de que el scraping automático funcione perfecto desde el primer día.

Un administrador puede disparar el scraper manualmente desde **Admin → Scraper → Actualizar ahora**, y ver el historial de corridas (éxito/error, cuántas licitaciones nuevas/actualizadas) ahí mismo.

### Actualización diaria automática

El workflow `.github/workflows/daily-scrape.yml` llama a `POST /api/cron/scrape` todos los días. Configura estos secrets en el repositorio de GitHub:

- `APP_URL`: URL pública de la app desplegada (ej. `https://bidsflow.tuempresa.com`).
- `CRON_SECRET`: el mismo valor que `CRON_SECRET` en el entorno de la app.

## Almacenamiento de documentos

Los documentos subidos (pliegos, propuestas, garantías, etc.) se guardan por defecto en disco local, bajo `/uploads` (fuera del control de versiones). La interfaz `StorageDriver` en `lib/storage.ts` está diseñada para poder cambiarse por un driver de S3 (u otro) en producción sin tocar el resto del código.

## Recordatorios

Los recordatorios y fechas clave son solo en la aplicación (no se envían correos) en esta primera versión — se muestran en la barra lateral de cada oportunidad. Agregar notificaciones por correo es una mejora natural para una siguiente iteración.

## Estructura del proyecto

```
app/(app)/            páginas autenticadas: portal, oportunidades, admin
app/api/cron/scrape/   endpoint protegido que corre el scraper
app/api/documents/     descarga de documentos subidos
lib/actions/           Server Actions (mutaciones)
lib/scrapers/          conectores del scraper + runner
lib/ai/                extracción de texto + análisis con Claude Opus 5
lib/auth.config.ts     config de NextAuth "edge-safe" (usada por proxy.ts)
lib/auth.ts            config completa de NextAuth (credentials + Prisma)
prisma/schema.prisma   modelo de datos
```
