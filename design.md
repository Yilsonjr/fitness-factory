# design.md — Sistema Visual: Fitness Factory

Referencia de diseño para todos los agentes. Cada decisión aquí tiene una razón funcional vinculada al producto. Consultar antes de crear cualquier UI.

Tokens completos en `src/styles/tokens.css`.

---

## Product Personality

### Operational
La interfaz sirve a personas que trabajan con ella 4-8 horas diarias. Cada elemento debe justificar su presencia en términos de utilidad, no de estética. La densidad de información es una característica, no un defecto.

### Trustworthy
Los datos de membresías, cobros y cierre de caja son críticos para el negocio. La interfaz debe transmitir confiabilidad a través de consistencia visual, estados claros y feedback preciso. Nada debe verse ambiguo o provisional.

### Efficient
Las acciones más frecuentes (cobrar, asignar membresía, consultar cliente) deben completarse en el menor número de pasos posible. La navegación no debe interrumpir el flujo de trabajo.

### Precise
Los números son el idioma del producto. Montos en DOP, fechas exactas, conteos reales. Nunca redondear, truncar ni aproximar información financiera o temporal.

### Calm
Dark theme a 90% del tiempo en el mostrador. La paleta oscura reduce la fatiga visual. No añadir colores estimulantes innecesarios — los colores de estado (verde/naranja/rojo) son la única excepción y comunican significado, no decoración.

---

## Visual Philosophy

**Densidad contextual:** Este es un sistema operativo, no una landing page. Las pantallas deben mostrar la máxima información útil por viewport. Tablas compactas, forms de dos columnas, sidebars fijas.

**Contenido antes que containers:** Primero definir qué información necesita el usuario. Después decidir si necesita un contenedor. Las cards existen para agrupar conceptos relacionados, no para decorar.

**Jerarquía antes que decoración:** El orden visual se establece con tamaño, peso y contraste tipográfico. Solo se añade decoración cuando la tipografía no puede resolver la jerarquía.

**Superficies funcionales:** Cada superficie tiene un propósito: `--bg-primary` es el espacio de trabajo, `--bg-card` agrupa contenido relacionado, `--bg-elevated` flota sobre el contenido (modales, dropdowns). No invertir este orden.

---

## Color System

### Paleta base (dark theme — charcoal/graphite)

La paleta de superficies es charcoal neutral, sin azul-slate. Las diferencias entre niveles son sutiles: profundidad a través de valor, no de color.

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-primary` | `#111313` | Fondo de página, fill de inputs |
| `--bg-card` | `#191c1c` | Cards, sidebar, containers |
| `--bg-elevated` | `#212527` | Modales, dropdowns — un nivel sobre card |
| `--bg-overlay` | `rgba(0,0,0,0.72)` | Backdrop de modales |
| `--border` | `#2e3237` | Borde de cards e inputs (graphite) |
| `--border-muted` | `rgba(46,50,55,0.55)` | Separadores de filas en tablas |

### Texto

| Token | Valor | Uso |
|-------|-------|-----|
| `--text-primary` | `#f1f5f9` | Texto principal (off-white) |
| `--text-secondary` | `#94a3b8` | Labels, subtítulos, texto de soporte |
| `--text-muted` | `#475569` | Placeholders, hints — **solo usos no críticos** |
| `--text-on-primary` | `#0d1000` | Texto oscuro sobre superficies lime (botones, avatar) |

### Brand / Interactivo

El lime es el color de marca de Fitness Factory. Usar con moderación: impacta porque aparece poco.

| Token | Valor | Uso |
|-------|-------|-----|
| `--brand` | `#B7F500` | Color de marca — electric lime |
| `--brand-hover` | `#A3DB00` | Hover de elementos brand |
| `--brand-active` | `#8FBF00` | Estado pressed |
| `--brand-soft` | `rgba(183,245,0,0.10)` | Nav activo, chip activo |
| `--brand-contrast` | `#0d1000` | Texto sobre superficies lime |
| `--primary` | `#B7F500` | Alias de `--brand` (retrocompatibilidad) |
| `--primary-hover` | `#A3DB00` | Alias de `--brand-hover` |
| `--primary-subtle` | `rgba(183,245,0,0.10)` | Alias de `--brand-soft` |

### Colores de estado

Regla: **siempre usar el par `*-subtle` + `*-text`** para badges. El `*-subtle` es el fondo, el `*-text` es el texto. Nunca invertir.

