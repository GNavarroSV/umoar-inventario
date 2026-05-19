import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Buscar o crear rol de administrador
  let adminRole = await prisma.role.findFirst({
    where: { name: 'Administrador' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'Administrador',
        type: 'ADMIN',
        description: 'Acceso total al sistema',
      },
    });
  }

  // Crear usuario de prueba
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const user = await prisma.user.create({
    data: {
      email: 'admin@universidad.edu',
      password: hashedPassword,
      name: 'Administrador',
      roleId: adminRole.id,
    },
  });

  console.log('✓ Usuario creado:', user.email);
  console.log('  Contraseña: Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });