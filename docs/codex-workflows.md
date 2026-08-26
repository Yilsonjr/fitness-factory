# Codex Workflows — Fitness Factory

Prompts reutilizables para tareas comunes de UI. Copiar, adaptar y ejecutar.

Antes de cualquier tarea de UI, siempre leer:
1. `docs/product.md`
2. `AGENTS.md`
3. `design.md`
4. `src/styles/tokens.css`

---

## Nueva pantalla

```
Tarea: Nueva pantalla [nombre]

Antes de implementar:
1. Leer docs/product.md — entender a qué usuario sirve y qué flujo toca
2. Leer docs/ux-principles.md — aplicar los principios relevantes
3. Leer docs/components.md — identificar patrones existentes reutilizables
4. Inspeccionar componentes relacionados (especificar cuáles)
5. Leer design.md para tokens y patrones visuales

Diseño:
- Generar mentalmente 2 estructuras diferentes (no variaciones de color — variaciones de layout)
- Elegir la que mejor optimice: claridad + velocidad + accesibilidad + coherencia con el producto

Implementación:
- Angular 21, standalone, OnPush, signals
- Todos los valores CSS via tokens de src/styles/tokens.css
- No hardcodear ningún hex ni valor de spacing/radius
- Template y styles inline
- Lazy loading si es un page component nuevo

Post-implementación:
- Ejecutar design-qa: revisar jerarquía, spacing, alineación, density, consistencia
- Ejecutar anti-generic-ui: ¿podría esta pantalla pertenecer a cualquier SaaS?
- Ejecutar responsive-qa: layout en mobile (768px breakpoint)
- Ejecutar accessibility-qa: checklist de docs/accessibility.md
```

---

## Rediseñar pantalla existente

```
Tarea: Rediseñar [componente] sin cambiar funcionalidad

Paso 1 — Análisis (no modificar nada aún):
- Leer el componente completo
- Identificar todos los estados (loading, error, empty, success, disabled)
- Mapear el flujo del usuario en esta pantalla (docs/ui-workflow.md)
- Identificar problemas en docs/ui-audit.md relacionados con este componente
- Aplicar design-qa y anti-generic-ui mentalmente antes de cambiar

Paso 2 — Plan:
- Listar qué cambios mejorarán la pantalla (jerarquía, tokens, radius, badges)
- Listar qué NO se cambia (lógica de negocio, rutas, señales, servicios)

Paso 3 — Implementación:
- Preservar todo el TypeScript de lógica
- Cambiar solo CSS y HTML estructural
- Migrar a tokens donde haya valores hardcodeados

Paso 4 — QA:
- Visual QA: jerarquía, spacing, alineación, densidad, consistencia con design.md
- Responsive QA: 768px
- Accessibility QA: checklist completo
```

---

## Mejora con referencia visual

```
Tarea: Mejorar [componente] basándose en la referencia en references/[archivo]

Proceso:
1. Ver la referencia visual
2. Extraer: layout, jerarquía, densidad, spacing, comportamiento de interacción
3. NO copiar: colores, tipografía, logos, branding, assets protegidos
4. Mapear cada elemento de la referencia al token equivalente en tokens.css
5. Identificar qué elementos son incompatibles con el dark theme o el idioma español
6. Implementar usando los patrones existentes en docs/components.md

Resultado esperado: el componente mejora en densidad/jerarquía/interacción
sin perder su identidad de Fitness Factory
```

---

## Crear componente

```
Tarea: Crear componente [nombre] para [propósito]

Antes de crear:
1. Buscar en docs/components.md si existe algo similar
2. Si existe: evaluar si puede ser una variante (prop/input adicional)
3. Si no existe: planificar

Plan del componente:
- ¿Es primitivo, compuesto, overlay o de datos?
- ¿Qué inputs/outputs necesita?
- ¿Qué estados debe manejar? (loading, empty, error, disabled, success)
- ¿Dónde se ubica? (shared/components/ si es reutilizable, features/[domain]/ si es específico)

Implementación:
- Selector: app-[nombre-kebab]
- Standalone (no declarar standalone: true — es el default en Angular 21)
- ChangeDetectionStrategy.OnPush
- Usar input() y output() en lugar de @Input()/@Output()
- Todos los CSS via tokens
- Template y styles inline

Post-creación:
- Añadir a docs/components.md con estado ✅
- Actualizar la sección correspondiente (Primitives, Composite, Overlays, Data, Navigation)
```