| Estado | Cuándo | Fondo badge | Texto badge | Ícono/borde |
|--------|--------|------------|------------|-------------|
| success | Membresía activa, acción exitosa | `--color-success-subtle` | `--color-success-text` | `--color-success` |
| warning | Por vencer (≤7 días), alertas no críticas | `--color-warning-subtle` | `--color-warning-text` | `--color-warning` |
| danger | Membresía vencida, errores | `--color-danger-subtle` | `--color-danger-text` | `--color-danger` |
| frozen | Membresía congelada | `--color-frozen-subtle` | `--color-frozen-text` | `--color-frozen` |
| neutral | Sin membresía, inactivo | `--color-neutral-subtle` | `--text-secondary` | `--text-muted` |
| info | Información neutral, no crítica | `--color-info-subtle` | `--color-info-text` | `--color-info` |

**Nota:** `--color-success-text` es `#4ade80` (más claro que `#22c55e`) para garantizar contraste sobre `--bg-card`. Del mismo modo, `--color-danger-text` es `#f87171`. Los colores base se usan para íconos y bordes.

**Ingresos del día (KPI):** Usa `tone: 'primary'` → `--brand` (lime). No `success`. Los ingresos son una métrica financiera de marca, no un estado de membresía.

---

## Geometry

### Border radius

El radius expresa la naturaleza de la superficie, no un gusto estético.

| Superficie | Token | px | Uso |
|-----------|-------|----|-----|
| Cards, sections | `--radius-card` | 16px | Todos los containers principales |
| Form inputs, select, textarea | `--radius-input` | 10px | Controles de formulario |
| Botones estándar | `--radius-md` | 8px | `.btn-primary`, `.btn-secondary` |
| Botones pequeños, icon buttons | `--radius-sm` | 6px | Acciones compactas |
| Íconos en stat cards | `--radius-lg` | 12px | Contenedor de ícono 48×48 |
| Avatar grande | `--radius-xl` | 24px | Avatar de 96px en ClienteDetalle |
| Pills, chips, avatars circulares | `--radius-full` | 999px | Filter chips, badges, avatar de tabla |

**No crear nuevos valores de radius.** Si un valor no existe, usar el token más cercano.

### Bordes

Cards y containers: `1px solid var(--border)` sobre `--bg-card`. Sin sombra (excepto casos documentados en Elevation).

Separadores en tablas: `border-bottom: 1px solid var(--border-muted)`.

---

## Elevation

Las superficies se separan por **color de fondo y borde**, no por sombra. Las sombras tienen significado específico y son escasas.

| Nivel | Cómo separar | Token de sombra | Cuándo |
|-------|-------------|-----------------|--------|
| 0 — Página | `--bg-primary` | — | Fondo de trabajo |
| 1 — Card | `--bg-card` + `--border` | — | Agrupadores de contenido |
| 2 — Elevated | `--bg-elevated` + `--border` | `--shadow-modal` | Modales, dropdowns |
| Focus | inputs/buttons en foco | `--shadow-focus` | Solo en estado `:focus` |
| Login card | Excepción única | `--shadow-login` | Solo login.component |

**Regla:** Si estás tentado a añadir una sombra nueva, primero pregunta si el elemento puede diferenciarse con `--bg-elevated` y `--border`.

---

## Typography

El sistema de fuentes es el stack del sistema operativo (no se carga ninguna fuente externa).

### Escala

| Token | rem | Uso |
|-------|-----|-----|
| `--text-xs` | 0.75rem | Badges, table headers en uppercase |
| `--text-sm` | 0.8rem | Labels de formulario, texto de soporte |
| `--text-base` | 0.9rem | Cuerpo de texto principal |
| `--text-md` | 0.95rem | Subtítulos de página |
| `--text-lg` | 1rem | — |
| `--text-xl` | 1.1rem | Section headings (`<h2>` dentro de cards) |
| `--text-2xl` | 1.2rem | — |
| `--text-3xl` | 1.35rem | Valores en reportes |
| `--text-4xl` | 1.5rem | Stat values grandes |
| `--text-5xl` | 1.75rem | **Page-level `<h1>` — CANÓNICO** |

### Reglas por elemento

**Page heading (`<h1>`):** `font-size: var(--text-5xl)`, `font-weight: var(--font-bold)`, `color: var(--text-primary)`. Uno por página.

**Section heading (`<h2>`):** `font-size: var(--text-xl)`, `font-weight: var(--font-semibold)`.

**Subtítulo de página:** Párrafo bajo el `<h1>`. `font-size: var(--text-md)`, `color: var(--text-secondary)`.

**Body:** `font-size: var(--text-base)`, `color: var(--text-primary)`.

