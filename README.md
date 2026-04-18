# OptimizaCortes

Optimizador de cortes para tableros de madera, vidrio u otros materiales planos. Dado un conjunto de tableros y piezas requeridas, calcula la distribución óptima de cortes minimizando el desperdicio de material.

## Funcionalidad

- **Tableros**: define uno o más tableros con dimensiones, material y cantidad.
- **Piezas**: agrega las piezas que necesitas cortar con ancho, alto, cantidad y si se permiten rotaciones.
- **Configuración**: ajusta el grosor de la cuchilla (sierra) y la unidad de medida (mm, cm, pulgadas).
- **Optimización**: el algoritmo distribuye automáticamente las piezas sobre los tableros disponibles.
- **Visualización**: el resultado se muestra en un canvas interactivo con cada tablero y sus cortes etiquetados.
- **Estadísticas**: panel de resumen con área usada, área total y porcentaje de eficiencia por tablero.

## Algoritmo

Utiliza **guillotine bin-packing** con la heurística *Best Area Fit*:

1. Las piezas se ordenan de mayor a menor área.
2. Para cada pieza se busca el espacio libre con menor área sobrante que la contenga (mejor ajuste).
3. Al colocar una pieza, el espacio restante se divide en dos rectángulos libres (corte en guillotina).
4. Si una pieza tiene rotación habilitada, se evalúan ambas orientaciones y se elige la de mejor ajuste.
5. El grosor de la cuchilla se descuenta en cada corte.

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
│   ├── guillotine.ts       # Algoritmo de bin-packing
│   └── guillotine.test.ts  # Tests unitarios
├── components/
│   ├── Canvas/
│   │   ├── CutCanvas.tsx   # Renderizado del layout en HTML5 Canvas
│   │   └── SummaryPanel.tsx# Estadísticas de eficiencia
│   └── Sidebar/
│       ├── BoardForm.tsx   # Formulario para agregar tableros
│       ├── BoardList.tsx   # Lista de tableros
│       ├── PieceForm.tsx   # Formulario para agregar piezas
│       ├── PieceList.tsx   # Lista de piezas
│       ├── SettingsPanel.tsx # Configuración (cuchilla, unidad)
│       └── Sidebar.tsx     # Contenedor del panel lateral
├── store/
│   └── cutStore.ts         # Estado global (tableros, piezas, solución, ajustes)
└── types/
    └── index.ts            # Board, Piece, PlacedPiece, CutResult, CutSolution, AppSettings
```

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
