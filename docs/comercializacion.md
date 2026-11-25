# Publicación y comercialización de OptimizaCortes

Plan de trabajo para publicar el sitio con dominio propio y convertirlo en un producto que genere ingresos. Está pensado para un proyecto de una sola persona, con costo inicial bajo y posibilidad de crecer por fases.

---

## 1. Situación actual

| Aspecto | Estado |
| --- | --- |
| Tipo de app | 100 % frontend (React + Vite), sin backend ni base de datos |
| Datos | `localStorage` del navegador (un solo proyecto por dispositivo) |
| Exportación | PDF con jsPDF, JSON del proyecto |
| Deploy | GitHub Pages automático desde `main` |
| URL | `https://<usuario>.github.io/optimizaCortes/` |
| Base de Vite | `base: '/optimizaCortes/'` |
| Costo actual | $0 |

Consecuencias importantes:

- **No hay cuentas ni sincronización.** Si el usuario borra datos del navegador, pierde el proyecto.
- **No se puede cobrar ni limitar el uso** de forma confiable solo con el frontend.
- **GitHub Pages no está pensado para SaaS comercial.** Su política de uso dice que no debe usarse como hosting gratuito para un negocio, tienda o SaaS. Sirve para demo, portafolio y página de marketing; para el producto conviene otro hosting.

---

## 2. Decisión clave: qué vas a vender

Antes de elegir hosting hay que elegir el modelo. Las opciones realistas:

### A. Freemium SaaS (recomendada)

Gratis con límites (1 proyecto, 20–30 piezas, PDF con marca de agua) y plan Pro por suscripción. Requiere cuentas y backend, pero es el modelo con ingresos recurrentes y el más fácil de explicar.

- **Ventaja:** ingresos recurrentes, actualizaciones continuas, métricas claras.
- **Costo:** backend, autenticación, pagos y soporte.
- **Esfuerzo:** alto (4–8 semanas para una versión cobrable).

### B. Licencia de pago único (sin cuentas)

La app sigue siendo estática; el plan Pro se desbloquea con una clave de licencia comprada en Paddle, Lemon Squeezy o Gumroad.

- **Ventaja:** se lanza en días, sin backend, sin datos personales, sin soporte de cuentas.
- **Riesgo:** la validación de licencia en el navegador es reversible; alguien decidido puede saltarla. Para un nicho pequeño suele ser aceptable.
- **Esfuerzo:** bajo (1–2 semanas).

### C. Venta B2B / marca blanca

Vender la herramienta a madererías, cocinas integrales o distribuidores de tableros, con su logo y su catálogo de materiales. Cobro por licencia anual o por instalación.

- **Ventaja:** tickets altos, pocos clientes, poca adquisición.
- **Riesgo:** venta consultiva, ciclos largos, requiere contacto directo y facturación.
- **Esfuerzo:** medio-alto en ventas, bajo en producto.

### D. Gratis con publicidad, donaciones o patrocinio

No se cobra al usuario; se monetiza con anuncios, afiliados de ferreterías o patrocinio de marcas de tableros.

- **Ventaja:** máxima adopción.
- **Riesgo:** ingresos bajos y dependientes de tráfico; los anuncios molestan en una herramienta técnica.
- **Esfuerzo:** bajo, pero no es un negocio por sí solo.

**Recomendación:** empezar por **B** (lanzar y validar que la gente paga) y migrar a **A** cuando haya tracción. La arquitectura actual permite hacer B sin tocar casi nada; A se construye encima después.

---

## 3. Alternativas de hosting

