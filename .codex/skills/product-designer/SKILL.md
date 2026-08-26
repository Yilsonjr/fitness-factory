# Skill: Product Designer

**Activar cuando:** Se solicita diseñar una pantalla nueva, rediseñar una existente, o antes de implementar cualquier UI significativa.

---

## Context (leer en este orden)

1. `docs/product.md` — producto, usuarios, flujos críticos, reglas de negocio
2. `docs/ux-principles.md` — por qué la interfaz está diseñada así
3. `design.md` — reglas visuales, tokens, patrones de componentes
4. `docs/components.md` — catálogo de componentes existentes
5. `src/styles/tokens.css` — todos los valores CSS disponibles

---

## Process

### 1. User

¿Quién usa esta pantalla?
- `admin` — accede a Reportes y Configuración
- `recepcionista` — Dashboard, Clientes, Membresías, Caja
- Ambos — la mayoría de las pantallas

¿Con qué frecuencia la usarán? ¿Cuántas veces por día?

### 2. Job

¿Qué está intentando conseguir el usuario en esta pantalla?
- Usar el lenguaje del producto: "registrar cobro", "asignar membresía", "cerrar turno"
- No usar abstracciones genéricas: "gestionar recursos", "administrar entidades"

### 3. Context

¿En qué contexto ocurre?
- ¿Es el primer paso de un flujo o el último?
- ¿Viene de otra pantalla? ¿Con qué datos pre-cargados?
- ¿Hay urgencia operativa? (ej: hay un cliente en el mostrador esperando)

### 4. Primary Information

¿Qué información debe encontrar el usuario primero al llegar a esta pantalla?
- En una lista: el estado de los items, no el nombre
- En un formulario: el campo más importante primero (top-left)
- En un dashboard: los números críticos, no los decorativos

### 5. Primary Action

¿Cuál es la **una** acción que el usuario más probablemente realizará?
- Debe ser visualmente dominante: `background: var(--primary)`, posición prominente
- Un solo botón primario por región de contenido

### 6. Secondary Actions

¿Qué otras acciones son disponibles pero menos frecuentes?
- Estilo secundario o terciario (outlined, link)
- No compiten visualmente con la acción primaria

### 7. States

Diseñar **todos** los estados antes de implementar:

| Estado | Descripción |
|--------|-------------|
| Default | Estado normal con datos |
| Loading | `loading = signal(true)` mientras carga |
| Empty | Sin datos que mostrar |
| Partial | Datos cargando o filtro sin resultados |
| Success | Operación completada |
| Error | Error de red o validación |
| Disabled | Acción no disponible (ej: sin turno abierto) |
| Permission | Admin-only content oculto para recepcionista |

Si un estado no está diseñado, no está terminado.

### 8. UX Risks

¿Qué puede salir mal en esta pantalla?
- Acciones destructivas sin confirmación
- Datos que pueden confundirse (membresía vencida vs congelada)
- Formularios que se limpian al dar error
- Flujos que dejan al usuario sin saber qué hacer después

### 9. Design Alternatives

Para pantallas importantes: generar mentalmente 2 estructuras distintas.

Las alternativas deben diferir en:
- Arquitectura de información (qué va primero)
- Layout (tabla vs cards vs lista)
- Jerarquía (qué tiene más peso visual)

No simplemente en colores o tamaño de fuente.

Elegir la alternativa que mejor optimice:
- Claridad (¿el usuario entiende qué puede hacer?)
- Velocidad (¿puede completar el flujo rápidamente?)
- Accesibilidad (¿funciona con teclado y screen reader?)
- Coherencia (¿se siente parte de Fitness Factory?)

---

## Output

Antes de escribir código, describir brevemente:

1. **Estructura:** Cómo está organizada la pantalla (secciones, orden)
2. **Componentes a usar:** De `docs/components.md`, cuáles son reutilizables
3. **Estado elegido:** Cuál de las 2 alternativas y por qué
4. **Decisiones clave:** Si algo no está en `design.md`, documentar la decisión

Después: implementar.

---

## Constraints

- Idioma: **Español** exclusivamente en la UI
- Moneda: **DOP** con `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`
- CSS: **Solo tokens** de `src/styles/tokens.css`. Cero hex hardcodeados.
- Angular: OnPush, signals, inline template, lazy-loaded si es page component
- Formularios nuevos: **Reactive Forms** (`ReactiveFormsModule`, `FormBuilder`)
- Breakpoint: `@media (max-width: 768px)` — único
- Dark theme siempre: `--bg-primary`, `--bg-card`, `--text-primary`