**Labels de form:** `font-size: var(--text-sm)`, `font-weight: var(--font-medium)`, `color: var(--text-secondary)`.

**Table headers:** `font-size: var(--text-xs)`, `text-transform: uppercase`, `letter-spacing: 0.04em`, `color: var(--text-secondary)`.

**Badges:** `font-size: var(--text-xs)`, `font-weight: var(--font-medium)`.

**Valores numéricos (stat cards, totales):** `font-weight: var(--font-bold)`, `color: var(--text-primary)`. Usar `--text-4xl` para valores grandes del dashboard, `--text-3xl` para valores en reportes.

### Alineación numérica en tablas

Los montos en columnas de tablas deben estar alineados a la derecha (`text-align: right`) para facilitar la comparación visual.

---

## Iconography

Todos los íconos son SVG inline, stroke-based.

**Atributos requeridos:** `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"` y `stroke-linejoin="round"` cuando aplica.

**Tamaños en uso:**

| Tamaño | Contexto |
|--------|---------|
| 16px | Íconos dentro de inputs (search) |
| 18px | Botones de acción en tabla (ver, editar) |
| 20px | Nav sidebar, acciones generales |
| 24px | Stat card icons (dentro del contenedor 48×48) |
| 28px | Dashboard quick action cards |

**Reglas:**
- Un ícono en un botón que solo tiene ícono (sin texto) debe tener `aria-label` en el botón.
- Un ícono que acompaña texto visible debe tener `aria-hidden="true"`.
- No añadir íconos para "decorar". Cada ícono debe mejorar el reconocimiento o la diferenciación.
- Los íconos de navegación en el sidebar deben corresponder a la acción — no usar íconos genéricos de "dashboard" para todas las secciones.

---

## Motion

**Principio:** El movimiento debe comunicar, no entretener.

| Token | Valor | Uso |
|-------|-------|-----|
| `--duration-fast` | 0.2s | Hovers, cambios de color/bg, estados |
| `--duration-layout` | 0.3s | Colapso del sidebar, cambios estructurales |
| `--easing-default` | ease | Todos los easings |
| `--transition-fast` | `all 0.2s ease` | Shorthand para hover |
| `--transition-layout` | `0.3s ease` | Shorthand para layout |

**`prefers-reduced-motion`:** Ambas duraciones se reducen a `0s` automáticamente vía el bloque `@media` en tokens.css.

**Transformaciones prohibidas sin propósito claro:**
- `transform: translateY(-2px)` en hover de cards → puede causar layout shift. Usar `box-shadow` o cambio de `border-color` en su lugar.
- `scale()` decorativo
- Animaciones de entrada largas (>300ms)

---

## Component Patterns

### Card

```css
background: var(--bg-card);
border: 1px solid var(--border);
border-radius: var(--radius-card);
padding: var(--space-4);
```

### Badge de estado

```css
display: inline-flex;
align-items: center;
border-radius: var(--radius-full);
padding: 0.2rem 0.55rem;
font-size: var(--text-xs);
font-weight: var(--font-medium);

/* Para estado "activa": */
background: var(--color-success-subtle);
color: var(--color-success-text);
```

### Botón primario

```css
background: var(--primary);
color: white;
border: none;
border-radius: var(--radius-md);
padding: 0.7rem 1.2rem;
font-size: var(--text-base);
font-weight: var(--font-semibold);
cursor: pointer;
transition: var(--transition-fast);

/* Hover: */
background: var(--primary-hover);

/* Disabled: */
opacity: 0.6;
cursor: not-allowed;
```

### Botón secundario

```css
background: transparent;
color: var(--text-primary);
border: 1px solid var(--border);
border-radius: var(--radius-md);
/* mismo padding y font que primario */
```

### Form input

```css
background: var(--bg-input);
color: var(--text-primary);
border: 1px solid var(--border);
border-radius: var(--radius-input);
padding: 0.8rem 0.9rem;
font-size: var(--text-base);

/* Focus: */
border-color: var(--primary);
box-shadow: var(--shadow-focus);
outline: none;
```

### Filter chip (pill — estándar)

```css
border-radius: var(--radius-full);
padding: 0.4rem 1rem;
font-size: var(--text-sm);
border: 1px solid var(--border);
background: transparent;
color: var(--text-secondary);
cursor: pointer;
transition: var(--transition-fast);

/* Active: */
background: var(--primary-subtle);
border-color: var(--primary);
color: var(--primary);
```

### Table

