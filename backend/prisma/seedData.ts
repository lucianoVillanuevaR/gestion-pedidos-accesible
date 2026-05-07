/**
 * Uso en prisma/seed.ts:
 * 
 * import { productosAccessibles } from './seedData';
 * 
 * async function main() {
 *   // ... código anterior ...
 *   
 *   for (const producto of productosAccessibles) {
 *     await prisma.producto.create({ data: producto });
 *   }
 * }
 */

export const productosAccessibles = [
  // SANDWICHES
  {
    nombre: "Hamburguesa Clásica",
    precio: 8990,
    descripcion: "Pan tostado, carne de res, lechuga y tomate",
    imagen:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    altText:
      "Hamburguesa clásica con carne, lechuga y tomate sobre pan tostado",
    categoria: "Sandwich",
    destacado: true,
    activo: true
  },
  {
    nombre: "Hamburguesa Queso",
    precio: 9990,
    descripcion: "Hamburguesa con queso fundido y cebolla caramelizada",
    imagen:
      "https://images.unsplash.com/photo-1550547990-cb78cedd49ef?w=400&h=400&fit=crop",
    altText:
      "Hamburguesa con queso fundido, cebolla caramelizada y lechuga fresca",
    categoria: "Sandwich",
    destacado: true,
    activo: true
  },
  {
    nombre: "Completo Italiano",
    precio: 7990,
    descripcion:
      "Pan con carne molida, cebolla, tomate, aguacate y mayonesa",
    imagen:
      "https://images.unsplash.com/photo-1555939594-58d7cb561bae?w=400&h=400&fit=crop",
    altText:
      "Completo italiano con carne, cebolla, tomate, aguacate y mayonesa",
    categoria: "Sandwich",
    destacado: false,
    activo: true
  },
  {
    nombre: "Sandwich Pollo",
    precio: 8490,
    descripcion: "Pechuga de pollo a la parrilla con queso y mostaza",
    imagen:
      "https://images.unsplash.com/photo-1562547256-ccc27de21a5b?w=400&h=400&fit=crop",
    altText:
      "Sándwich de pollo a la parrilla con queso amarillo y mostaza",
    categoria: "Sandwich",
    destacado: false,
    activo: true
  },

  // BEBIDAS
  {
    nombre: "Coca Cola",
    precio: 2990,
    descripcion: "Bebida refrescante 350ml",
    imagen:
      "https://images.unsplash.com/photo-1554866585-39b68f1dc84c?w=400&h=400&fit=crop",
    altText: "Botella de Coca Cola de 350ml",
    categoria: "Bebidas",
    destacado: false,
    activo: true
  },
  {
    nombre: "Jugo Natural",
    precio: 3990,
    descripcion: "Jugo de naranja natural recién exprimido",
    imagen:
      "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop",
    altText: "Vaso de jugo de naranja natural recién exprimido",
    categoria: "Bebidas",
    destacado: false,
    activo: true
  },
  {
    nombre: "Agua Mineral",
    precio: 1990,
    descripcion: "Agua mineral embotellada 500ml",
    imagen:
      "https://images.unsplash.com/photo-1608270861620-7911c3bda47b?w=400&h=400&fit=crop",
    altText: "Botella de agua mineral embotellada",
    categoria: "Bebidas",
    destacado: false,
    activo: true
  },
  {
    nombre: "Café Espresso",
    precio: 2490,
    descripcion: "Café espresso doble bien caliente",
    imagen:
      "https://images.unsplash.com/photo-1559056169-641ef0ac8b9d?w=400&h=400&fit=crop",
    altText: "Taza de café espresso doble bien caliente",
    categoria: "Bebidas",
    destacado: false,
    activo: true
  },

  // EXTRAS
  {
    nombre: "Papas Fritas",
    precio: 2990,
    descripcion: "Papas fritas crujientes 200g",
    imagen:
      "https://images.unsplash.com/photo-1585238341710-4b4e6f289635?w=400&h=400&fit=crop",
    altText:
      "Porción de papas fritas crujientes en contenedor de cartón",
    categoria: "Extras",
    destacado: false,
    activo: true
  },
  {
    nombre: "Aros de Cebolla",
    precio: 3490,
    descripcion: "Aros de cebolla rebozados y fritos 180g",
    imagen:
      "https://images.unsplash.com/photo-1612874742237-415221581fb3?w=400&h=400&fit=crop",
    altText:
      "Porción de aros de cebolla rebozados y dorados en plato",
    categoria: "Extras",
    destacado: false,
    activo: true
  },
  {
    nombre: "Alitas BBQ",
    precio: 5990,
    descripcion: "6 alitas de pollo con salsa BBQ",
    imagen:
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc7ec?w=400&h=400&fit=crop",
    altText:
      "Alitas de pollo glaseadas con salsa BBQ en contenedor",
    categoria: "Extras",
    destacado: false,
    activo: true
  },
  {
    nombre: "Ensalada Fresca",
    precio: 4990,
    descripcion: "Ensalada mixta con lechuga, tomate, zanahoria",
    imagen:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=400&fit=crop",
    altText:
      "Ensalada fresca con lechuga verde, tomate y zanahoria rallada",
    categoria: "Extras",
    destacado: false,
    activo: true
  }
];

