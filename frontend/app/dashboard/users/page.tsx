'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useRolesQuery } from '../../../hooks/roles/use-roles';
import { useCreateUserMutation, useUpdateUserRoleMutation, useUsersQuery } from '../../../hooks/users/use-users';
import styles from '../admin.module.css';

const emptyUser = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  roleId: '' as number | '',
};

export default function UsersAdminPage() {
  const usersQuery = useUsersQuery();
  const rolesQuery = useRolesQuery();
  const createUserMutation = useCreateUserMutation();
  const updateUserRoleMutation = useUpdateUserRoleMutation();
  const [form, setForm] = useState(emptyUser);
  const [showPasswords, setShowPasswords] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<number, number>>({});

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const roleOptions = useMemo(() => roles.map((role) => ({ value: role.id, label: role.name })), [roles]);

  useEffect(() => {
    if (!form.roleId && roles.length > 0) {
      setForm((current) => ({ ...current, roleId: roles[0].id }));
    }
  }, [form.roleId, roles]);

  useEffect(() => {
    setRoleDrafts(
      users.reduce<Record<number, number>>((accumulator, user) => {
        accumulator[user.id] = user.role.id;
        return accumulator;
      }, {}),
    );
  }, [users]);

  const isSubmitting = createUserMutation.isPending || updateUserRoleMutation.isPending;
  const mutationErrorMessage =
    createUserMutation.error instanceof Error
      ? createUserMutation.error.message
      : updateUserRoleMutation.error instanceof Error
        ? updateUserRoleMutation.error.message
        : null;
  const errorMessage = formError ?? mutationErrorMessage;

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }

    setFormError(null);

    await createUserMutation.mutateAsync({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      roleId: form.roleId === '' ? undefined : form.roleId,
    });

    setForm((current) => ({ ...emptyUser, roleId: current.roleId }));
    setShowPasswords(false);
  };

  const handleSaveRole = async (userId: number) => {
    const roleId = roleDrafts[userId];
    if (!roleId) return;

    await updateUserRoleMutation.mutateAsync({ userId, roleId });
  };

  return (
    <main className={styles.adminPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Mantenimiento</p>
          <h1>Usuarios</h1>
          <p>Registra cuentas y cambia el rol asignado sin salir del panel administrativo.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <div className={styles.heroCard}>
            <span>Usuarios</span>
            <strong>{users.length}</strong>
          </div>
          <div className={styles.heroCard}>
            <span>Roles</span>
            <strong>{roles.length}</strong>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Registrar usuario</h2>
            <p>Al crear la cuenta puedes dejar el rol asignado desde el inicio.</p>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.stack} onSubmit={handleCreateUser}>
              <div className={styles.formGrid}>
                <label className={styles.stack}>
                  <span>Nombre</span>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => {
                      setFormError(null);
                      setForm((current) => ({ ...current, name: event.target.value }));
                    }}
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Email</span>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={(event) => {
                      setFormError(null);
                      setForm((current) => ({ ...current, email: event.target.value }));
                    }}
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Contraseña</span>
                  <div className={styles.passwordField}>
                    <input
                      className={`input ${styles.passwordInput}`}
                      type={showPasswords ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => {
                        setFormError(null);
                        setForm((current) => ({ ...current, password: event.target.value }));
                      }}
                      required
                    />
                    <button
                      className={styles.passwordToggle}
                      type="button"
                      onClick={() => setShowPasswords((current) => !current)}
                      aria-label={showPasswords ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPasswords ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </label>

                <label className={styles.stack}>
                  <span>Confirmar contraseña</span>
                  <div className={styles.passwordField}>
                    <input
                      className={`input ${styles.passwordInput}`}
                      type={showPasswords ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(event) => {
                        setFormError(null);
                        setForm((current) => ({ ...current, confirmPassword: event.target.value }));
                      }}
                      required
                    />
                    <button
                      className={styles.passwordToggle}
                      type="button"
                      onClick={() => setShowPasswords((current) => !current)}
                      aria-label={showPasswords ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPasswords ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </label>

                <label className={styles.stack}>
                  <span>Rol</span>
                  <select
                    className="input"
                    value={form.roleId}
                    onChange={(event) => {
                      setFormError(null);
                      setForm((current) => ({
                        ...current,
                        roleId: event.target.value ? Number(event.target.value) : '',
                      }));
                    }}
                  >
                    <option value="">Selecciona un rol</option>
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {errorMessage ? <p className={styles.fieldHint}>{errorMessage}</p> : null}

              <div className={styles.actionsRow}>
                <button className="button button--primary" type="submit" disabled={isSubmitting}>
                  {createUserMutation.isPending ? 'Guardando...' : 'Guardar usuario'}
                </button>
              </div>
            </form>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Asignar rol</h2>
            <p>Modifica el perfil activo de cada usuario desde la misma lista.</p>
          </div>
          <div className={styles.panelBody}>
            {usersQuery.isLoading ? (
              <div className={styles.emptyState}>Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>Todavía no hay usuarios registrados.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol actual</th>
                      <th>Cambiar rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                          <div className={styles.fieldHint}>{user.email}</div>
                        </td>
                        <td>
                          <span className={styles.status}>{user.role.name}</span>
                        </td>
                        <td>
                          <div className={styles.inlineFieldGroup}>
                            <select
                              className="input"
                              value={roleDrafts[user.id] ?? user.role.id}
                              onChange={(event) =>
                                setRoleDrafts((current) => ({
                                  ...current,
                                  [user.id]: Number(event.target.value),
                                }))
                              }
                            >
                              {roleOptions.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => handleSaveRole(user.id)}
                              disabled={isSubmitting || (roleDrafts[user.id] ?? user.role.id) === user.role.id}
                            >
                              Guardar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}