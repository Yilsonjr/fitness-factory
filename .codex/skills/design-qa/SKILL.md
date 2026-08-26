# Skill: Design QA

**Activar cuando:** Después de implementar o modificar cualquier componente de UI. No considerar una pantalla terminada solo porque compila.

---

## Context

- `design.md` — todos los patrones y reglas
- `src/styles/tokens.css` — todos los tokens disponibles
- `docs/ui-audit.md` — problemas conocidos (no re-reportar)

---

## Process

Leer el componente completo, luego verificar cada punto.

### 1. Hierarchy

**Pregunta:** ¿Está claro qué mirar primero?

- [ ] Hay un `<h1>` usando `font-size: var(--text-5xl)` y `font-weight: var(--font-bold)`
- [ ] El `<h1>` es único en la página
- [ ] La acción primaria es visualmente dominante (botón filled con `--primary`)
- [ ] Los datos más críticos (estado, balance, total) están en la posición más prominente
- [ ] No hay 5 elementos del mismo peso visual compitiendo

### 2. Alignment

**Pregunta:** ¿Los elementos comparten ejes visuales?

- [ ] Los elementos en grid se alinean correctamente
- [ ] Los labels están alineados a la izquierda de sus inputs
- [ ] Los montos numéricos están alineados a la derecha en tablas
- [ ] Los botones del mismo grupo están alineados entre sí

### 3. Spacing

**Pregunta:** ¿Existe ritmo consistente?

- [ ] El padding de las cards usa tokens: `--space-4` (1rem) o `--space-5` (1.25rem)
- [ ] Los gaps entre elementos usan tokens: `--space-2`, `--space-3`, `--space-4`
- [ ] El margen inferior del page header usa `--space-6` (1.5rem)
- [ ] La separación entre secciones mayores usa `--space-8` (2rem)
- [ ] No hay valores de spacing raw (0.4rem, 15px, etc.) que no correspondan a ningún token

### 4. Typography

**Pregunta:** ¿La jerarquía tipográfica es clara?

- [ ] `<h1>` → `--text-5xl` (1.75rem), `--font-bold`
- [ ] `<h2>` de sección → `--text-xl` (1.1rem), `--font-semibold`
- [ ] Subtítulo de página → `--text-md` (0.95rem), `--text-secondary`
- [ ] Body → `--text-base` (0.9rem)
- [ ] Labels de form → `--text-sm` (0.8rem), `--font-medium`
- [ ] Table headers → `--text-xs` (0.75rem), uppercase, `letter-spacing: 0.04em`
- [ ] Badges → `--text-xs` (0.75rem)
- [ ] No hay font-size raw que no sea un token (ej: `0.78rem`, `1.6rem`, `1.5rem`)

### 5. Density

**Pregunta:** ¿La densidad es apropiada al contexto?

- [ ] Las tablas tienen padding de `0.75rem` por celda (no más)
- [ ] Los formularios tienen grids de 2 columnas (no 1 columna centrada en desktop)
- [ ] No hay whitespace decorativo que reduzca información visible
- [ ] Las listas muestran suficientes items sin scroll innecesario

### 6. Surfaces

**Pregunta:** ¿Existen demasiados containers?

- [ ] Cada card tiene una razón de existir (agrupa contenido relacionado)
- [ ] No hay card dentro de card sin justificación
- [ ] El fondo de las cards usa `--bg-card` con `border: 1px solid var(--border)` y `border-radius: var(--radius-card)`
- [ ] No hay sombras en cards (solo en login, focus ring y modales)

### 7. Actions

**Pregunta:** ¿Primary, secondary y destructive se distinguen?

- [ ] Botón primario: `background: var(--primary)`, color white
- [ ] Botón secundario: outlined (`border: 1px solid var(--border)`, transparent bg)
- [ ] Botón destructivo: `background: var(--color-danger-subtle)`, `color: var(--color-danger-text)`
- [ ] Solo 1 botón primario por región de contenido
- [ ] Las acciones destructivas están separadas de las primarias y secundarias

### 8. Status Badges

**Pregunta:** ¿Los badges de estado usan los tokens correctos?

| Estado | Fondo correcto | Texto correcto |
|--------|---------------|----------------|
| activa | `--color-success-subtle` | `--color-success-text` |
| por vencer | `--color-warning-subtle` | `--color-warning-text` |
| vencida | `--color-danger-subtle` | `--color-danger-text` |
| congelada | `--color-frozen-subtle` | `--color-frozen-text` |
| sin membresía | `--color-neutral-subtle` | `--text-secondary` |

- [ ] Ningún badge usa hex hardcodeado
- [ ] Todos los badges tienen `border-radius: var(--radius-full)`
- [ ] El texto del badge es legible (no usar `--color-success` directamente sobre fondo oscuro — usar `--color-success-text`)

### 9. States

**Pregunta:** ¿Todos los estados están diseñados?

- [ ] Loading: texto "Cargando..." o spinner en botón ("Guardando...", "Procesando...")
- [ ] Error: banner con `--color-danger-banner` bg, `--color-danger-text` color, mensaje específico
- [ ] Empty: texto centrado con `--text-secondary`, mensaje que explica qué hacer
- [ ] Success: banner con `--color-success-banner` bg o redirect
- [ ] Disabled: `opacity: 0.6`, `cursor: not-allowed` en botones

### 10. Consistency with design.md

**Pregunta:** ¿El componente sigue design.md?

- [ ] Dark theme: `--bg-primary`, `--bg-card`, `--text-primary`
- [ ] Iconos: SVG inline, stroke-based, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`
- [ ] Transiciones: `--transition-fast` para hovers, `--transition-layout` para layout
- [ ] Focus ring: `--shadow-focus` en inputs
- [ ] Montos: formato DOP con `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`
- [ ] Filter chips: `border-radius: var(--radius-full)` (pills, no rectangulares)

### 11. Product Identity

**Pregunta:** ¿Podría esta pantalla pertenecer a cualquier SaaS?

Si **sí**: identificar qué falta
- ¿Falta terminología del dominio (membresía, turno, cédula)?
- ¿Los estados están en español y son específicos del dominio?
- ¿La densidad es operativa o parece un producto de marketing?
- ¿Se usa DOP en lugar de símbolos genéricos?

---

## Output

Reporte clasificado:

```
## Visual QA Report — [Componente]

### ✅ Correcto
- [Lista de items que pasan]

### ❌ Problemas encontrados

**[Categoría]**
- Problema: [descripción]
  Actual: [valor incorrecto]
  Correcto: [token o valor correcto]
  Línea aprox: [número de línea si conocida]

### 🔶 Observaciones (no errores, pero a tener en cuenta)
- [Lista]
```

Si todo está correcto: indicarlo explícitamente. No generar reporte vacío de problemas.
