'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAssignMenusToRoleMutation, useMenusQuery } from '../../../hooks/menus/use-menus';
import { useCreateRoleMutation, useRolesQuery } from '../../../hooks/roles/use-roles';
import styles from '../admin.module.css';

const emptyRole = {
  name: '',
  type: 'EMPLOYEE',
  description: '',
};

export default function RolesAdminPage() {
  const rolesQuery = useRolesQuery();
  const menusQuery = useMenusQuery();
  const createRoleMutation = useCreateRoleMutation();
  const assignMenusMutation = useAssignMenusToRoleMutation();
  const [form, setForm] = useState(emptyRole);
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  const roles = rolesQuery.data ?? [];
  const menus = menusQuery.data ?? [];
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (!selectedRole) {
      setSelectedMenuIds([]);
      return;
    }

    setSelectedMenuIds(selectedRole.menus?.map((entry) => entry.menu.id) ?? []);
  }, [selectedRole]);

  const isSubmitting = createRoleMutation.isPending || assignMenusMutation.isPending;
  const errorMessage =
    createRoleMutation.error instanceof Error
      ? createRoleMutation.error.message
      : assignMenusMutation.error instanceof Error
        ? assignMenusMutation.error.message
        : null;

  const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const createdRole = await createRoleMutation.mutateAsync({
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim() || undefined,
    });

    setForm(emptyRole);
    setSelectedRoleId(createdRole.id);
  };

  const handleAssignMenus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedRoleId === '') return;

    await assignMenusMutation.mutateAsync({
      roleId: selectedRoleId,
      menuIds: selectedMenuIds,
    });
  };

  const toggleMenu = (menuId: number) => {
    setSelectedMenuIds((current) =>
      current.includes(menuId) ? current.filter((id) => id !== menuId) : [...current, menuId],
    );
  };

  return (
    <main className={styles.adminPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Mantenimiento</p>
          <h1>Roles</h1>
          <p>Configura perfiles y asigna los menús visibles para cada rol del sistema.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <div className={styles.heroCard}>
            <span>Roles</span>
            <strong>{roles.length}</strong>
          </div>
          <div className={styles.heroCard}>
            <span>Menús disponibles</span>
            <strong>{menus.length}</strong>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Registrar rol</h2>
            <p>Define un perfil nuevo y luego asígnale los menús permitidos.</p>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.stack} onSubmit={handleCreateRole}>
              <div className={styles.formGrid}>
                <label className={styles.stack}>
                  <span>Nombre</span>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Supervisión"
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Tipo</span>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </label>

                <label className={`${styles.stack} ${styles.fieldFull}`}>
                  <span>Descripción</span>
                  <textarea
                    className="textarea"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Permite acceso a..."
                  />
                </label>
              </div>

              {errorMessage ? <p className={styles.fieldHint}>{errorMessage}</p> : null}

              <div className={styles.actionsRow}>
                <button className="button button--primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Guardar rol'}
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => setForm(emptyRole)}
                  disabled={isSubmitting}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Asignar menús</h2>
            <p>Selecciona un rol y define exactamente qué rutas puede ver en el sidebar.</p>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.stack} onSubmit={handleAssignMenus}>
              <label className={styles.stack}>
                <span>Rol</span>
                <select
                  className="input"
                    value={selectedRoleId}
                    onChange={(event) =>
                      setSelectedRoleId(event.target.value ? Number(event.target.value) : '')
                    }
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.checkGrid}>
                {menus.map((menu) => (
                  <label key={menu.id} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={selectedMenuIds.includes(menu.id)}
                      onChange={() => toggleMenu(menu.id)}
                    />
                    <span>
                      <strong>{menu.label}</strong>
                      <small>{menu.path}</small>
                    </span>
                  </label>
                ))}
              </div>

              <div className={styles.actionsRow}>
                  <button className="button button--primary" type="submit" disabled={isSubmitting || selectedRoleId === ''}>
                  {assignMenusMutation.isPending ? 'Actualizando...' : 'Guardar menús del rol'}
                </button>
              </div>
            </form>
          </div>
        </article>
      </section>

        <section className={`${styles.panel} ${styles['contentGrid--single']}`}>        <div className={styles.panelHeader}>
          <h2>Roles registrados</h2>
          <p>Consulta cuántos usuarios y menús tiene cada perfil.</p>
        </div>
        <div className={styles.panelBody}>
          {rolesQuery.isLoading ? (
            <div className={styles.emptyState}>Cargando roles...</div>
          ) : roles.length === 0 ? (
            <div className={styles.emptyState}>Todavía no hay roles registrados.</div>
          ) : (
            <div className={styles.dataList}>
              {roles.map((role) => (
                <div key={role.id} className={styles.dataRow}>
                  <div>
                    <p className={styles.dataRowTitle}>{role.name}</p>
                    <p className={styles.dataRowMeta}>{role.description || 'Sin descripción'}</p>
                    <div className={styles.chipGroup}>
                      <span className={styles.chip}>{role.type}</span>
                      <span className={`${styles.chip} ${styles['chip--muted']}`}>
                        {role.menus?.length ?? 0} menús
                      </span>
                      <span className={`${styles.chip} ${styles['chip--muted']}`}>
                        {role.users?.length ?? 0} usuarios
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}