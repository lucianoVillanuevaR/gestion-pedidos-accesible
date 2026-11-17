# Auditoría de dependencias de desarrollo

Fecha: 2026-11-17. Rama: `fix/demo-data-safe`.

Se ejecutaron `npm audit --json` y `npm audit fix --dry-run --json` en backend y frontend antes
de modificar dependencias. El `dry-run` propuso, entre otros cambios, bajar Vite a 6.2.7 y Vitest
a 3.1.4; no se aplicó porque no resolvía el advisory sin parche de `picomatch` y suponía cambios
mayores innecesarios. No se usó `npm audit fix --force`, overrides ni exclusiones de auditoría.

| Proyecto | Inicial: altas / moderadas | Actual: altas / moderadas | Producción |
| -------- | -------------------------: | ------------------------: | ---------: |
| Backend  |                     6 / 10 |                    11 / 0 |          0 |
| Frontend |                     13 / 8 |                    11 / 0 |          0 |

El número de avisos altos de backend subió porque npm propaga el mismo advisory de `picomatch`
a más paquetes dependientes tras actualizar `typescript-eslint`; no apareció una vulnerabilidad
directa nueva. La auditoría completa aún falla con `--audit-level=high` en ambos proyectos.

## Cadenas y versiones

| Advisory                                                                                       | Cadenas afectadas                                                                                                                                                                                                                                                                                                                                                            | Estado                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), `minimatch` moderada | `eslint` → `minimatch`; `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch`; backend `rimraf` → `glob` → `minimatch`                                                                                                                                                                                                                                  | Corregida: `minimatch@11.0.9` (primera versión corregida: 11.0.1).                                                                                                                                                               |
| [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), `glob` moderada      | Backend `rimraf` → `glob`                                                                                                                                                                                                                                                                                                                                                    | Corregida: `glob@14.0.6` (primera versión corregida: 14.0.2).                                                                                                                                                                    |
| [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), `picomatch` alta     | Ambos: `vitest` → `picomatch`; `vitest` → `tinyglobby`/`vite` → `picomatch`; `vite` → `fdir` → `picomatch`; `typescript-eslint` → `@typescript-eslint/typescript-estree` → `tinyglobby` → `picomatch`. Inicialmente, frontend también tenía `tailwindcss@3` → `chokidar` → `anymatch`/`readdirp` → `picomatch` y `tailwindcss@3` → `fast-glob` → `micromatch` → `picomatch`. | Sin versión corregida publicada. `picomatch@4.0.7` es la última versión publicada y sigue afectada. Tailwind 4 eliminó las cadenas propias de Tailwind, pero Vite, Vitest y TypeScript ESLint siguen dependiendo de `picomatch`. |

Los 11 nodos altos que informa npm en cada proyecto son `picomatch`, `fdir`, `tinyglobby`,
`vite`, `vitest`, `@typescript-eslint/typescript-estree`, `@typescript-eslint/parser`,
`@typescript-eslint/type-utils`, `@typescript-eslint/utils`, `@typescript-eslint/eslint-plugin`
y `typescript-eslint`. Son metavulnerabilidades de la única cadena directa restante.

Se actualizaron ESLint a 10.15.0, TypeScript ESLint a 8.73.0 y, en backend, Rimraf a 6.1.4.
En frontend se actualizó Vite a 7.3.8 y Tailwind CSS a 4.3.5 con
`@tailwindcss/postcss@4.3.5`; se retiró Autoprefixer porque Tailwind 4 ya procesa el CSS mediante
su nuevo plugin PostCSS. Vitest 4.1.12 se mantuvo: Vitest 5.1.0 también depende directamente de
`picomatch` y su actualización mayor no solucionaría el advisory.

## Riesgo residual y control

El caso descrito por el advisory exige patrones glob especialmente construidos. En este proyecto
los patrones de Vite, Vitest, Tailwind y ESLint se definen en código y configuración del repositorio;
no se aceptan patrones glob de usuarios finales. Las dependencias de desarrollo no se instalan en
la imagen de producción del backend. Los lockfiles y `npm ci` fijan las versiones auditadas.

La auditoría de producción permanece obligatoria en CI. No se incorpora aún
`npm audit --audit-level=high` para todas las dependencias como paso obligatorio porque fallaría
con un advisory sin parche; tampoco se lo oculta con `|| true` o `continue-on-error`.
Cuando se publique una versión corregida de `picomatch`, se deberá actualizar el lockfile,
repetir las pruebas completas y añadir ese control estricto al workflow.

## Verificación local

- `npm ci` y `npm run check` en ambos proyectos: correctos; 193 pruebas de backend y 272 de frontend.
- `npm audit --omit=dev --audit-level=high`: cero vulnerabilidades en ambos proyectos.
- `npm audit --json`: 11 altas, cero críticas, moderadas y bajas en cada proyecto.
- Configuraciones Docker de desarrollo, demostración y producción válidas. El stack de prueba
  aislado compiló backend/frontend, aplicó migraciones y pasó los healthchecks sin tocar los
  volúmenes de la demostración.
- Catálogo aislado con 12 productos y ocho fotografías originales sincronizadas; seed de 120
  pedidos y nueve turnos. Playwright y accesibilidad: 31 pruebas aprobadas y una omisión
  intencional de una prueba que solo se ejecuta en escritorio; cero fallos.
- La prueba E2E de categorías del modo fácil espera el estado inicial del turno y comprueba
  hover en dispositivos compatibles o interacción táctil en móvil, sin omitir el caso. También
  pasó por separado en un segundo stack aislado con turno inicialmente cerrado, como en CI.
