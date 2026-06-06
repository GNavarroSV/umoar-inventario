import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type MenuSeed = {
  name: string;
  label: string;
  path: string;
  icon: string;
  order: number;
};

const menus: MenuSeed[] = [
  { name: 'dashboard', label: 'Inicio', path: '/dashboard', icon: 'dashboard', order: 1 },
  { name: 'assets', label: 'Activos', path: '/dashboard/assets', icon: 'table', order: 2 },
  { name: 'assignments', label: 'Custodia y prestamos', path: '/dashboard/assignments', icon: 'id-card', order: 3 },
  { name: 'imports', label: 'Carga masiva', path: '/dashboard/imports', icon: 'table', order: 4 },
  { name: 'cost-centers', label: 'Centros de costo', path: '/dashboard/cost-centers', icon: 'gear', order: 5 },
  { name: 'suppliers', label: 'Proveedores', path: '/dashboard/suppliers', icon: 'person', order: 6 },
  { name: 'categories', label: 'Categorías', path: '/dashboard/categories', icon: 'table', order: 7 },
  { name: 'people', label: 'Personas', path: '/dashboard/people', icon: 'person', order: 8 },
  { name: 'roles', label: 'Usuarios y roles', path: '/dashboard/roles', icon: 'person', order: 9 },
  { name: 'menus', label: 'Menús', path: '/dashboard/menus', icon: 'gear', order: 10 },
  { name: 'users', label: 'Usuarios', path: '/dashboard/users', icon: 'person', order: 11 },
];

const categories = [
  { name: 'Computo', description: 'Equipos de computacion y perifericos' },
  { name: 'Mobiliario', description: 'Escritorios, sillas y muebles' },
  { name: 'Laboratorio', description: 'Equipamiento de laboratorio y practica' },
  { name: 'Vehiculos', description: 'Activos vehiculares y transporte' },
  { name: 'Redes', description: 'Infraestructura de red y comunicaciones' },
];

const people = [
  { name: 'Persona Responsable 1', email: 'persona1@universidad.edu', documentNumber: 'P-001', phone: '0000-0001' },
  { name: 'Persona Responsable 2', email: 'persona2@universidad.edu', documentNumber: 'P-002', phone: '0000-0002' },
  { name: 'Persona Responsable 3', email: 'persona3@universidad.edu', documentNumber: 'P-003', phone: '0000-0003' },
];

const suppliers = [
  { name: 'Proveedor General S.A.', taxId: 'NIT-001', contactName: 'Contacto General', contactEmail: 'ventas@proveedorgeneral.com', phone: '0000-1000', address: 'Ciudad Universitaria' },
  { name: 'Tecnologia y Servicios', taxId: 'NIT-002', contactName: 'Area Comercial', contactEmail: 'comercial@tys.com', phone: '0000-2000', address: 'Zona Industrial' },
];

const costCenters = [
  { code: 'ADM-001', name: 'Administracion General', description: 'Centro de costo para administracion central' },
  { code: 'ACA-001', name: 'Academica', description: 'Centro de costo para actividades academicas' },
  { code: 'INV-001', name: 'Inventario y Activos', description: 'Centro de costo para gestion de inventario' },
];

async function ensureRole(name: string, type: RoleType, description: string) {
  return prisma.role.upsert({
    where: { name },
    update: { type, description },
    create: { name, type, description },
  });
}

async function ensureMenu(seed: MenuSeed) {
  const existing = await prisma.menu.findFirst({ where: { path: seed.path } });

  if (!existing) {
    return prisma.menu.create({ data: seed });
  }

  return prisma.menu.update({
    where: { id: existing.id },
    data: seed,
  });
}

async function ensureCategory(name: string, description: string) {
  return prisma.category.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

async function ensureSupplier(seed: typeof suppliers[number]) {
  const existing = await prisma.supplier.findUnique({ where: { taxId: seed.taxId } });

  if (!existing) {
    return prisma.supplier.create({ data: seed });
  }

  return prisma.supplier.update({
    where: { id: existing.id },
    data: seed,
  });
}

async function ensureCostCenter(seed: typeof costCenters[number]) {
  return prisma.costCenter.upsert({
    where: { code: seed.code },
    update: seed,
    create: seed,
  });
}

async function ensurePerson(seed: typeof people[number]) {
  const existing = await prisma.person.findFirst({
    where: {
      OR: [{ email: seed.email }, { documentNumber: seed.documentNumber }],
    },
  });

  if (!existing) {
    return prisma.person.create({ data: seed });
  }

  return prisma.person.update({
    where: { id: existing.id },
    data: seed,
  });
}

async function assignRoleMenus(roleId: number, menuPaths: string[]) {
  await prisma.roleMenu.deleteMany({ where: { roleId } });

  const menusToAssign = await prisma.menu.findMany({
    where: { path: { in: menuPaths } },
    select: { id: true },
  });

  if (menusToAssign.length === 0) return;

  await prisma.roleMenu.createMany({
    data: menusToAssign.map((menu) => ({
      roleId,
      menuId: menu.id,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  const adminRole = await ensureRole('Administrador', RoleType.ADMIN, 'Acceso total al sistema');
  const managerRole = await ensureRole('Gestor de inventario', RoleType.MANAGER, 'Opera activos y catalogos operativos');
  const employeeRole = await ensureRole('Consulta', RoleType.EMPLOYEE, 'Solo lectura para seguimiento y revision');

  for (const menu of menus) {
    await ensureMenu(menu);
  }

  for (const category of categories) {
    await ensureCategory(category.name, category.description);
  }

  for (const supplier of suppliers) {
    await ensureSupplier(supplier);
  }

  for (const costCenter of costCenters) {
    await ensureCostCenter(costCenter);
  }

  for (const person of people) {
    await ensurePerson(person);
  }

  const adminMenus = menus.map((menu) => menu.path);
  const sharedMenus = [
    '/dashboard',
    '/dashboard/assets',
    '/dashboard/assignments',
    '/dashboard/imports',
    '/dashboard/cost-centers',
    '/dashboard/suppliers',
    '/dashboard/categories',
    '/dashboard/people',
  ];

  await assignRoleMenus(adminRole.id, adminMenus);
  await assignRoleMenus(managerRole.id, sharedMenus);
  await assignRoleMenus(employeeRole.id, sharedMenus);

  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@universidad.edu' },
    update: {
      name: 'Administrador',
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      email: 'admin@universidad.edu',
      name: 'Administrador',
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('Seed completado');
  console.log(`Admin: ${adminUser.email} / Admin123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
