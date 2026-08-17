# Accesibilidad

El sistema combina una interfaz semántica compatible con tecnologías de asistencia y un modo fácil para tareas
operativas. La ayuda por voz complementa, pero no reemplaza, lectores de pantalla como NVDA, Orca o VoiceOver.

## Capacidades

- Modo fácil con recorridos específicos para ventas, pedidos, cocina, productos, inventario y cierre de turno.
- Tamaño de texto persistente, contraste alto y respeto por `prefers-reduced-motion`.
- Navegación por teclado, enlace para saltar al contenido e indicadores de foco visibles.
- Diálogos con foco inicial, encierro de Tab, cierre con Escape y restauración del foco.
- Regiones vivas para cambios de ruta, estados, confirmaciones y errores.
- Ayuda por voz en español con control de repeticiones y aviso visible cuando el navegador no la soporta.
- Retroalimentación sonora opcional en acciones importantes de PDV, Pedidos, Cocina, Turnos, Productos, Inventario
  y Administración. Distingue confirmaciones (`success`), condiciones que requieren atención (`warning`), fallos
  (`error`) y nuevos pedidos en Cocina (`notification`).
- Volumen persistente Suave, Normal o Fuerte. Los sonidos están desactivados por defecto y siempre complementan
  mensajes visuales; nunca son la única fuente de información.

## Verificación automática

```bash
cd frontend
npm run test:a11y
npm run test:e2e:a11y
```

La primera orden ejecuta auditorías de componentes con Axe. La segunda prueba en Chromium de escritorio y móvil:

- reglas WCAG 2 A/AA, WCAG 2.1 A/AA y WCAG 2.2 AA detectables automáticamente;
- apertura, encierro y restauración del foco usando teclado;
- texto grande y ausencia de desbordamiento horizontal en viewport móvil.

La CI ejecuta ambas verificaciones y conserva capturas/trazas cuando Playwright encuentra un fallo.

## Revisión manual recomendada antes de una entrega

1. Completar el flujo de un pedido usando solo Tab, Shift+Tab, Enter, Espacio y Escape.
2. Probar al 200 % de zoom y a un ancho equivalente a 320 píxeles CSS.
3. Revisar las rutas principales con NVDA/Firefox, Orca/Firefox o VoiceOver/Safari.
4. Confirmar que la información no dependa únicamente de color, sonido o voz.
5. Validar contraste y comprensión con usuarios representativos del contexto de uso.

Las herramientas automáticas detectan errores técnicos frecuentes, pero no certifican por sí solas el
cumplimiento integral de WCAG ni sustituyen una evaluación con personas.