```css
/* table */
width: 100%;
border-collapse: collapse;

/* th */
font-size: var(--text-xs);
text-transform: uppercase;
letter-spacing: 0.04em;
color: var(--text-secondary);
font-weight: var(--font-medium);
padding: 0.75rem;
border-bottom: 1px solid var(--border);
text-align: left;

/* td */
font-size: var(--text-base);
padding: 0.75rem;
border-bottom: 1px solid var(--border-muted);

/* tr hover */
background: rgba(255,255,255,0.02);
```

---

## Data Density

### Tablas operativas

Las tablas en este producto son herramientas, no displays informativos. Consideraciones:

- **Columnas:** Solo las necesarias. Nunca repetir información que ya tiene su propia pantalla.
- **Acciones de fila:** Íconos de 18px en la última columna. Máximo 2-3 acciones por fila.
- **Sticky header:** Aplicar cuando la tabla puede tener >10 filas visibles.
- **Responsive:** Ocultar columnas no críticas en mobile. ClientesLista oculta teléfono y fecha de vencimiento. La fecha es accesible en el detalle del cliente.
- **Alineación numérica:** Montos a la derecha siempre.
- **Hover de fila:** Background sutil (`rgba(255,255,255,0.02)`) para facilitar el tracking visual.

### Formularios

- **2 columnas** para la mayoría de los campos (responsive a 1 en mobile)
- **Labels permanentes** — no placeholder-only, siempre `<label>` visible
- **Agrupación:** campos relacionados deben estar próximos (ej: nombre + apellido en la misma fila)
- **Acciones:** botón primario alineado a la derecha o al final del formulario, nunca al inicio

### Dashboard

Las 4 KPI cards del dashboard son operativas:
1. Membresías activas → muestra si el negocio está saludable
2. Por vencer → determina a quién llamar hoy
3. Vencidas → muestra cuántos clientes hay que recuperar
4. Ingresos del día → valida si el turno de caja está correcto

Estas métricas no son decorativas. No reemplazarlas con gráficas o KPIs alternativos sin validación del producto.

---

## Empty States

Un empty state debe responder tres preguntas:

1. **¿Qué está pasando?** — "No hay membresías registradas"
2. **¿Por qué está vacío?** — "Todavía no se han asignado planes a clientes"
3. **¿Qué puede hacer el usuario?** — Botón o link a la acción relevante

**Formato:** Texto centrado, `color: var(--text-secondary)`, `padding: var(--space-8) var(--space-4)`. Opcionalmente un ícono neutral (no el ícono de "error").

---

## Error States

Los errores deben ser:

- **Visibles** — Banner en la parte superior del form/section, nunca solo en consola
- **Específicos** — "El correo electrónico ya está registrado" no "Error al guardar"
- **Accionables** — El usuario debe entender qué hacer
- **Preservadores** — Nunca limpiar el formulario por un error. El usuario re-intenta, no vuelve a empezar

**Formato de banner:**
```css
background: var(--color-danger-banner);
border: 1px solid var(--color-danger-subtle);
border-radius: var(--radius-md);
color: var(--color-danger-text);
padding: var(--space-3) var(--space-4);
```

---

## Loading States

- **Botones:** Cambiar texto a "Guardando..." / "Procesando..." y deshabilitar. No añadir spinner si el texto es suficiente.
- **Spinner en botón:** `border: 2px solid rgba(255,255,255,0.3); border-top-color: white;` animado con `@keyframes spin`.
- **Páginas con listas:** Mostrar skeleton o texto de "Cargando..." centrado.
- **No bloquear toda la aplicación** con loaders globales cuando la operación es local.

---

## Responsive

El app es desktop-primary. Mobile es colapso, no rediseño.

**Transformaciones en 768px:**

| Elemento | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | 260px fija | 72px íconos-only |
| Main content | `margin-left: 260px` | `margin-left: 72px` |
| Grids de cards | `auto-fit, minmax(240px, 1fr)` | 1 columna |
| Formularios | 2 columnas | 1 columna |
| Page header | flex row (título + acción) | flex column |
| Tablas | todas las columnas visibles | ocultar columnas no críticas |
| Text labels en nav | visibles | ocultos |

**Targets táctiles en mobile:** Mínimo 44×44px para elementos interactivos.

---

## Fitness Factory Brand Translation

Esta sección documenta cómo la identidad visual del logo de Fitness Factory se traduce al software operativo. La referencia visual es `references/fitness-factory-brand.png`.

### Brand Essence

El logo utiliza: negro, carbón, grafito, acero, blanco frío y lime/verde eléctrico.