---

## Refactor de UI

```
Tarea: Refactorizar UI de [componente]

Preservar en su totalidad:
- Toda la lógica TypeScript (servicios, signals, computed, event handlers)
- Rutas y navegación
- Modelos de datos y tipos
- Cualquier comportamiento observable por el usuario

Solo cambiar:
- Valores CSS hardcodeados → tokens de src/styles/tokens.css
- Radius hardcodeados → tokens de radius
- Colores de status hardcodeados → tokens de color
- Font sizes no estándar → tokens de typography
- Heading h1 si no usa --text-5xl
- Filter chips si son rectangulares en lugar de pills (--radius-full)

Verificación:
- El componente debe verse idéntico o mejor tras el refactor
- No debe haber regresiones funcionales
- ng build debe pasar sin errores
```

---

## Auditoría de diseño

```
Tarea: Auditar diseño de [componente o pantalla]

Fase 1 — No modificar nada. Solo documentar:
1. Listar todos los valores CSS hardcodeados (hex, px no-tokenizados)
2. Verificar heading h1 (¿usa --text-5xl?)
3. Verificar badges (¿usan pares --color-*-subtle + --color-*-text?)
4. Verificar radius (¿usan tokens o valores raw?)
5. Verificar focus ring en todos los inputs
6. Verificar labels con for/id
7. Aplicar anti-generic-ui checklist
8. Verificar responsive en 768px

Fase 2 — Clasificar hallazgos:
- Critical: funcional, accessibility o responsive
- Important: inconsistencias significativas de UX/UI
- Polish: mejoras menores

Fase 3 — Ejecutar correcciones:
- Primero los Critical
- Luego los Important
- Polish solo si hay tiempo o es trivial

Nunca marcar una pantalla como "terminada" solo porque compila.
```

---

## Migración de formulario a Reactive Forms

```
Tarea: Migrar [formulario] de template-driven a Reactive Forms

IMPORTANTE: Leer docs/design-decisions.md antes de proceder.
Los formularios existentes son template-driven por decisión documentada.
Solo migrar si la tarea lo especifica explícitamente.

Proceso de migración:
1. Mapear todos los campos: nombre, tipo, validaciones actuales
2. Crear FormGroup con FormBuilder en el constructor/ngOnInit
3. Reemplazar [(ngModel)] → [formControlName]="'campo'"
4. Reemplazar validación de template → Validators.*
5. Reemplazar acceso a datos (form.value vs propiedades bound)
6. Reemplazar reset (form.reset() vs resetear cada signal)
7. Preservar todos los efectos colaterales (formatCedula, pre-fill de params, etc.)
8. Verificar que todos los estados funcionan: loading, error, success, disabled

No cambiar:
- CSS de ningún elemento del formulario
- Labels y estructura HTML
- Mensajes de error (solo el mecanismo de mostrarlos)
- Comportamiento observable para el usuario
```

---

## Referencia rápida de skills

| Skill | Cuándo usar |
|-------|------------|
| `.codex/skills/product-designer/SKILL.md` | Antes de diseñar cualquier pantalla nueva |
| `.codex/skills/ui-architect/SKILL.md` | Para planificar componentes y rutas |
| `.codex/skills/anti-generic-ui/SKILL.md` | Revisar si la UI parece genérica |
| `.codex/skills/design-qa/SKILL.md` | Post-implementación de cualquier UI |
| `.codex/skills/responsive-qa/SKILL.md` | Verificar comportamiento en 768px |
| `.codex/skills/accessibility-qa/SKILL.md` | Checklist WCAG AA |
| `.codex/skills/frontend-refactor/SKILL.md` | Migrar tokens o Reactive forms |
| `.codex/skills/reference-to-ui/SKILL.md` | Trabajar con screenshots de referencia |
| `.codex/skills/angular-ui/SKILL.md` | Scaffold de componentes Angular 21 |
