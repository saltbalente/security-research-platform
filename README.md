# Security Research Platform

Este es un prototipo educativo para analizar URLs de videos de Instagram y X (anteriormente Twitter) en busca de posibles vulnerabilidades de seguridad.

## Tecnologías Usadas

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Drizzle ORM (con SQLite)
- (Próximamente) yt-dlp para extracción de video

## Configuración y Ejecución

### Desarrollo Local

1.  **Clonar el repositorio:**
    ```bash
    git clone <tu-repositorio>
    cd security-research-platform
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar la base de datos SQLite:**
    ```bash
    # Generar archivos de migración (si hay cambios en el schema)
    npm run db:generate

    # Aplicar migraciones a la base de datos (creará sqlite.db si no existe)
    npm run db:migrate
    ```

4.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

### Deploy en Vercel

1. **Conecta tu repositorio de GitHub con Vercel**
2. **Configuración automática**: Vercel detectará automáticamente que es un proyecto Next.js
3. **Variables de entorno**: No se requieren variables de entorno adicionales para este proyecto
4. **Build automático**: Vercel ejecutará `npm run build` automáticamente

#### Comandos de Build
- **Desarrollo**: `npm run dev`
- **Build de producción**: `npm run build`
- **Servidor de producción**: `npm start`

## Estructura del Proyecto (Resumen)

-   `src/app/`: Páginas principales de la aplicación (usando App Router).
    -   `page.tsx`: Página de inicio para análisis de URL.
    -   `logs/page.tsx`: Página para ver el historial de análisis.
    -   `api/`: Rutas de API.
        -   `extract/route.ts`: Endpoint para extraer información del video.
        -   `logs/route.ts`: Endpoint para gestionar los logs de análisis.
-   `src/components/ui/`: Componentes de UI de shadcn/ui.
-   `src/lib/`: Librerías y utilidades.
    -   `utils.ts`: Utilidades generales (ej: `cn` de shadcn).
    -   `vulnerability-scanner.ts`: Lógica para escanear vulnerabilidades.
-   `src/db/`: Configuración y schema de la base de datos Drizzle.
    -   `schema.ts`: Definición de las tablas de la base de datos.
    -   `index.ts`: Cliente de Drizzle.
-   `drizzle/`: Archivos de migración generados por Drizzle Kit.
-   `drizzle.config.ts`: Configuración para Drizzle Kit.
-   `public/`: Archivos estáticos.

## Funcionalidades Implementadas (Hasta Ahora)

-   Interfaz de usuario para pegar URL y mostrar resultados.
-   Modal de aceptación legal.
-   Servicio de extracción de video (actualmente con datos mock).
-   Escáner de vulnerabilidades (con lógica básica y placeholders).
-   Registro de análisis en base de datos SQLite.
-   Página de historial para ver logs con filtros básicos.

## Próximos Pasos (Pendientes)

-   Integración real de `yt-dlp` en `ExtractorService`.
-   Mejorar la lógica y cobertura del `VulnerabilityScanner`.
    -   Realizar peticiones HTTP para verificar CORS y otros headers.
    -   Analizar metadatos de forma más profunda.
-   Implementar tests (Playwright).
-   Mejorar el manejo de errores y la experiencia de usuario.
-   Considerar la Share Extension (opcional).
-   Asegurar el cumplimiento de todas las consideraciones de seguridad.
