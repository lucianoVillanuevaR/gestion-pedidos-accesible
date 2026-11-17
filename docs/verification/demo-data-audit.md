# Auditoría de los datos de demostración

La preparación de `fix/demo-data-safe` conserva el catálogo del negocio: doce productos, precios,
categorías y variantes originales. Las ocho fotografías asociadas se guardan en el bucket `productos`
y se entregan por `/media`; la sincronización compara SHA-256 y no sobrescribe imágenes existentes.
El seed de pedidos crea 120 pedidos simulados distribuidos en nueve turnos, con historial de estados,
usuarios de Caja y Cocina, métodos de pago y estados de preparación variados.

Las cuentas Administrador, Cajero y Cocina se crean solo cuando se solicita `seed:demo-users` y se
establece `SEED_DEMO_PASSWORD`. `seed:demo` exige el entorno de demostración y comprueba el aislamiento
de la base antes de escribir. Ninguno de estos seeds forma parte del arranque de producción. Las
credenciales, bases y volúmenes de la demostración son independientes de la instalación habitual.

Para validar una instancia, comprueba la salud de frontend, backend, PostgreSQL y MinIO; cuenta
productos, pedidos y turnos en la base aislada; abre el catálogo y las imágenes; y recorre Caja →
Cocina → Caja con una cuenta de prueba. La [guía de demostración](../demostracion-y-despliegue.md)
contiene los comandos para preparar esa instancia sin intervenir los datos reales.
