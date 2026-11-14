# OptimizaCortes

Optimizador de cortes para tableros de madera, vidrio u otros materiales planos. Dado un conjunto de tableros y piezas requeridas, calcula la distribución óptima de cortes minimizando el desperdicio de material.

## Funcionalidad

- **Tableros**: define uno o más tableros con dimensiones, material y cantidad.
- **Piezas**: agrega las piezas que necesitas cortar con ancho, alto, cantidad y si se permiten rotaciones.
- **Canteado**: marca en cada pieza qué lados llevan canto pegado (superior, derecho, inferior, izquierdo) y obtén los metros lineales totales.
- **Configuración**: ajusta el grosor de la cuchilla (sierra), la unidad de medida (mm, cm, pulgadas), el algoritmo y el orden de las piezas.
- **Optimización**: el algoritmo distribuye automáticamente las piezas sobre los tableros disponibles.
- **Visualización**: el resultado se muestra en un canvas interactivo con cada tablero y sus cortes etiquetados; los cantos se resaltan en color ámbar.
- **Estadísticas**: panel de resumen con área usada, área total, eficiencia, desperdicio y canto total.

## Algoritmos

La app incluye dos algoritmos de bin-packing seleccionables desde la configuración:

### Guillotine — Best Area Fit
1. Las piezas se ordenan de mayor a menor área.
2. Para cada pieza se busca el espacio libre con menor área sobrante (mejor ajuste).
3. Al colocar una pieza, el espacio restante se divide en dos rectángulos libres (corte en guillotina).

### Maximal Rectangles — Best Short Side Fit
1. Mantiene un conjunto de todos los rectángulos libres maximales.
2. Puntúa cada candidato como `min(ancho sobrante, alto sobrante)` — minimiza el desperdicio del lado más corto.
3. Tras cada colocación divide los rectángulos afectados en cuatro fragmentos y poda los contenidos en otros.

### Modo Auto
En modo *Auto* (predeterminado) ambos algoritmos se ejecutan y se usa el resultado con mayor eficiencia promedio.

## Canteado (edge banding)

Cada pieza puede llevar canto pegado en cualquier combinación de sus cuatro lados.
Se configura al agregarla o después, desde la lista de piezas (botón **Canto**):

- **Selector visual**: un rectángulo con los cuatro lados clicables, dibujado con la proporción real de la pieza.
- **Atajos**: *Todos*, *Ninguno*, *Largos* (superior/inferior) y *Cortos* (izquierdo/derecho).
- **Rotación**: si el optimizador gira una pieza 90°, los cantos giran con ella (sup → der → inf → izq). Las longitudes se conservan, por lo que el total no cambia.
- **Metros lineales**: se muestran por pieza, por tablero y en el total del proyecto. El resumen y el PDF incluyen una tabla de canteado por pieza con lados y metros.
- **En el layout**: los lados con canto se dibujan como una línea gruesa ámbar, tanto en el canvas como en el PDF.

El canto no consume material del tablero: es información de producción para el taller.

## Orden de las piezas

En *Config → Orden de piezas*:

- **Automático (por área)** — coloca primero las piezas más grandes; suele dar mejor aprovechamiento.
- **Manual (orden de la lista)** — respeta la prioridad que definas. Reordena con el handle ⠿ o con los botones ↑ / ↓ del detalle de cada pieza (útil en pantallas táctiles, donde el drag-and-drop no funciona).

## Stack tecnológico

- React 19 + TypeScript (strict)
- Vite 8
- Vitest 4 + Testing Library (tests unitarios del algoritmo)
- CSS Modules (sin frameworks de estilos)
- Sin librerías de estado externas — estado global en `useCutStore`

## Estructura del proyecto

