# Skill: Anti-Generic UI

**Activar cuando:** Después de implementar cualquier pantalla o componente. También como revisión preventiva antes de implementar.

Esta skill actúa como crítico adversarial. No felicita la interfaz automáticamente. Busca activamente lo que hace parecer el producto genérico.

---

## Context

- `design.md` — los patrones y tokens del producto
- `docs/product.md` — qué es específico de Fitness Factory
- `docs/ui-audit.md` — problemas ya conocidos (no re-reportar)

---

## Checklist de revisión

Para cada item: identificar, explicar el impacto, proponer alternativa concreta.

### Brand Overuse ⚠️ — Revisión prioritaria

El lime (`--brand: #B7F500`) debe aparecer poco para tener impacto. Si aparece mucho, la UI parece gaming/neon.

- [ ] **¿Hay más de 2-3 elementos lime visibles al mismo tiempo en el viewport?** → Reducir. El lime solo para la acción primaria o el nav activo, no ambos a la vez con más elementos.
- [ ] **¿Todos los iconos son lime?** → Los iconos comunican por forma. Color solo en el ícono del item de nav activo (via `color: inherit`).
- [ ] **¿Todos los bordes de tarjeta son lime?** → Solo el `border-top` de la KPI de ingresos y la stat card con `tone: 'primary'`. No decorar con lime.
- [ ] **¿Hay `box-shadow` de color lime decorativo?** → Prohibido. `--shadow-focus` es el único uso permitido de lime en shadow, y solo en `:focus-visible`.
- [ ] **¿Hay gradientes verde/lime en fondos, headers o cards?** → Eliminar. Superficies planas siempre.
- [ ] **¿Los botones secundarios también son lime?** → Solo el botón primario usa `--brand`. Los secundarios son neutrales (`--border`, `--bg-card`).
- [ ] **¿Se usa `--brand` para texto de soporte, labels o notas?** → No. El lime es para interacción activa. El texto de soporte usa `--text-secondary`.
- [ ] **¿La interfaz parece un poster de bodybuilding o una tienda de suplementos?** → Si la respuesta es sí, hay exceso de lime o geometría angular decorativa.
- [ ] **¿Se confunde `--brand` con `--color-success`?** → Verificar que los badges de membresía "activa" usan `--color-success-subtle`/`--color-success-text`, no lime.

### Colores

