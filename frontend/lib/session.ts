export type DemoRoleId = 'admin' | 'manager' | 'viewer';

export interface DemoRoleProfile {
  id: DemoRoleId;
  label: string;
  description: string;
  menus: string[];
  accent: string;
}

export interface UserSession {
  name: string;
  email: string;
  roleId: DemoRoleId;
  roleLabel: string;
  menus: string[];
  avatar: string;
}

export const SESSION_STORAGE_KEY = 'inventory:session';

export const DEMO_ROLES: DemoRoleProfile[] = [
  {
    id: 'admin',
    label: 'Administrador',
    description: 'Acceso total a catalogos, menús y configuracion.',
    menus: ['/dashboard', '/dashboard/assets', '/dashboard/assignments', '/dashboard/cost-centers', '/dashboard/suppliers', '/dashboard/categories', '/dashboard/people', '/dashboard/roles', '/dashboard/menus', '/dashboard/users'],
    accent: '#f59e0b',
  },
  {
    id: 'manager',
    label: 'Gestor de inventario',
    description: 'Opera activos, custodias y catalogos operativos.',
    menus: ['/dashboard', '/dashboard/assets', '/dashboard/assignments', '/dashboard/cost-centers', '/dashboard/suppliers', '/dashboard/categories', '/dashboard/people'],
    accent: '#38bdf8',
  },
  {
    id: 'viewer',
    label: 'Consulta',
    description: 'Solo lectura para seguimiento y revision.',
    menus: ['/dashboard', '/dashboard/assets', '/dashboard/assignments', '/dashboard/categories', '/dashboard/people'],
    accent: '#a78bfa',
  },
];

export function getDemoRole(roleId: DemoRoleId): DemoRoleProfile {
  return DEMO_ROLES.find((role) => role.id === roleId) ?? DEMO_ROLES[0];
}

export function createDemoSession(roleId: DemoRoleId, email: string): UserSession {
  const role = getDemoRole(roleId);
  const normalizedEmail = email.trim().toLowerCase() || `${roleId}@universidad.edu`;
  const displayName = role.label;

  return {
    name: displayName,
    email: normalizedEmail,
    roleId: role.id,
    roleLabel: role.label,
    menus: role.menus,
    avatar: displayName.slice(0, 2).toUpperCase(),
  };
}

export function saveSession<T>(session: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession<T>(): T | null {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function hasMenuAccess(session: UserSession | null, menuPath: string) {
  return Boolean(session?.menus?.includes(menuPath));
}
