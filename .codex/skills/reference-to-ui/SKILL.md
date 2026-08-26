# Skill: Reference to UI

**Activar cuando:** Se proporciona una imagen, screenshot o mockup de referencia para mejorar o implementar una interfaz.

---

## Principio fundamental

Las referencias son para **extraer principios**, no para copiar productos.

Diferencia entre copiar y extraer:
- **Copiar:** "Hacer este componente exactamente como en la referencia"
- **Extraer:** "La referencia usa alta densidad de información y sticky headers en tablas — aplicar eso con los tokens de Fitness Factory"

---

## Context (leer antes de analizar la referencia)

1. `design.md` — identidad visual de Fitness Factory
2. `src/styles/tokens.css` — tokens disponibles
3. `docs/components.md` — componentes existentes
4. `AGENTS.md` — restricciones técnicas

---

## Process

### 1. Analizar la referencia (no implementar aún)

Al observar la referencia visual, documentar:

**Layout:**
- ¿Cómo está organizado el espacio? ¿Qué tipo de grid?
- ¿Dónde está la navegación? ¿Dónde están las acciones?
- ¿Cuántas columnas tiene el contenido principal?

**Jerarquía:**
- ¿Qué elemento tiene mayor peso visual?
- ¿Cómo se establece la jerarquía? (tamaño, peso, contraste, posición)
- ¿Qué información está en el primer nivel de visión?

**Densidad:**
- ¿Cuánta información se muestra por viewport?
- ¿Cuál es el padding interno de los containers?
- ¿Las filas de tabla son compactas o espaciosas?

**Interacción:**
- ¿Hay hover states visibles?
- ¿Cómo se muestran las acciones de fila?
- ¿Cómo funcionan los filtros?

**Tipografía:**
- ¿Qué tamaños se usan para headings?
- ¿Para labels y body?
- ¿Hay letras en uppercase? ¿Con letter-spacing?

### 2. Mapear a tokens de Fitness Factory

Para cada elemento visual de la referencia:

| Elemento en referencia | Equivalente en Fitness Factory |
|-----------------------|-------------------------------|
| Color de acento | `var(--primary)` (#3b82f6) — no adoptar el color del referencia |
| Fondo de página | `var(--bg-primary)` |
| Fondo de card | `var(--bg-card)` |
| Texto principal | `var(--text-primary)` |
| Texto secundario | `var(--text-secondary)` |
| Borde | `var(--border)` |
| Color de badge success | `var(--color-success-subtle)` + `var(--color-success-text)` |

### 3. Identificar qué es incompatible

Elementos que NO deben adoptarse aunque estén en la referencia:

- **Colores de marca de otro producto** — Fitness Factory tiene sus propios tokens
- **Light theme** — este producto es dark theme
- **Texto en inglés** — todo en español
- **Monedas que no son DOP** — siempre DOP
- **Terminología de otro dominio** — usar términos del gym (membresía, turno, cédula)
- **Logos o íconos propietarios** — usar íconos SVG stroke-based propios
- **Funcionalidades no existentes en el producto** — no inventar features

### 4. Extraer el principio, no el pixel

En lugar de: "poner el color #2D3748 igual que en la referencia"  
Hacer: "la referencia usa un gray más oscuro para el sidebar que para el contenido — en Fitness Factory eso ya lo tenemos con `--bg-card` (sidebar) vs `--bg-primary` (content)"

En lugar de: "hacer los badges exactamente como en la referencia"  
Hacer: "la referencia usa badges compactos con texto y fondo de mismo color pero diferente opacidad — el patrón `--color-*-subtle` + `--color-*-text` ya resuelve esto"

### 5. Implementar

Solo después del análisis completo:

1. Crear el componente usando la estructura extraída de la referencia
2. Usar los tokens propios de Fitness Factory para todos los valores
3. Respetar todas las reglas de `AGENTS.md`
4. Usar los componentes existentes de `docs/components.md` donde corresponda

---

## Checklist antes de implementar

- [ ] ¿He identificado qué problema visual resuelve la referencia?
- [ ] ¿He mapeado cada elemento de la referencia a un token existente?
- [ ] ¿He identificado lo que no puedo adoptar y por qué?
- [ ] ¿El resultado final usa `--bg-primary`, `--bg-card`, `--text-primary` (dark theme)?
- [ ] ¿El resultado está en español?
- [ ] ¿Los montos están en DOP?
- [ ] ¿No estoy copiando ningún logo, icono propietario o dato real?

---

## Ejemplos de extracción correcta

**Referencia:** Un sistema POS con tabla muy densa, header sticky y acciones de fila en hover  
**Extracción:** Alta densidad (padding: 0.5rem por celda), `position: sticky` en `<thead>`, acciones solo visibles en hover (`opacity: 0` → `1` en `tr:hover`)  
**Implementación:** Todo con tokens de Fitness Factory, terminología en español, dark theme

**Referencia:** Un dashboard con métricas grandes y colores vibrantes por categoría  
**Extracción:** Jerarquía: número grande + label pequeño debajo. Íconos de color para categoría.  
**Implementación:** `--text-4xl` para el número, `--text-sm` + `--text-secondary` para el label. Íconos con colores de estado existentes (`--color-success`, `--color-warning`, etc.)
