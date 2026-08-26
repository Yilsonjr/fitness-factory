# Design Decisions — Fitness Factory

Registro de decisiones de diseño e ingeniería. Las decisiones futuras deben añadirse con el mismo formato.

El propósito es que nadie "corrija" algo que fue una decisión intencional.

---

## Template

```markdown
## [Título]

**Fecha:** YYYY-MM-DD  
**Estado:** Activa / Deprecada / Pendiente

### Problem
¿Qué problema existe o existía?

### Options Considered
- Opción A: descripción + tradeoffs
- Opción B: descripción + tradeoffs

### Selected Approach
¿Cuál se eligió?

### Reason
¿Por qué se eligió esta opción sobre las otras?

### Consequences
¿Qué implica esta decisión para el futuro?
```

---

## Decisiones activas

---

### Template-Driven Forms en formularios existentes

**Fecha:** 2026-08-21 (documentado retroactivamente)  
**Estado:** Activa (excepción documentada)

### Problem
`AGENTS.md` establece que se deben preferir Reactive forms. Sin embargo, todos los formularios existentes usan template-driven forms (`FormsModule`, `[(ngModel)]`). Hay una inconsistencia entre la política y la implementación.

### Options Considered
- **Opción A — Migrar todos los formularios a Reactive:** Correcto desde el punto de vista de la política. Alta consistencia. Alto riesgo (7 formularios, algunos complejos como ClienteFormComponent con foto upload y auto-format de cédula).
- **Opción B — Mantener template-driven para existentes, Reactive para nuevos:** Introduce inconsistencia de patrones en el codebase, pero es pragmático y no introduce regresiones.
- **Opción C — Actualizar AGENTS.md para validar template-driven:** Retrocede de la política sin mejora técnica.

### Selected Approach
Opción B — mantener los formularios existentes en template-driven, usar Reactive forms para todos los formularios nuevos.

### Reason
Los formularios existentes funcionan correctamente. La migración requiere tiempo significativo con riesgo de introducir bugs (validación, el auto-format de cédula, el file upload, los query params de pre-fill). El beneficio principal de Reactive forms (testabilidad y validación async) no justifica ese riesgo para formularios que ya tienen cobertura funcional.

### Consequences
- Los nuevos formularios deben usar `ReactiveFormsModule` + `FormBuilder`
- Los tests de formularios existentes mantienen su patrón actual
- Agentes de código deben leer esta decisión antes de "corregir" los formularios existentes
- Si se añade validación async (ej: verificar cédula duplicada via API), eso es un trigger válido para migrar ese formulario específico a Reactive

---

### Inline Templates y Styles en Componentes

**Fecha:** 2026-08-21 (documentado retroactivamente)  
**Estado:** Activa

### Problem
Angular permite templates/styles inline o en archivos separados. ¿Cuál usar?

### Options Considered
- **Inline (`template` y `styles`):** Todo en un archivo. Más fácil de leer el componente de una sola vez. Algunos linters y editors tienen soporte limitado para HTML/CSS dentro de template literals.
- **Archivos separados (`templateUrl`, `styleUrls`):** Mejor soporte de editor (HTML intellisense, CSS linting). Más archivos para navegar.

### Selected Approach
Inline templates y styles para todos los componentes.

### Reason
Los componentes son más legibles cuando son completamente auto-contenidos. El proyecto usa `.ts` files con template inline desde el inicio y la convención ya está establecida. Cambiar a mitad del proyecto crearía inconsistencia.

### Consequences
- Los componentes grandes (ej: `configuracion.component.ts`) son archivos largos. Aceptable.
- Si un componente excede ~400 líneas, evaluar si debe dividirse en componentes más pequeños (no en archivos separados).
- La regla se mantiene para nuevos componentes.

---

### CSS Puro sin Framework (No Tailwind, No Angular Material)

**Fecha:** 2026-08-21 (documentado retroactivamente)  
**Estado:** Activa (decisión firme)

### Problem
¿Qué CSS strategy usar para el proyecto?

### Options Considered
- **Angular Material:** UI kit completo, accesibilidad incorporada, theming system. Visual identity muy reconocible (Material Design), difícil de salir del patrón.
- **Tailwind CSS:** Utility-first, flexible, buena integración con Angular. El output visual tiende a ser genérico (cards redondeadas, gradientes comunes).
- **CSS puro con custom properties:** Control total sobre la visual identity. Más CSS a escribir. Requiere más disciplina para mantener consistencia.