Estos elementos se traducen como principios de UI, no como efectos gráficos:

| Elemento del logo | Traducción al software |
|-------------------|------------------------|
| **Negro** | Superficies charcoal (`--bg-primary`, `--bg-card`) |
| **Grafito** | Bordes y separadores (`--border`) |
| **Acero** | Texto secundario neutral (`--text-secondary`) |
| **Lime** | Brand accent escaso y preciso (`--brand`) |
| **Alto contraste** | Jerarquía tipográfica (bold + off-white sobre dark) |
| **Geometría angular** | Radius moderado, bordes precisos, sin exceso redondeo |

La aplicación debe sentirse: **strong, precise, energetic, performance-oriented, premium, disciplined.**

NO debe sentirse: gaming, cyberpunk, neon, supplement store, SaaS genérico.

### Primary Brand Color

**Electric Lime: `#B7F500`**

Seleccionado por:
- Contraste sobre superficies oscuras: ≥ 11:1 (muy por encima de WCAG AA)
- Texto oscuro (`--brand-contrast: #0d1000`) sobre lime en botones: ≈ 14:1 ✅
- Luminosidad que aporta energía sin ser neon decorativo

**Cuándo usar lime:**
- Botón de acción primaria (`background: var(--brand)`)
- Nav item activo (`background: var(--brand-soft); color: var(--brand)`)
- Focus ring de inputs y botones (`--shadow-focus`)
- KPI de ingresos del día (stat card con `tone: 'primary'`)
- Marca en sidebar (logo icon fill)

**Cuándo NO usar lime:**
- Badges de membresía activa (usar `--color-success`) — son estados, no marca
- Múltiples botones simultáneos del mismo nivel
- Decoración (iconos de fondo, bordes decorativos, textos de soporte)
- Más de 1-2 elementos lime visibles al mismo tiempo en viewport

### Brand Color vs Success Color

**Brand (`--brand: #B7F500`):** Interacción y navegación. Significa "esto es Fitness Factory" o "acción disponible".

**Success (`--color-success: #22c55e`):** Estado positivo de membresía. Significa "este cliente tiene acceso vigente".

Son hues distintos (yellow-green vs pure green), contextos distintos (UI interaction vs membership state). Nunca usar indistintamente.

### Dark Surfaces — Jerarquía

```
--bg-primary  #111313  ← página y fondo de inputs (más oscuro)
--bg-card     #191c1c  ← cards, sidebar (un nivel arriba)
--bg-elevated #212527  ← modales, dropdowns (un nivel más arriba)
```

La diferencia entre niveles es sutil — visible en context, no impactante en aislamiento. Esto crea profundidad sin "cajones de colores". Los bordes (`--border: #2e3237`) refuerzan la separación sin shadow.

### Semantic Colors — Resumen

| Token | Color | Función |
|-------|-------|---------|
| `--brand` | `#B7F500` | Interacción / identidad de marca |
| `--color-success` | `#22c55e` | Estado positivo (membresía activa) |
| `--color-warning` | `#f59e0b` | Alerta no crítica (por vencer) |
| `--color-danger` | `#ef4444` | Error / estado crítico (vencida) |
| `--color-frozen` | `#eab308` | Estado suspendido (congelada) |
| `--color-info` | `#3b82f6` | Información semántica (NO marca) |

### Prohibited Brand Translation

Los siguientes efectos del logo de marketing **no pertenecen al software operativo**:

- **Humo / partículas** — animaciones decorativas
- **Texturas metálicas** — chrome, gradientes de metal
- **Texto 3D** — tipografía con profundidad
- **Glow / neon shadows** — `box-shadow` de color lima
- **Rayas diagonales grandes** — separadores decorativos
- **Superficies reflectantes** — glassmorphism, backdrop-blur
- **Gradientes verde/lima decorativos** — en cards, headers, fondos
- **Todos los iconos en lime** — el ícono comunica por forma, el color es escaso
- **Líneas de borde lima** — salvo el separador de stat card (sutil, funcional)

La identidad surge de: contraste, tipografía, jerarquía, densidad, precisión. No de decoración.

### Logo Mark (sidebar)

El logo completo de Fitness Factory contiene efectos 3D, humo y textura metálica que no pertenecen a una UI operativa. El sidebar usa una **marca simplificada**: rect lime con iconografía interna oscura (`--brand-contrast`).

Si en el futuro se requiere una variante vectorial limpia del logo oficial para la UI, documentar como: **"compact brand mark / UI logo variant — pendiente de asset de marca"**.

