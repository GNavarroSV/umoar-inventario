'use client';

import { FormEvent, useState } from 'react';
import styles from '../admin.module.css';
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from '../../../hooks/categories/use-categories';

const emptyForm = {
  name: '',
  description: '',
  isActive: true,
};

export default function CategoriesAdminPage() {
  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const categories = categoriesQuery.data ?? [];
  const activeCount = categories.filter((item) => item.isActive !== false).length;

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const errorMessage =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : updateMutation.error instanceof Error
        ? updateMutation.error.message
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : null;

  const beginEdit = (category: (typeof categories)[number]) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? '',
      isActive: category.isActive !== false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    cancelEdit();
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('¿Deseas eliminar esta categoría?');
    if (!confirmed) return;

    await deleteMutation.mutateAsync(id);

    if (editingId === id) {
      cancelEdit();
    }
  };

  return (
    <main className={styles.adminPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Mantenimiento</p>
          <h1>Categorías</h1>
          <p>Registra categorías simples para clasificar activos y seleccionarlas luego en el formulario.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <div className={styles.heroCard}>
            <span>Total</span>
            <strong>{categories.length}</strong>
          </div>
          <div className={styles.heroCard}>
            <span>Activas</span>
            <strong>{activeCount}</strong>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{editingId ? 'Editar categoría' : 'Registrar categoría'}</h2>
            <p>
              {editingId
                ? 'Ajusta el nombre o el estado de la categoría.'
                : 'Usa un nombre corto y entendible para el equipo.'}
            </p>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.stack} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.stack}>
                  <span>Nombre</span>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Computo"
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Estado</span>
                  <select
                    className="input"
                    value={String(form.isActive)}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'true' }))}
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </label>

                <label className={`${styles.stack} ${styles.fieldFull}`}>
                  <span>Descripción</span>
                  <textarea
                    className="textarea"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Clasificación general..."
                  />
                </label>
              </div>

              {errorMessage ? <p className={styles.fieldHint}>{errorMessage}</p> : null}

              <div className={styles.actionsRow}>
                <button className="button button--primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar categoría' : 'Guardar categoría'}
                </button>
                <button className="button button--ghost" type="button" onClick={cancelEdit} disabled={isSubmitting}>
                  {editingId ? 'Cancelar edición' : 'Limpiar'}
                </button>
              </div>
            </form>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Listado</h2>
            <p>Haz cambios rápidos en categorías que ya existen.</p>
          </div>
          <div className={styles.panelBody}>
            {categoriesQuery.isLoading ? (
              <div className={styles.emptyState}>Cargando categorías...</div>
            ) : categories.length === 0 ? (
              <div className={styles.emptyState}>Todavía no hay categorías registradas.</div>
            ) : (
              <div className={styles.dataList}>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`${styles.dataRow} ${editingId === category.id ? styles['dataRow--editing'] : ''}`}
                  >
                    <div>
                      <p className={styles.dataRowTitle}>{category.name}</p>
                      <p className={styles.dataRowMeta}>{category.description || 'Sin descripción'}</p>
                      <div className={styles.chipGroup}>
                        <span className={styles.chip}>{category.isActive === false ? 'Inactiva' : 'Activa'}</span>
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <button className="button button--ghost" type="button" onClick={() => beginEdit(category)}>
                        Editar
                      </button>
                      <button className="button button--ghost" type="button" onClick={() => handleDelete(category.id)}>
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