### Selected Approach
CSS puro con custom properties definidas en `src/styles/tokens.css`.

### Reason
El producto debe tener identidad visual propia. Los frameworks imponen su propio lenguaje visual que es difícil de sobreescribir completamente. El costo (más CSS manual) es justificado por el control total sobre cada decisión visual.

### Consequences
- Todos los estilos de componentes son responsabilidad del equipo. No hay "defaults seguros" del framework.
- La inconsistencia visual es un riesgo mayor que con un framework — mitigado por `design.md` y `tokens.css`.
- Ninguna dependencia de UI library que pueda deprecarse o cambiar su API.

---

### Single Responsive Breakpoint (768px)

**Fecha:** 2026-08-21 (documentado retroactivamente)  
**Estado:** Activa

### Problem
¿Cuántos breakpoints responsive usar?

### Options Considered
- **Un breakpoint (768px):** Simple, mobile = tablet = lo mismo. El app es desktop-primary.
- **Tres breakpoints (768px, 1024px, 1280px):** Más granularidad. Mayor costo de mantenimiento.

### Selected Approach
Un solo breakpoint: `@media (max-width: 768px)`.

### Reason
El app se usa en computadoras de escritorio en recepción. El uso mobile es secundario. La complejidad de múltiples breakpoints no se justifica para los pocos usuarios que acceden en tablet o móvil. Además, el design ya está calibrado para desktop — el breakpoint único es un "collapse" del layout desktop, no un diseño mobile independiente.

### Consequences
- Tablet (768px–1024px) y mobile (<768px) reciben el mismo tratamiento.
- Si se detecta uso significativo en tablet (iPad en recepción, por ejemplo), evaluar un breakpoint intermedio.

---

### 4 KPI Cards en Dashboard

**Fecha:** 2026-08-21 (documentado retroactivamente)  
**Estado:** Activa (no modificar sin razón de producto)

### Problem
El patrón "Sidebar + 4 KPI cards + gráfica + actividad reciente" es el dashboard más genérico del ecosistema SaaS. ¿Es apropiado para este producto?

### Options Considered
- **Dashboard operativo con las 4 métricas actuales:** Activas, Por vencer, Vencidas, Ingresos del día.
- **Dashboard con gráficas de tendencia:** Más "premium", pero agrega complejidad y latencia de datos.
- **Dashboard sin KPIs, solo acciones rápidas:** Más simple, pero pierde el valor informativo al llegar.

### Selected Approach
Las 4 KPI cards actuales son la decisión correcta **para este producto específico**, y se mantienen.

### Reason
Las 4 métricas no son decorativas. Cada una mapea a una acción específica del día:
- **Activas** → validar que el negocio está en marcha
- **Por vencer** → saber a quiénes llamar hoy para renovar
- **Vencidas** → saber cuántos clientes se han perdido (posibles llamadas de recuperación)
- **Ingresos del día** → validar que el turno de caja está correcto

El hecho de que el patrón sea común no lo hace incorrecto. Es común porque resuelve el problema correcto.

### Consequences
- No añadir más KPIs al dashboard sin validación de que los usuarios los necesitan al llegar
- No reemplazar las cards con gráficas — la información numérica exacta es más útil que una tendencia visual para operaciones diarias
- No cambiar el orden sin razón — el orden actual refleja prioridad de atención

---

### DOP como Moneda Fija

**Fecha:** 2026-08-21 (documentado retroactivamente)  
**Estado:** Activa

### Problem
`config_sistema` tiene un campo `moneda: string`. ¿Debería la UI exponer un selector de moneda?

### Options Considered
- **Moneda configurable:** Más flexible, más complejo.
- **DOP fijo:** El producto opera exclusivamente en República Dominicana. Simplifica el código.

### Selected Approach
DOP fijo. El campo `moneda` en `config_sistema` existe pero no está expuesto como UI configurable en `configuracion.component.ts`.

### Reason
No hay necesidad de negocio para múltiples monedas en el alcance actual. Añadir el selector introduce complejidad (formatting, validación, futuras conversiones) sin beneficio real.

### Consequences
- Todos los formateos usan `Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })`
- Si el producto expande a otros países con otras monedas, esta decisión debe revisarse
- Pendiente: crear un shared `CurrencyDopPipe` para evitar la duplicación del formato en 4+ componentes

