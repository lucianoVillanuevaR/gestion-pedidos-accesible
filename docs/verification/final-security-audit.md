# Auditoría final de seguridad

Fecha de ejecución: 2026-10-28  
Rama: `fix/final-security-audit`  
Base: `origin/main` en `4d2cb63`

## Dependencias

La instalación inicial reproducible (`npm ci`) arrojó estos resultados:

| Proyecto | `npm audit --omit=dev` |                       `npm audit` |
| -------- | ---------------------: | --------------------------------: |
| Backend  |            5 moderadas | 11 (1 baja, 7 moderadas, 3 altas) |
| Frontend |                      0 | 11 (1 baja, 4 moderadas, 6 altas) |

Se actualizaron únicamente versiones admitidas por los rangos SemVer existentes. No se usó
`npm audit fix --force` ni se cambió ninguna dependencia directa a una versión mayor.

Actualizaciones relevantes del backend:

- `qs` 6.16.0 -> 6.16.2 (incorporada por `express`/`body-parser`). Corrige
  GHSA-6pq8-jhm2-2vcw, una denegación de servicio al serializar arreglos en formato `comma`;
  la primera versión corregida es 6.16.1.
- `vitest` y `@vitest/mocker` 4.1.9 -> 4.1.12.
- `vite` 8.0.16 -> 8.3.5.
- `tsx` 4.21.0 -> 4.23.15 y `esbuild` 0.27.7 -> 0.28.2.
- `source-map-js` 1.2.1 -> 1.2.2 y `brace-expansion` 5.0.9 -> 5.0.12.
- `eslint` 10.5.0 -> 10.13.0 y `minimatch` 10.2.5 -> 10.2.6.

Actualizaciones relevantes del frontend:

- `vitest`/`@vitest/mocker` 4.1.9 -> 4.1.12 y `vite` 7.3.5 -> 7.3.7.
- `esbuild` 0.27.7 -> 0.28.2, `source-map-js` 1.2.1 -> 1.2.2 y
  `brace-expansion` 5.0.9 -> 5.0.12.
- `baseline-browser-mapping` 2.10.23 -> 2.11.34 y `browserslist` 4.28.2 -> 4.29.5.
- `postcss-selector-parser` 6.1.2 -> 6.1.5, `undici` 7.29.0 -> 7.30.1 y
  `zod` 4.4.3 -> 4.6.7.

Resultado final:

| Proyecto | `npm audit --omit=dev` | `npm audit` |
| -------- | ---------------------: | ----------: |
| Backend  |            4 moderadas | 4 moderadas |
| Frontend |                      0 |           0 |

### Riesgo residual de MinIO

Los cuatro nodos que permanecen son una sola cadena de la dependencia directa `minio@8.0.7`,
que es la última versión publicada:

| Nodo informado         | Versión | Incorporado por                 | Hallazgo y corrección publicada                                                                                                                                      |
| ---------------------- | ------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decode-uri-component` | 0.2.2   | `minio` -> `query-string@7.1.3` | GHSA-vcc3-ghjq-m6fr, DoS por decodificación exponencial; corregido en 0.5.0.                                                                                         |
| `query-string`         | 7.1.3   | `minio@8.0.7`                   | Nodo metavulnerable por `decode-uri-component`; una rama sin esa dependencia exige `query-string@10`.                                                                |
| `stream-json`          | 1.9.1   | `minio@8.0.7`                   | GHSA-528h-pc64-c93x (DoS, corregido en 3.5.0), GHSA-hqr4-qq8f-hg3x (DoS, corregido en 3.6.0) y GHSA-mjw6-4jj6-33hc (contaminación de prototipo, corregido en 3.6.0). |
| `minio`                | 8.0.7   | dependencia directa             | Nodo metavulnerable por las dos ramas transitivas anteriores; no existe una versión 8.x posterior publicada.                                                         |

No se aplicaron overrides porque no son compatibles:

- `decode-uri-component@0.5.x` y `query-string@10` son ESM, mientras que la salida CommonJS de
  `minio@8.0.7` carga `query-string@7` mediante `require()`.
- `stream-json@3.x` es ESM y cambió sus subrutas exportadas; MinIO carga
  `stream-json/jsonl/Parser.js` desde CommonJS.
- `npm audit` propone bajar MinIO a 7.1.3. Una reproducción aislada confirmó que esa versión aún
  instala `query-string@7.1.3` y `decode-uri-component@0.2.2`, termina con cuatro moderadas y además
  introduce un hallazgo en `fast-xml-parser`. Por tanto, la propuesta no corrige la cadena y supone
  un salto mayor regresivo.

Mitigación actual: la aplicación solo utiliza las operaciones de bucket y objetos de MinIO; no usa
`listenBucketNotification`, que es el camino que carga el parser JSONL. Las consultas S3 se forman
con opciones internas y no con cadenas de consulta aportadas directamente por el cliente. El cuerpo
JSON HTTP está limitado a 100 KiB. Se debe actualizar MinIO tan pronto como el proveedor publique una
versión compatible que elimine estas ramas.

## Autorización de pedidos

`PATCH /pedidos/:id/estado` ahora:

- toma el mismo bloqueo transaccional usado al abrir y cerrar turnos;
- busca el pedido dentro de un turno `abierto` y responde 404 fuera de ese ámbito;
- conserva sin cambios la matriz de transiciones de Cajero, Cocina y Administrador;
- conserva la cancelación idempotente y el control de concurrencia existente.

Las pruebas de regresión cubren Cajero, Cocina y Administrador ante pedidos de turnos cerrados, y dos
cancelaciones repetidas con una sola restitución de inventario, una sola actualización y un solo
registro de historial. También siguen pasando las pruebas previas de transiciones no autorizadas.

## Verificaciones finales

- Backend `npm ci`: correcto.
- Backend `npm run check`: formato, lint, 183 pruebas y compilación correctos.
- Frontend `npm ci`: correcto.
- Frontend `npm run check`: formato, lint, 263 pruebas y compilación correctos.
- Playwright: 23 correctas, 1 omitida por la condición prevista del escenario móvil, 0 fallos.
- `docker compose config` de desarrollo y producción: correcto.
- Imágenes Docker de backend, frontend, migración y seed: compiladas correctamente.
- Migración, seed y healthchecks del stack aislado: correctos.

La ejecución del workflow remoto de CI y la actualización del informe LaTeX quedan pendientes de la
publicación/aprobación e integración de la rama. No hay fuentes LaTeX en este repositorio ni en el
workspace suministrado, por lo que no se modificó ni compiló el informe en esta etapa.