| Opción | Costo típico | Dominio propio | Backend | ¿Permite uso comercial? | Dificultad | Cuándo usarla |
| --- | --- | --- | --- | --- | --- | --- |
| **GitHub Pages** | $0 | Sí (CNAME) | No | **No para SaaS/tienda** | Muy baja | Demo, portafolio, landing temporal |
| **Cloudflare Pages** | $0 – ~$20 USD/mes | Sí, SSL gratis | Functions + Workers, D1, R2 | Sí | Baja | **Recomendada** para el producto estático y luego API |
| **Vercel** | $0 (Hobby, no comercial) / ~$20 USD/mes Pro | Sí | Serverless functions | Hobby solo uso personal; Pro comercial | Baja | Si quieres Next.js o previews por rama |
| **Netlify** | $0 – ~$19 USD/mes | Sí | Functions, Identity | Sí | Baja | Alternativa directa a Vercel |
| **Hostinger / Namecheap (hosting compartido)** | ~$3–10 USD/mes | Sí | PHP/Node limitado | Sí | Media | Si además quieres correo y WordPress para el blog |
| **VPS (Hetzner, DigitalOcean)** | ~$5–12 USD/mes | Sí | Total control | Sí | Alta | Cuando necesites control, workers o base de datos propia |
| **Supabase / Firebase (solo backend)** | $0 – ~$25 USD/mes | N/A | Auth, DB, storage | Sí | Media | Complemento del hosting estático para cuentas y proyectos |

Notas:

- **Cloudflare Pages** en plan Free incluye ancho de banda ilimitado, SSL, 500 builds/mes y 100 dominios personalizados por proyecto; es la mejor relación costo/beneficio para esta app.
- **Vercel Hobby** es para uso personal y no comercial; para vender hay que pasar a Pro.
- Un VPS solo tiene sentido si necesitas procesos largos (por ejemplo, optimización con miles de piezas en servidor) o control fino.

### Recomendación de arquitectura por fase

```
Fase 1 (hoy)      Cloudflare Pages  →  React estático + dominio propio
Fase 2 (validar)  Cloudflare Pages  →  + licencias (Paddle/Lemon Squeezy)
Fase 3 (escalar)  Cloudflare Pages  →  + Supabase (auth, proyectos) + Stripe
Fase 4 (opcional) Worker/API propia para cálculos pesados o reportes
```

---

## 4. Pasos detallados

### Fase 0 — Preparación (1–2 días)

1. **Definir propuesta de valor en una frase.** Ejemplo: "Calcula el corte de melamina en segundos y ahorra hasta 20 % de tablero".
2. **Elegir nombre comercial y dominio.** Opciones: `optimizacortes.com`, `optimizacortes.mx`, `cortespro.app`. Verificar disponibilidad en Namecheap, Cloudflare Registrar o Hostinger.
3. **Comprar el dominio.** Costo típico: ~$10–15 USD/año (`.com`) o ~$300–500 MXN/año (`.com.mx`).
4. **Decidir el modelo** (sección 2) y el precio inicial.
5. **Revisar la política de GitHub Pages** y aceptar que el producto vivirá en otro host.

### Fase 1 — Publicar con dominio propio (2–4 días)

1. **Cambiar la base de Vite** para servir desde la raíz del dominio:

   ```ts
   // vite.config.ts
   export default defineConfig({
     base: '/',
     // ...
   })
   ```

2. **Probar el build local:**

   ```bash
   npm run build
   npm run preview
   ```

3. **Crear el proyecto en Cloudflare Pages** conectado al repositorio de GitHub:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 20 o superior
4. **Agregar el dominio personalizado** en Cloudflare Pages y apuntar el DNS (CNAME a `pages.dev` o nameservers de Cloudflare). El certificado SSL se emite solo.
5. **Actualizar el workflow de GitHub Actions** si quieres conservar GitHub Pages como espejo/demo, o desactivarlo para evitar dos versiones. Si se queda, mantener `base` condicional por variable de entorno.
6. **Agregar metadatos y landing:**
   - `<title>`, `<meta name="description">`, Open Graph e imagen social en `index.html`.
   - `robots.txt` y `sitemap.xml`.
   - Favicon propio.
