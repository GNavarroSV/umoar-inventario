'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  useCreateMenuMutation,
  useDeleteMenuMutation,
  useMenusQuery,
  useUpdateMenuMutation,
} from '../../../hooks/menus/use-menus';
import styles from '../admin.module.css';

const emptyForm = {
  name: '',
  label: '',
  path: '',
  icon: '',
  order: '0',
  parent_id: '',
};

type MenuFormState = typeof emptyForm;

export default function MenusAdminPage() {
  const menusQuery = useMenusQuery();
  const createMenuMutation = useCreateMenuMutation();
  const updateMenuMutation = useUpdateMenuMutation();
  const deleteMenuMutation = useDeleteMenuMutation();
  const [form, setForm] = useState(emptyForm);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);

  const menus = menusQuery.data ?? [];
  const rootMenus = useMemo(() => menus.filter((menu) => !menu.parent_id), [menus]);

  useEffect(() => {
    if (!form.path) {
      setForm((current) => ({ ...current, path: '/dashboard/menus' }));
    }
  }, [form.path]);

  const isSubmitting = createMenuMutation.isPending || updateMenuMutation.isPending || deleteMenuMutation.isPending;
  const errorMessage =
    createMenuMutation.error instanceof Error
      ? createMenuMutation.error.message
      : updateMenuMutation.error instanceof Error
        ? updateMenuMutation.error.message
        : deleteMenuMutation.error instanceof Error
          ? deleteMenuMutation.error.message
          : null;

  const beginEdit = (menu: (typeof menus)[number]) => {
    setEditingMenuId(menu.id);
    setForm({
      name: menu.name,
      label: menu.label,
      path: menu.path,
      icon: menu.icon ?? '',
      order: String(menu.order ?? 0),
      parent_id: menu.parent_id?.toString() ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingMenuId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      label: form.label.trim(),
      path: form.path.trim(),
      icon: form.icon.trim() || undefined,
      order: Number(form.order || 0),
      parent_id: form.parent_id.trim() ? Number(form.parent_id) : undefined,
    };

    if (editingMenuId) {
      await updateMenuMutation.mutateAsync({
        menuId: editingMenuId,
        data: payload,
      });
    } else {
      await createMenuMutation.mutateAsync(payload);
    }

    cancelEdit();
  };

  const handleDelete = async (menuId: number) => {
    const confirmed = window.confirm('¿Deseas desactivar este menú?');
    if (!confirmed) return;

    await deleteMenuMutation.mutateAsync(menuId);

    if (editingMenuId === menuId) {
      cancelEdit();
    }
  };

  return (
    <main className={styles.adminPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Mantenimiento</p>
          <h1>Menús</h1>
          <p>Define las rutas disponibles para el sidebar y organiza los accesos por rol.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <div className={styles.heroCard}>
            <span>Total de menús</span>
            <strong>{menus.length}</strong>
          </div>
          <div className={styles.heroCard}>
            <span>Menús raíz</span>
            <strong>{rootMenus.length}</strong>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{editingMenuId ? 'Editar menú' : 'Registrar menú'}</h2>
            <p>
              {editingMenuId
                ? 'Ajusta la navegación existente y guarda los cambios.'
                : 'Crea nuevas entradas de navegación y, si hace falta, cuélgalas de un menú padre.'}
            </p>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.stack} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.stack}>
                  <span>Nombre interno</span>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="menus"
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Etiqueta</span>
                  <input
                    className="input"
                    value={form.label}
                    onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                    placeholder="Menús"
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Ruta</span>
                  <input
                    className="input"
                    value={form.path}
                    onChange={(event) => setForm((current) => ({ ...current, path: event.target.value }))}
                    placeholder="/dashboard/menus"
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Icono</span>
                  <input
                    className="input"
                    value={form.icon}
                    onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                    placeholder="gear"
                  />
                </label>

                <label className={styles.stack}>
                  <span>Orden</span>
                  <input
                    className="input"
                    type="number"
                    value={form.order}
                    onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
                  />
                </label>

                <label className={styles.stack}>
                  <span>Menú padre</span>
                  <select
                    className="input"
                    value={form.parent_id}
                    onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}
                  >
                    <option value="">Sin padre</option>
                    {rootMenus.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {errorMessage ? <p className={styles.fieldHint}>{errorMessage}</p> : null}

              <div className={styles.actionsRow}>
                <button className="button button--primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : editingMenuId ? 'Actualizar menú' : 'Guardar menú'}
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                >
                  {editingMenuId ? 'Cancelar edición' : 'Limpiar'}
                </button>
              </div>
            </form>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Listado de menús</h2>
            <p>Revisa las rutas activas y la relación padre-hijo de la navegación.</p>
          </div>
          <div className={styles.panelBody}>
            {menusQuery.isLoading ? (
              <div className={styles.emptyState}>Cargando menús...</div>
            ) : menus.length === 0 ? (
              <div className={styles.emptyState}>Todavía no hay menús registrados.</div>
            ) : (
              <div className={styles.dataList}>
                {menus.map((menu) => (
                  <div
                    key={menu.id}
                    className={`${styles.dataRow} ${editingMenuId === menu.id ? styles['dataRow--editing'] : ''}`}
                  >
                    <div>
                      <p className={styles.dataRowTitle}>{menu.label}</p>
                      <p className={styles.dataRowMeta}>{menu.path}</p>
                      <div className={styles.chipGroup}>
                        <span className={styles.chip}>{menu.name}</span>
                        <span className={styles.chip}>{menu.icon || 'sin icono'}</span>
                        <span className={styles.chip}>orden {menu.order ?? 0}</span>
                        <span className={`${styles.chip} ${menu.parent_id ? '' : styles['chip--muted']}`}>
                          {menu.parent_id ? 'submenú' : 'raíz'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <button className="button button--ghost" type="button" onClick={() => beginEdit(menu)}>
                        Editar
                      </button>
                      <button className="button button--ghost" type="button" onClick={() => handleDelete(menu.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}