---

### Umbral "Por Vencer" — Inconsistencia Pendiente de Resolución

**Fecha:** 2026-08-21  
**Estado:** Pendiente de decisión de producto

### Problem
El sistema usa dos umbrales diferentes para "por vencer":
- Dashboard (`estaProximoAVencer` en `ClientesService`): 3 días
- MembresiasLista (`estadoVisual`): 7 días
- Reportes: 7 días

### Options Considered
- **3 días:** Menos notificaciones, más urgente.
- **7 días:** Más tiempo de reacción para llamar al cliente.

### Selected Approach
Pendiente de decisión. Recomendación técnica: **7 días** (alineado con la mayoría del sistema).

### Reason
7 días da suficiente tiempo para contactar al cliente, programar el pago y procesar la renovación antes del vencimiento. 3 días puede resultar en que algunos clientes venzan sin ser contactados a tiempo.

### Consequences
- Una vez decidido, actualizar `ClientesService.estaProximoAVencer()` al valor acordado
- Actualizar el texto del dashboard ("Por vencer en X días")
- Documentar el estándar en `docs/product.md` bajo Business Rules

---

### Configuración dividida por dominio

**Fecha:** 2026-08-23  
**Estado:** Activa

### Problem
La Configuración concentraba datos institucionales, planes, parámetros operativos y usuarios en una sola pantalla.

### Options Considered
- Mantener una sola página con secciones largas.
- Dividir por responsabilidad con navegación secundaria.

### Selected Approach
Dividir Configuración en General, Membresías, Operación y Usuarios y acceso.

### Reason
Cada dominio tiene una responsabilidad distinta y puede crecer sin volver a crear una pantalla interminable.

### Consequences
- La navegación principal sigue compacta.
- Los botones de guardado quedan claramente asociados a un solo dominio.

---

### Usuarios y acceso separados conceptualmente

**Fecha:** 2026-08-23  
**Estado:** Activa

### Problem
"Agregar recepcionista" era una implementación puntual, no una arquitectura sostenible de usuarios.

### Options Considered
- Inventar un sistema genérico de usuarios en frontend.
- Mantener el soporte real y documentar límites.

### Selected Approach
Usar "Usuarios y acceso" como concepto, pero limitar la creación al backend real disponible.

### Reason
El backend actual solo soporta creación de recepcionistas y no expone RBAC granular.

### Consequences
- Generic user creation remains future capability.
- La UI deja de pensar en recepción como único modelo mental.

---

### Roles y permisos como future capability

**Fecha:** 2026-08-23  
**Estado:** Activa

### Problem
No existe tabla de roles/permisos ni mapping de autorización granular en backend.

### Options Considered
- Simular permisos en frontend.
- Mostrar únicamente lo soportado.

### Selected Approach
No simular RBAC; documentarlo como future capability.

### Reason
La autorización real debe validarse en backend.

### Consequences
- No hay checkboxes falsos de permisos.
- El frontend solo refleja los roles reales (`admin`, `recepcionista`).

---

### Reportes por dominio con rango compartido

**Fecha:** 2026-08-23  
**Estado:** Activa

### Problem
Una sola vista de reportes mezclaba finanzas, ventas, membresías y caja.

### Options Considered
- Mantener una pantalla única.
- Dividir en subrutas con un filtro de período compartido.

### Selected Approach
Dividir Reportes en subrutas por dominio y reutilizar el rango de fechas.

### Reason
Cada reporte responde una pregunta distinta y la navegación debe ayudar a encontrarla rápido.

### Consequences
- `Ventas anuladas` deja de competir como acción primaria.
- Los reportes pueden crecer sin convertir el módulo en un muro vertical.

---

### `color_tema` legado no editable

**Fecha:** 2026-08-23  
**Estado:** Activa

### Problem
El backend conserva `tema_color`, pero la identidad visual ya quedó definida por el design system.

### Options Considered
- Mantenerlo editable.
- Conservarlo por compatibilidad y ocultarlo de la UI.

### Selected Approach
Conservarlo en backend, no exponer edición en UI.

### Reason
Evita regresiones visuales y protege la marca charcoal + electric lime.

### Consequences
- No hay retorno accidental al azul de sistema.
- Si el campo desaparece del backend, la UI no depende de él.
