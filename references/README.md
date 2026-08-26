# References — Fitness Factory

Este directorio almacena referencias visuales para mejorar la interfaz de Fitness Factory.

---

## Qué poner aquí

Screenshots, capturas o mockups de:

- Layouts de sistemas operativos similares (POS, ERP, admin panels)
- Patrones de tablas con alta densidad de datos
- Modales y overlays bien diseñados
- Navegación en apps de gestión (sidebar, breadcrumbs, tabs)
- Formularios de entrada rápida de datos
- Interfaces POS para gimnasios, clínicas, oficinas de recepción
- Dashboards operativos (no de analytics SaaS)
- Diseños de UI para móvil que manejen tablas o formularios complejos

---

## Convención de nombres

```
[feature]-[fuente]-[YYYY-MM].png

Ejemplos:
cash-register-pos-2026-08.png
membership-list-gymsoft-2026-07.png
client-form-mobile-figma-2026-08.png
dashboard-operational-2026-08.png
```

---

## Cómo usar las referencias

Las referencias existen para **extraer principios**, no para copiar productos.

Al usar una referencia con `.codex/skills/reference-to-ui/SKILL.md`:

1. Identificar: ¿qué resuelve bien esta referencia? (densidad, jerarquía, interacción, layout)
2. Extraer el principio, no el pixel
3. Mapear cada elemento al token equivalente en `src/styles/tokens.css`
4. Implementar con el dark theme de Fitness Factory, en español, con los componentes existentes

---

## Lo que NO va aquí

- Screenshots con datos reales de clientes o gym (datos sensibles)
- Logos o assets de marca de otras empresas
- Diseños bajo licencia restrictiva
- Mockups del estado actual de la aplicación (para eso está `docs/ui-audit.md`)

---

## Directorio actual

*(Vacío — añadir referencias según el proyecto las necesite)*