```
src/
├── algorithms/
│   ├── guillotine.ts       # Guillotine bin-packing (Best Area Fit)
│   ├── maxrects.ts         # Maximal Rectangles bin-packing (BSSF)
│   └── guillotine.test.ts  # Tests unitarios
├── components/
│   ├── EdgeSelector.tsx    # Selector visual de cantos
│   ├── Canvas/
│   │   ├── CutCanvas.tsx   # Renderizado del layout en HTML5 Canvas
│   │   └── SummaryPanel.tsx# Estadísticas de eficiencia
│   └── Sidebar/
│       ├── BoardForm.tsx   # Formulario para agregar tableros
│       ├── BoardList.tsx   # Lista de tableros
│       ├── PieceForm.tsx   # Formulario para agregar piezas
│       ├── PieceList.tsx   # Lista de piezas (canto, orden, cantidad)
│       ├── SettingsPanel.tsx # Configuración (cuchilla, unidad, algoritmo)
│       └── Sidebar.tsx     # Contenedor del panel lateral
├── store/
│   └── cutStore.ts         # Estado global (tableros, piezas, solución, ajustes)
├── utils/
│   ├── edges.ts            # Lógica de canteado (giro, longitudes, resúmenes)
│   ├── generatePdf.ts      # Reporte PDF
│   └── pieceColor.ts       # Color consistente por dimensión
└── types/
    └── index.ts            # Board, Piece, PieceEdges, PlacedPiece, CutResult, CutSolution, AppSettings
```

## Roadmap

### Implementado
- [x] Algoritmo guillotine bin-packing con heurística Best Area Fit
- [x] Visualización del layout en canvas HTML5
- [x] Panel de resumen con estadísticas de eficiencia
- [x] Exportar reporte en PDF (layout por tablero, tablas de piezas y estadísticas)
- [x] Deploy automático en GitHub Pages vía GitHub Actions
- [x] **Persistencia en localStorage** — los datos sobreviven al recargar la página
- [x] **Exportar / importar proyecto como JSON** — guardar y compartir proyectos
- [x] **Diseño responsive** — sidebar deslizable en móvil (≤ 640px)
- [x] **Validación de formularios** — mensajes de error en JS para dimensiones inválidas
- [x] **Undo / Redo (Ctrl+Z / Ctrl+Y)** — historial de hasta 30 acciones en el store
- [x] **Visualizar desperdicio en el canvas** — trama diagonal sobre zonas sin corte
- [x] **Colores consistentes por dimensión** — misma pieza = mismo color en canvas, lista y PDF

- [x] **Maximal Rectangles (MaxRects)** — segundo algoritmo con heurística Best Short Side Fit
- [x] **Múltiples estrategias de optimización** — selector Guillotine / MaxRects / Auto en configuración; modo Auto ejecuta ambos y elige el de mayor eficiencia
- [x] **Reordenar piezas con drag-and-drop** — arrastra el handle ⠿ para priorizar qué piezas se colocan primero
- [x] **Canteado por pieza** — selección de lados con canto, giro automático al rotar, metros lineales y render en canvas/PDF
- [x] **Orden de piezas configurable** — automático por área o manual según la lista (con botones ↑ ↓ para táctil)
- [x] **Solución invalidada al editar** — si cambias tableros, piezas o ajustes el layout anterior se descarta para no mostrar datos obsoletos
- [x] **Undo/redo en ediciones** — también cubre cambios de cantidad, cantos y reordenamientos
- [x] **Piezas faltantes con cantidad** — el aviso y el PDF indican cuántas unidades de cada pieza no se colocaron

### Próximos pasos
- [ ] Secuencia de cortes por tablero (lista de cortes para el taller)
- [ ] Compensar el espesor del canto en la dimensión de corte (pieza final = corte + canto)
- [ ] Unidades reales: convertir dimensiones al cambiar mm/cm/pulgadas (hoy la unidad es solo de etiqueta)
- [ ] Costeo: precio por m² de tablero y por metro de canto
- [ ] Varias estrategias de empaque por tablero (no solo el orden de piezas)
- [ ] Exportar/importar CSV además de JSON

## Uso

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Ejecutar tests
npm test

# Build de producción
npm run build
```
