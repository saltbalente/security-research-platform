# 🚀 Guía de Deploy en Vercel

## Optimizaciones Implementadas

### ⚡ Configuración para Serverless
- **Timeouts optimizados**: 8 segundos máximo para evitar límites de Vercel
- **Requests paralelos**: FxTwitter API como primera opción (más rápida)
- **Fallback inteligente**: Múltiples métodos de extracción
- **Headers optimizados**: User-Agent compatible con servicios de terceros

### 📁 Archivos Clave
- `vercel.json`: Configuración específica de Vercel
- `src/app/api/extract/route.ts`: API optimizada para serverless
- `.gitignore`: Excluye archivos de base de datos

## 🔧 Pasos para Deploy

### 1. **Conectar Repositorio**
```bash
# Asegúrate de que los cambios estén en GitHub
git push origin main
```

### 2. **Deploy en Vercel**
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu cuenta de GitHub
3. Importa el repositorio `security-research-platform`
4. Vercel detectará automáticamente que es un proyecto Next.js

### 3. **Configuración Automática**
Vercel usará automáticamente:
- `vercel.json` para configuración de funciones
- `package.json` para dependencias
- Next.js 15.3.3 con App Router

### 4. **Variables de Entorno** (Opcional)
Si necesitas configurar variables:
```bash
# En el dashboard de Vercel > Settings > Environment Variables
NODE_ENV=production
```

## 🌐 URLs de Producción

Una vez deployado, tendrás:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **API**: `https://tu-proyecto.vercel.app/api/extract`

## 🧪 Pruebas Post-Deploy

### Probar la API:
```bash
curl -X POST https://tu-proyecto.vercel.app/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://x.com/i/status/1936147829518459380"}'
```

### Respuesta esperada:
```json
{
  "id": "1936147829518459380",
  "title": "Video de X/Twitter",
  "variants": [
    {
      "url": "https://video.twimg.com/...",
      "quality": "HD",
      "resolution": "720p",
      "contentType": "video/mp4"
    }
  ]
}
```

## 🔍 Troubleshooting

### Error: "Function Timeout"
- Las funciones están optimizadas para 8-10 segundos
- Si persiste, el servicio externo puede estar lento

### Error: "CORS"
- Ya configurado en `vercel.json`
- Verifica que la URL sea correcta

### Error: "Build Failed"
- Ejecuta `npm run build` localmente
- Verifica que no haya errores de TypeScript

## 📊 Monitoreo

En el dashboard de Vercel puedes ver:
- **Logs de funciones**: Errores y rendimiento
- **Analytics**: Uso de la aplicación
- **Deployments**: Historial de despliegues

## 🎯 Diferencias vs Local

### Ventajas en Producción:
- ✅ **CDN Global**: Más rápido mundialmente
- ✅ **Auto-scaling**: Maneja múltiples requests
- ✅ **HTTPS**: Seguridad automática
- ✅ **Caching**: Respuestas más rápidas

### Limitaciones:
- ⏱️ **Timeout**: Máximo 10 segundos por función
- 🔄 **Cold Start**: Primera request puede ser más lenta
- 📦 **Tamaño**: Límite de 50MB por función

## 🚀 Deploy Exitoso

Si todo funciona correctamente, deberías ver:
1. ✅ Build exitoso en Vercel
2. ✅ Aplicación accesible en la URL de producción
3. ✅ API respondiendo correctamente
4. ✅ Extracción de videos funcionando

¡Tu aplicación está lista para producción! 🎉 