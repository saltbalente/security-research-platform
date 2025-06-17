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

1.  **Clonar el repositorio (si aplica) o tener los archivos del proyecto.**

2.  **Instalar dependencias:**
    ```bash
    npm install
    # o
    # yarn install
    # o
    # pnpm install 
    ```

3.  **Configurar la base de datos SQLite:**
    Los archivos de migración se generan basados en `src/db/schema.ts`.
    ```bash
    # Generar archivos de migración (si hay cambios en el schema)
    npm run db:generate

    # Aplicar migraciones a la base de datos (creará sqlite.db si no existe)
    npm run db:migrate
    ```

4.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    # o
    # yarn dev
    # o
    # pnpm dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

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