7. **Instalar analítica:** Plausible (~$9 USD/mes), Umami Cloud (plan gratis) o Cloudflare Web Analytics (gratis). Medir visitas, uso de "Optimizar" y exportaciones.
8. **Páginas legales mínimas:** aviso de privacidad, términos y condiciones, y contacto. En México son exigibles si recolectas datos (aunque sea un correo).
9. **Verificar en móvil real** y con Lighthouse (rendimiento, accesibilidad, SEO).

### Fase 2 — Cobrar sin backend (1–2 semanas)

Objetivo: validar disposición de pago con el mínimo esfuerzo.

1. **Definir límites del plan Free**, por ejemplo:
   - 1 proyecto guardado.
   - Hasta 30 piezas o 3 tableros.
   - PDF con marca de agua y sin plan de corte secuencial.
2. **Implementar el bloqueo en la UI** (límites y marca de agua). No es seguridad, es producto.
3. **Elegir pasarela:**
   - **Paddle o Lemon Squeezy:** actuar como *merchant of record*, se encargan de impuestos y facturación internacional. Comisión típica ~5 % + $0.50 USD por transacción.
   - **Stripe México:** ~3.6 % + $3 MXN por tarjeta nacional, +0.5 % internacional. Más barato, pero tú gestionas impuestos y facturación.
   - **Mercado Pago:** útil para clientes sin tarjeta internacional y pagos en efectivo/OXXO.
4. **Crear el producto** (licencia o suscripción), la página de precios y el flujo de compra.
5. **Implementar activación por clave de licencia** (si es pago único): validar contra la API de la pasarela al ingresar la clave y guardar el estado en `localStorage`.
6. **Probar el flujo completo** con una compra real de bajo monto y reembolso.
7. **Publicar precio de lanzamiento** y un cupón para los primeros usuarios.

### Fase 3 — Cuentas y sincronización (4–8 semanas)

1. **Crear proyecto en Supabase** (o Firebase): autenticación con email/Google, tabla `projects` con `user_id`, `name`, `data` (JSON) y `updated_at`.
2. **Migrar el store** para leer/escribir proyectos en la nube cuando hay sesión, y seguir usando `localStorage` como caché offline.
3. **Suscripciones con Stripe Billing** (o Mercado Pago Suscripciones): planes mensual/anual, portal de cliente, webhooks para activar/desactivar Pro.
4. **Límites por plan aplicados en servidor** (no solo en UI): número de proyectos, piezas y exportaciones.
5. **Compartir proyecto por enlace** con permisos de solo lectura.
6. **PWA** con `vite-plugin-pwa` para instalar y trabajar offline.
7. **Soporte:** correo o formulario, preguntas frecuentes y una guía de inicio de 3 pasos.

### Fase 4 — Adquisición y ventas (continuo)

1. **SEO:** una página por intención de búsqueda:
   - "optimizador de cortes de melamina"
   - "cómo calcular cortes de MDF"
   - "programa para cortar tableros"
   - "calculadora de corte de cocina"
2. **Contenido:** 2–3 videos cortos por semana mostrando un antes/después de desperdicio; publicarlos en YouTube Shorts, TikTok y grupos de carpinteros de Facebook.
3. **Alianzas:** madererías y distribuidores de tableros que puedan recomendar la herramienta a sus clientes; ofrecerles comisión o marca blanca.
4. **Prueba social:** casos reales con m² ahorrados y pesos ahorrados.
5. **Email:** capturar correo con una plantilla gratuita ("checklist de corte") y enviar novedades.
6. **Publicidad de bajo presupuesto:** Google Ads en búsquedas exactas, ~$100–300 USD/mes, solo después de validar conversión orgánica.
7. **Medir:** visita → registro → proyecto creado → optimización → exportación → pago. Optimizar el embudo, no solo el tráfico.

---

## 5. Costos estimados