- [ ] ¿Hay algún hex hardcodeado? → Reemplazar con token de `src/styles/tokens.css`
- [ ] ¿Se usa `--color-info` (#3b82f6 azul) donde debería usarse `--brand`? → El azul es semántico (información), no interactivo.
- [ ] ¿Hay gradientes decorativos morado/azul/verde? → Eliminar
- [ ] ¿Hay `glassmorphism` (background blur + transparencia)? → Eliminar
- [ ] ¿Hay `glow effects` (box-shadow de color) en elementos que no son de foco? → Eliminar
- [ ] ¿Los colores de estado significan algo? → Cada color debe comunicar un estado específico (verde = activo, naranja = por vencer, rojo = vencido, lime = interacción de marca)

### Geometría

- [ ] ¿Cada elemento tiene un `border-radius` propio no-tokenizado? → Usar escala de `--radius-*`
- [ ] ¿Todo está excesivamente redondeado (inputs, cards, tablas, headers)? → Reservar `--radius-full` para pills/chips/avatars
- [ ] ¿Hay `card dentro de card`? → Evaluar si el container exterior es necesario
- [ ] ¿Hay sombras en cada elemento? → Solo 3 sombras permitidas: `--shadow-focus`, `--shadow-login`, `--shadow-modal`
- [ ] ¿Hay formas diagonales, parallelogramos o ángulos agresivos decorativos? → La geometría angular del logo es inspiración de precisión, no literal en la UI.

### Tipografía

- [ ] ¿El `<h1>` es excesivamente grande (>2rem)? → Canónico: `--text-5xl` (1.75rem)
- [ ] ¿Hay headings enormes sin contenido que los justifique (hero heading)? → Reducir a `--text-5xl` max
- [ ] ¿El texto body es demasiado pequeño (<0.8rem) o demasiado grande (>1rem) para contenido operativo? → Usar `--text-base` (0.9rem)
- [ ] ¿Se usa alguna fuente "deportiva" o "futurista" para body text? → No. Solo `system-ui` stack.

### Iconos

- [ ] ¿Hay iconos en absolutamente todos los botones aunque el texto sea suficiente? → Los íconos deben agregar reconocimiento, no decoración
- [ ] ¿Se usan emojis como sistema visual? → No — usar SVG stroke-based
- [ ] ¿Los íconos son del estilo correcto? (stroke-based, fill="none", stroke-width="2") → Verificar SVG attributes
- [ ] ¿Hay íconos decorativos sin función? → Eliminar

### Layout y Estructura

- [ ] ¿El dashboard tiene el patrón genérico "sidebar + 4 KPIs + gráfica + actividad reciente"? → Las 4 KPIs de Fitness Factory son operativas — ✅. Verificar que las métricas sean las correctas.
- [ ] ¿La pantalla tiene el mismo layout que todas las demás (header + 4 cards)? → Evaluar si hay una estructura más apropiada al contenido específico
- [ ] ¿Hay whitespace excesivo que reduce la densidad de información útil? → Ajustar spacing al nivel operativo
- [ ] ¿Los botones de acción primaria parecen igual que los secundarios? → El primario debe ser visualmente dominante
- [ ] ¿Hay paneles flotantes sin propósito claro? → Cada container debe justificar su existencia
- [ ] ¿Hay elementos decorativos sin función (shapes, blobs, formas abstractas)? → Eliminar

### Badges y Chips

- [ ] ¿Hay exceso de badges donde bastaría texto? → Un badge es para estado que necesita color. Una fecha es solo texto.
- [ ] ¿Los badges de estado usan los pares correctos `--color-*-subtle` + `--color-*-text`? → Verificar todos
- [ ] ¿Los filter chips son inconsistentes (algunos pill, algunos rectangulares)? → Estandarizar a `--radius-full`

### Contenido

- [ ] ¿Hay texto en inglés en la UI? → Todo en español
- [ ] ¿Hay montos sin formato DOP? → Usar `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`
- [ ] ¿Hay Lorem ipsum o datos de ejemplo ficticios? → Eliminar antes del merge
- [ ] ¿Los mensajes de error son genéricos ("Algo salió mal")? → Hacerlos específicos y accionables

### La pregunta definitiva

> "¿Podría esta pantalla pertenecer a cualquier SaaS de gestión genérica?"

Si la respuesta es **sí**, identificar qué decisión específica del producto falta:
- ¿Falta el contexto DOP?
- ¿Falta la terminología del producto (membresía, turno, cédula)?
- ¿Los estados usan labels genéricos en lugar de los del dominio (activa/vencida/congelada)?
- ¿La densidad es de marketing en lugar de operativa?
- ¿La paleta charcoal + lime es reconocible o se ve como otro dashboard azul?

---

## Format de reporte

Para cada problema encontrado:

```
[Elemento]: [Descripción del problema]
Por qué perjudica: [impacto en UX o identidad]
Corrección: [qué hacer exactamente, con token o valor correcto]
```

No listar problemas que ya están en `docs/ui-audit.md` (no re-reportar lo conocido).

---

## Lo que NO es un problema

- Las 4 KPI cards del dashboard — son operativas para este producto
- El dark theme completo — es deliberado y correcto
- El uso de tablas densas — el producto lo requiere
- El sidebar siempre visible — es la navegación principal del app
- Los badges de estado por todas partes — el estado de membresía es crítico
- El lime en el logo del sidebar — es la marca, no exceso
- El lime en el botón de acción primaria — es el único botón primario en esa región
- El lime en el nav item activo — es el único item activo a la vez
