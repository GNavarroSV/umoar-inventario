import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AssetsModule } from './assets/assets.module';
import { RolesModule } from './roles/roles.module';
import { MenusModule } from './menus/menus.module';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CategoriesModule } from './categories/categories.module';
import { PeopleModule } from './people/people.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AssetsModule,
    RolesModule,
    MenusModule,
    CostCentersModule,
    SuppliersModule,
    CategoriesModule,
    PeopleModule,
    AssignmentsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}