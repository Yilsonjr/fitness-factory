# UX Principles — Fitness Factory

Principios que explican por qué la interfaz está diseñada de cierta manera. Guía para agentes antes de proponer cambios significativos de UI.

Estos principios están derivados del producto real. No son principios genéricos de UX.

---

## 1. Operational Density Over Aesthetics

Este es un sistema de trabajo, no una vitrina. Los usuarios (admin y recepcionistas) interactúan con él 4-8 horas diarias. Cada pantalla adicional en el flujo, cada campo innecesario, cada elemento decorativo es fricción acumulada.

**Implicaciones:**
- Las tablas muestran la máxima cantidad de información útil por fila
- Los formularios tienen 2 columnas (no 1 centrada como en landing pages)
- No existe "whitespace artístico" — cada espacio vacío tiene una razón
- Las cards son densas (1rem de padding, no 2rem+)

**Señal de alerta:** Si una propuesta de UI "se ve más limpia" porque muestra menos información, probablemente está comprometiendo la funcionalidad.

---

## 2. Workflows Are Navigation

Los tres flujos críticos (registrar cobro, asignar membresía, abrir/cerrar turno) deben alcanzarse en **máximo 2 taps** desde cualquier pantalla.

El dashboard tiene 4 quick-action cards precisamente para esto. La navegación del sidebar proporciona la segunda ruta. No reducir ni ocultar estas acciones.

**Implicaciones:**
- Los botones de acción principal nunca están colapsados en menús de overflow
- El sidebar tiene 6 items visibles, no más (evitar scroll en nav)
- Las rutas críticas están en el primer nivel, no en subniveles

---

## 3. Status Is Never Ambiguous

El estado de membresía de un cliente tiene consecuencias físicas: determina si esa persona puede entrar al gimnasio. Es la información más crítica de cada interacción.

**Implicaciones:**
- Los badges de estado siempre tienen texto visible junto al color
- El color nunca es la única señal (accesibilidad + redundancia)
- Los estados están en la tabla principal, no en una columna oculta o expandible
- Los 5 estados posibles (`activa`, `vencida`, `por vencer`, `congelada`, `cancelada`) tienen representación visual distinta

**Nunca:** "Simplificar" la lista de estados para que se vea menos congestionada.

---

## 4. Trust the Data

Los usuarios de este sistema son operadores de negocio con cultura numérica. Muestran los datos exactos, no aproximaciones.

**Implicaciones:**
- Montos siempre en DOP completo: `RD$ 1,500.00`, no `RD$1.5K`
- Fechas exactas, no relativas: `15/09/2026`, no `en 3 días`
- Exception controlada: El marcador visual "por vencer" añade urgencia sin reemplazar la fecha exacta
- Conteos exactos: `47 clientes activos`, no `~50`

**Nunca:** Ocultar ceros, truncar decimales de montos, usar "aproximadamente".

---

## 5. Forms Are for Staff, Not Self-Service

Los formularios son completados por recepcionistas que ya tienen los datos del cliente frente a ellos (cédula física, formulario en papel, etc.). El objetivo es **velocidad de entrada de datos**, no discovery.

**Implicaciones:**
- Tab order lógico de arriba a izquierda, abajo a derecha
- Pre-fill cuando hay información disponible (membresía activa → monto y concepto)
- Query params para contexto previo (`?cliente=id` en asignar membresía)
- Validación inline, no en modal
- Los datos se preservan tras un error de submit — el usuario corrige, no vuelve a empezar

**Nunca:** Resetear el formulario en un error de red. Nunca asumir que el usuario "puede buscar" la información que ya se le puede pre-cargar.

---

## 6. Primary Action Must Be Obvious

En cada pantalla existe **una** acción principal. Debe ser visualmente dominante.

| Pantalla | Acción primaria |
|---------|----------------|
| Login | Ingresar |
| Dashboard | (No hay — es informativa) |
| Clientes lista | Nuevo cliente |
| Cliente detalle | Asignar membresía (si no tiene) / Editar |
| Membresías lista | Asignar membresía |
| Caja sin turno | Abrir turno |
| Caja con turno | Cobrar (via link) |
| Registro de pago | Cobrar |
| Reportes | Actualizar (filtros) |
| Configuración | Guardar |

**Implicaciones:**
- El botón primario (`.btn-primary` / `background: var(--primary)`) aparece una sola vez por región de contenido
- Los botones secundarios tienen menor peso visual (outlined, no filled)
- Los botones destructivos (desactivar, eliminar) tienen estilo propio y están separados del flujo principal

---

## 7. Destructive Actions Need Explicit Confirmation

Acciones con consecuencias difíciles de revertir requieren un paso adicional.

**Actualmente sin confirmación (gap):**
- Desactivar cliente en `cliente-detalle.component.ts`

**Con confirmación correcta:**
- Cerrar turno de caja (modal con balance esperado vs real)

**Regla:** Una acción es "destructiva" si:
1. Cambia el estado de registros de otros sistemas (cancelar membresía activa), o
2. Es difícil o imposible de deshacer sin intervención manual

Modales de confirmación deben mostrar las consecuencias específicas, no mensajes genéricos como "¿Estás seguro?".

---

## 8. Mobile Is Collapse, Not Redesign

El app se usa principalmente en la computadora del mostrador de recepción. El mobile es una reducción del desktop, no una experiencia separada.

**Lo que cambia en mobile (≤768px):**
- Sidebar: siempre colapsada a íconos (72px)
- Columnas de tabla no críticas: ocultas
- Grids de cards: una sola columna
- Page headers: apilados (título sobre botón)
- Formularios: una columna

**Lo que NO cambia en mobile:**
- Toda la información sigue estando accesible
- Los flujos siguen siendo los mismos
- Las acciones principales siguen siendo alcanzables

**Señal de alerta:** Si una propuesta para mobile oculta funcionalidad detrás de acordeones, es porque el diseño desktop tiene un problema de densidad que no se estaba resolviendo correctamente.

---

## 9. Errors Must Be Specific and Preserve Input

Un error vago (`Algo salió mal`) es peor que ningún error, porque no ayuda al usuario a corregir el problema.

**Formato correcto:**
- Dónde: Banner visible en la parte superior del formulario o sección afectada
- Qué: Descripción específica del error (`El correo electrónico ya está registrado en otro gimnasio`)
- Cómo: Si es accionable, indicar la acción (`Verifica los datos e intenta de nuevo`)

**Preservación de datos:** El formulario nunca se resetea por un error. El usuario ve el error, corrige el campo problemático y vuelve a enviar.

---

## 10. Loading Should Preserve Perceived Performance

El usuario debe tener feedback inmediato cuando inicia una acción, incluso si la respuesta tarda.

**Patrón para botones:** El texto cambia a estado de carga ("Guardando...", "Procesando...", "Ingresando...") y el botón se deshabilita. El spinner inline es la segunda opción si el texto no es suficientemente claro.

**Patrón para páginas:** Un texto "Cargando..." o skeleton mientras llegan los datos. No mostrar una página vacía que parezca un error.

**Nunca:** Un loading que bloquee toda la aplicación (overlay global) para una operación local a una sección.

---

## 11. Navigation Must Maintain Context

El usuario no debe preguntarse "¿dónde estoy?" al navegar.

**Mecanismos existentes:**
- Nav item activo en el sidebar (highlight con `--primary-subtle`)
- `<h1>` de página claro y específico
- Botones "Volver" en formularios y detalles que llevan al listado correcto

**Lo que falta (gap conocido):**
- Breadcrumbs para rutas de más de 2 niveles (ej: `/clientes/123/editar`)
- El `h1` no está definido en todas las páginas (ver `docs/ui-audit.md` I4)

---

## 12. Important Totals Need Visual Priority

Los valores financieros y operativos críticos deben tener la mayor jerarquía visual en su contexto.

**Ejemplos actuales:**
- Balance del turno: `--text-4xl`, `--font-bold` — visible desde la parte superior de la pantalla de caja
- Ingresos del día en dashboard: misma jerarquía que las otras KPIs (correcto — todas son igualmente importantes)
- Monto en tabla de pagos: alineado a la derecha para scanning rápido

**Regla:** En una pantalla con datos financieros, el número final (balance, total, ganancia) debe resolverse primero. El desglose detallado va después.