/**
 * EJEMPLOS DE USO EN SEED.TS
 * 
 * import { PrismaClient } from '@prisma/client';
 * import { productosAccessibles } from './seedData';
 * 
 * const prisma = new PrismaClient();
 * 
 * async function main() {
 *   console.log('🌱 Iniciando seed...');
 * 
 *   // Limpiar productos existentes
 *   await prisma.producto.deleteMany();
 * 
 *   // Crear productos accesibles
 *   for (const producto of productosAccessibles) {
 *     const created = await prisma.producto.create({
 *       data: producto
 *     });
 *     console.log(`✅ Producto creado: ${created.nombre}`);
 *   }
 * 
 *   console.log('🎉 Seed completado');
 * }
 * 
 * main()
 *   .catch((e) => {
 *     console.error(e);
 *     process.exit(1);
 *   })
 *   .finally(async () => {
 *     await prisma.$disconnect();
 *   });
 */

/**
 * URLS DE IMÁGENES ALTERNATIVAS
 * 
 * Si Unsplash no funciona, usar estas alternativas:
 * 
 * HAMBURGUESAS:
 * - https://via.placeholder.com/400x400?text=Hamburguesa
 * - https://picsum.photos/400/400?random=1
 * 
 * BEBIDAS:
 * - https://via.placeholder.com/400x400?text=Bebida
 * - https://picsum.photos/400/400?random=2
 * 
 * EXTRAS:
 * - https://via.placeholder.com/400x400?text=Extra
 * - https://picsum.photos/400/400?random=3
 * 
 * - /images/hamburguesa.jpg
 * - /images/bebida.jpg
 * - /images/extra.jpg
 */

/**
 * ACTUALIZAR SEED.TS ACTUAL
 * 
 * Si tienes un seed.ts existente, reemplaza la parte de productos con:
 * 
 * ========================================
 * // Crear productos
 * console.log('📦 Creando productos...');
 * 
 * const productos = await prisma.producto.createMany({
 *   data: productosAccessibles,
 *   skipDuplicates: true
 * });
 * 
 * console.log(`✅ ${productos.count} productos creados`);
 * ========================================
 */

/**
 * ALTERNATIVA: Usar directamente en Prisma Studio
 * 
 * 1. npx prisma studio
 * 2. Ir a tabla Producto
 * 3. Agregar nuevo registro
 * 4. Copiar datos del array arriba
 */

/**
 * VALIDAR INTEGRACIÓN
 * 
 * Después de ejecutar seed:
 * 
 * 1. npx prisma db seed
 * 2. Verificar en npx prisma studio
 * 3. Abrir navegador: http://localhost:5173
 * 4. Ver aplicación con imágenes
 * 5. Activar Modo Accesible
 * 6. Confirmar que imágenes se ven más grandes
 */
