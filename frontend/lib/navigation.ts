import type { ComponentType } from 'react';
import {
  DashboardIcon,
  GearIcon,
  IdCardIcon,
  PersonIcon,
  TableIcon,
} from '@radix-ui/react-icons';

export type NavigationIcon = ComponentType<any>;

export interface NavigationItem {
  label: string;
  href: string;
  description: string;
  icon: NavigationIcon;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export interface SectionMeta {
  title: string;
  description: string;
  eyebrow: string;
}

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    title: 'Operacion',
    items: [
      {
        label: 'Inicio',
        href: '/dashboard',
        description: 'Resumen general del sistema',
        icon: DashboardIcon,
      },
      {
        label: 'Activos',
        href: '/dashboard/assets',
        description: 'Inventario y control de bienes',
        icon: TableIcon,
      },
      {
        label: 'Custodia y prestamos',
        href: '/dashboard/assignments',
        description: 'Entregas, prestamos y devoluciones',
        icon: IdCardIcon,
      },
      {
        label: 'Carga masiva',
        href: '/dashboard/imports',
        description: 'Plantillas y carga inicial de activos',
        icon: TableIcon,
      },
    ],
  },
  {
    title: 'Catalogos',
    items: [
      {
        label: 'Centros de costo',
        href: '/dashboard/cost-centers',
        description: 'Unidades y centros administrativos',
        icon: GearIcon,
      },
      {
        label: 'Proveedores',
        href: '/dashboard/suppliers',
        description: 'Registro de proveedores y compras',
        icon: PersonIcon,
      },
      {
        label: 'Categorías',
        href: '/dashboard/categories',
        description: 'Clasificación de activos',
        icon: TableIcon,
      },
      {
        label: 'Personas',
        href: '/dashboard/people',
        description: 'Responsables y contactos',
        icon: PersonIcon,
      },
      {
        label: 'Usuarios y roles',
        href: '/dashboard/roles',
        description: 'Administracion de acceso y perfiles',
        icon: PersonIcon,
      },
      {
        label: 'Usuarios',
        href: '/dashboard/users',
        description: 'Cuenta y trazabilidad de responsables',
        icon: PersonIcon,
      },
      {
        label: 'Menús',
        href: '/dashboard/menus',
        description: 'Estructura de navegación por rol',
        icon: GearIcon,
      },
    ],
  },
];

export const SECTION_META: Record<string, SectionMeta> = {
  dashboard: {
    title: 'Inicio',
    description: 'Espacio principal del sistema de inventario universitario.',
    eyebrow: 'Panel principal',
  },
  assets: {
    title: 'Activos',
    description: 'Gestion de inventario, codigos y estado de los bienes.',
    eyebrow: 'Modulo operativo',
  },
  assignments: {
    title: 'Custodia y prestamos',
    description: 'Controla asignaciones, prestamos y devoluciones.',
    eyebrow: 'Seguimiento de activos',
  },
  imports: {
    title: 'Carga masiva',
    description: 'Descarga plantillas para carga inicial y actualizaciones masivas.',
    eyebrow: 'Integracion de datos',
  },
  'cost-centers': {
    title: 'Centros de costo',
    description: 'Organiza el inventario por unidades y presupuesto.',
    eyebrow: 'Catalogo administrativo',
  },
  suppliers: {
    title: 'Proveedores',
    description: 'Registro de compras, garantias y origen de los equipos.',
    eyebrow: 'Catalogo de compras',
  },
  categories: {
    title: 'Categorías',
    description: 'Clasifica activos por tipo, uso o naturaleza.',
    eyebrow: 'Catalogo de inventario',
  },
  people: {
    title: 'Personas',
    description: 'Gestion de responsables, contactos y referencias.',
    eyebrow: 'Catalogo humano',
  },
  roles: {
    title: 'Usuarios y roles',
    description: 'Administracion de accesos, menus y asignaciones.',
    eyebrow: 'Seguridad y acceso',
  },
  users: {
    title: 'Usuarios',
    description: 'Responsables del sistema y trazabilidad de acciones.',
    eyebrow: 'Gestion de cuentas',
  },
  menus: {
    title: 'Menús',
    description: 'Gestiona la navegación disponible por rol.',
    eyebrow: 'Seguridad y acceso',
  },
};

export function getVisibleNavigation(menuPaths: string[] = []) {
  return NAVIGATION_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => menuPaths.includes(item.href)),
  })).filter((section) => section.items.length > 0);
}

export function getSectionMeta(section: string) {
  return SECTION_META[section] ?? null;
}