| Concepto | Costo aproximado |
| --- | --- |
| Dominio `.com` | $10–15 USD/año |
| Cloudflare Pages | $0 (plan Free) |
| Supabase | $0 – $25 USD/mes |
| Analítica | $0 – $9 USD/mes |
| Correo transaccional (Resend/Postmark) | $0 – $20 USD/mes |
| Pasarela | 3.6 % + $3 MXN (Stripe MX) o ~5 % + $0.50 USD (Paddle/Lemon Squeezy) |
| Publicidad inicial | $0 – $300 USD/mes |
| Constitución de empresa / RFC | Variable; puedes iniciar como persona física con actividad empresarial |

Costo mínimo realista para lanzar y operar: **~$15–40 USD/mes** sin publicidad.

---

## 6. Precios sugeridos (punto de partida)

| Plan | Precio | Incluye |
| --- | --- | --- |
| Free | $0 | 1 proyecto, hasta 30 piezas, PDF con marca de agua |
| Pro | $99–149 MXN/mes o $990–1,490 MXN/año | Proyectos ilimitados, sin marca de agua, plan de corte, costos y ahorro |
| Taller | $249–399 MXN/mes | 3–5 usuarios, catálogo de materiales, soporte prioritario |

Anual con 2 meses gratis suele mejorar la caja y reduce cancelaciones. Ajusta con base en lo que cobran MaxCut, CutList Plus y CutList Optimizer en tu mercado; no compitas por precio, compite por facilidad de uso en español y por el reporte para el taller.

---

## 7. Legal y operación en México

- **Aviso de privacidad** conforme a la LFPDPPP (qué datos recabas, para qué, cómo ejercer derechos ARCO).
- **Términos y condiciones** (uso permitido, límites de responsabilidad, reembolsos).
- **Facturación:** si vendes a empresas, necesitarás RFC y CFDI 4.0; las pasarelas emiten comprobantes, pero la factura fiscal es tuya.
- **Registro de marca** ante el IMPI si el nombre va en serio (~$2,500–3,000 MXN, varias clases).
- **Impuestos:** IVA en ventas digitales; revisa el régimen (RESICO puede ser suficiente al inicio) con un contador.
- **Datos de usuarios:** minimiza lo que guardas; si usas Supabase, define retención y borrado de cuenta.

---

## 8. Checklist de lanzamiento

- [ ] Dominio comprado y apuntando al hosting
- [ ] `base: '/'` y build verificado
- [ ] Landing con propuesta de valor, capturas y demo
- [ ] Página de precios y preguntas frecuentes
- [ ] Analítica y eventos de conversión
- [ ] Aviso de privacidad y términos
- [ ] Flujo de pago probado con compra real
- [ ] Correo de soporte y de bienvenida
- [ ] Lighthouse ≥ 90 en rendimiento y accesibilidad
- [ ] Prueba en móvil, tablet y escritorio
- [ ] Backup del proyecto (JSON) y del repositorio
- [ ] Plan de contenido para las primeras 4 semanas

---

## 9. Métricas a vigilar

| Métrica | Meta inicial |
| --- | --- |
| Visitas/mes | 500 |
| Visitas → proyecto creado | ≥ 25 % |
| Proyecto → optimización | ≥ 60 % |
| Free → Pro | 2–5 % |
| Cancelación mensual | < 8 % |
| Ingreso recurrente mensual (MRR) | $1,000 MXN a los 3 meses |

---

## 10. Riesgos y cómo mitigarlos

| Riesgo | Mitigación |
| --- | --- |
| Licencia de pago único fácil de saltar | No es seguridad crítica; migrar a SaaS cuando el volumen lo justifique |
| GitHub Pages no permite SaaS comercial | Migrar a Cloudflare Pages antes de cobrar |
| Competencia gratuita (CutList Optimizer) | Diferenciarse por español, reporte de taller, costos y soporte local |
| Poca disposición de pago en carpinteros independientes | Precio bajo + plan anual + valor demostrable en ahorro de tablero |
| Soporte consume tiempo | FAQ, videos y límites claros; soporte solo por correo |
| Dependencia de una sola pasarela | Stripe + Mercado Pago, o Paddle como respaldo |
| Pérdida de datos del usuario | Exportar JSON visible, y nube en fase 3 |
