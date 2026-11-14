# OptimizaCortes

Optimizador de cortes para tableros de madera, vidrio u otros materiales planos. Dado un conjunto de tableros y piezas requeridas, calcula la distribución óptima de cortes minimizando el desperdicio de material.

## Funcionalidad

- **Tableros**: define uno o más tableros con dimensiones, material y cantidad.
- **Piezas**: agrega las piezas que necesitas cortar con ancho, alto, cantidad y si se permiten rotaciones.
- **Canteado**: marca en cada pieza qué lados llevan canto pegado (superior, derecho, inferior, izquierdo) y obtén los metros lineales totales.
- **Configuración**: ajusta el grosor de la cuchilla (sierra), la unidad de medida (mm, cm, pulgadas), el algoritmo y el orden de las piezas.
- **Unidades reales**: al cambiar de unidad se convierten tableros, piezas y cuchilla; el área y los metros lineales siempre se reportan en m² y m.
- **Costeo**: precio por m² de tablero y por metro de canto para obtener el costo estimado del proyecto.
- **Optimización**: el algoritmo distribuye automáticamente las piezas sobre los tableros disponibles.
- **Visualización**: el resultado se muestra en un canvas interactivo con cada tablero y sus cortes etiquetados; los cantos se resaltan en color ámbar.
- **Secuencia de cortes**: lista de cortes por panel, lista para el taller, con medida y largo de cada corte.
- **Estadísticas**: panel de resumen con área usada, área total, eficiencia, desperdicio, canto total y costo estimado.

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

## Secuencia de cortes

Con el algoritmo **Guillotine** el optimizador registra cada corte recto que hace
falta para separar las piezas, y el layout muestra la lista de cortes debajo del
canvas (también va en el PDF):

- **Panel**: cada panel recibe un número en el orden en que se corta; muestra su
  medida actual antes del corte.
- **Corte**: orientación (vertical u horizontal y la medida desde el borde
  izquierdo o superior del panel) más el largo del corte.
- **Pieza**: la pieza que queda separada en ese paso.
- Los pasos se ordenan por profundidad: primero los cortes del tablero completo,
  luego los de cada panel ya separado.
- El grosor de la cuchilla ya está descontado en las medidas.

**MaxRects** no produce una secuencia guillotina válida; en ese caso la app lo
indica y sugiere usar Guillotine. El modo *Auto* prefiere Guillotine cuando hay
empate de eficiencia, para que siempre exista una secuencia.

## Unidades

La unidad de medida (mm, cm, pulgadas) se elige en *Config → Unidad*. El valor
capturado se interpreta en esa unidad y al cambiarla se convierten los tableros,
las piezas y el grosor de la cuchilla, sin perder el proyecto.

Independientemente de la unidad, los reportes usan medidas normalizadas:

- **m²** para áreas (tableros, piezas, desperdicio).
- **m** para longitudes lineales (canto).

## Costeo

En *Config → Costos* se definen el precio por m² de tablero y el precio por metro
de canto, más la moneda (MXN, USD, EUR). El resumen y el PDF muestran:

- **Costo de material**: área de los tableros usados —incluido el desperdicio—
  por el precio por m².
- **Costo de canto**: metros lineales totales por el precio por metro.
- **Costo total estimado**.

Si ambos precios quedan en 0 el costeo se oculta. El canto no consume material:
solo suma al costo de producción.

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
│   │   ├── CutSequence.tsx # Lista de cortes para el taller
│   │   └── SummaryPanel.tsx# Estadísticas de eficiencia y costos
│   └── Sidebar/
│       ├── BoardForm.tsx   # Formulario para agregar tableros
│       ├── BoardList.tsx   # Lista de tableros
│       ├── PieceForm.tsx   # Formulario para agregar piezas
│       ├── PieceList.tsx   # Lista de piezas (canto, orden, cantidad)
│       ├── SettingsPanel.tsx # Configuración (cuchilla, unidad, algoritmo, costos)
│       └── Sidebar.tsx     # Contenedor del panel lateral
├── store/
│   └── cutStore.ts         # Estado global (tableros, piezas, solución, ajustes)
├── utils/
│   ├── cutSequence.ts      # Numeración de paneles y etiquetas de corte
│   ├── edges.ts            # Lógica de canteado (giro, longitudes, resúmenes)
│   ├── generatePdf.ts      # Reporte PDF
│   ├── pieceColor.ts       # Color consistente por dimensión
│   └── units.ts            # Conversión de unidades, m², metros y dinero
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
- [x] **Unidades reales** — al cambiar mm/cm/pulgadas se convierten tableros, piezas y cuchilla; áreas y metros se normalizan a m² y m
- [x] **Costeo** — precio por m² de tablero y por metro de canto, con desglose y total en el resumen y el PDF
- [x] **Secuencia de cortes por tablero** — lista guillotina paso a paso (panel, corte, medida, pieza) en la app y en el PDF

### Próximos pasos
- [ ] Compensar el espesor del canto en la dimensión de corte (pieza final = corte + canto)
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
