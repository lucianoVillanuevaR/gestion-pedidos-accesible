# Verificación de rendimiento de los modales en Firefox

El filtro CSS `backdrop-blur-[1px]` estaba aplicado a superposiciones que cubren toda la ventana.
Al mover el puntero sobre contenido cambiante detrás del configurador, Firefox/X11 podía tener que
recomponer el área desenfocada. Se retiró ese filtro y se conservó el oscurecimiento `bg-black/40`.
Las sombras del panel permanecen, y no se añadieron capas GPU forzadas.

No se dispone de una sesión gráfica Firefox sobre Debian 13/X11 en el entorno de validación. Por
ello no hay una medición de FPS antes/después ni se afirma una mejora cuantificada. Para verificarla
en el equipo de demostración:

1. Abre Firefox en la sesión X11 con la misma resolución y escala habituales; cierra otras pestañas.
2. En el PDV, abre el configurador de un completo y mueve el puntero durante 15 segundos sobre el
   catálogo visible detrás. Repite en modo fácil y con alto contraste.
3. Usa el panel **Rendimiento** de Firefox DevTools para grabar cada recorrido y anota la tasa de
   cuadros, tiempo de composición y repintados. Registra también la fluidez con el modal cerrado.
4. Compara con una compilación anterior en las mismas condiciones, sin modificar los datos de la
   demostración. Comprueba Escape, Tab, Shift+Tab, restauración de foco y uso táctil/responsive.

Las pruebas automáticas verifican que el filtro del fondo es `none`, que el fondo oscuro sigue
presente y que los diálogos conservan atributos ARIA y manejo de teclado.
