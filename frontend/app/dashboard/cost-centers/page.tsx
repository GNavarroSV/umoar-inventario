'use client';

import { FormEvent, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import {
  useCostCentersQuery,
  useCreateCostCenterMutation,
  useDeleteCostCenterMutation,
  useUpdateCostCenterMutation,
} from '../../../hooks/cost-centers/use-cost-centers';

const emptyForm = {
  code: '',
  name: '',
  description: '',
  isActive: true,
};

export default function CostCentersAdminPage() {
  const costCentersQuery = useCostCentersQuery();
  const createMutation = useCreateCostCenterMutation();
  const updateMutation = useUpdateCostCenterMutation();
  const deleteMutation = useDeleteCostCenterMutation();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const costCenters = costCentersQuery.data ?? [];
  const activeCount = useMemo(() => costCenters.filter((item) => item.isActive !== false).length, [costCenters]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const errorMessage =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : updateMutation.error instanceof Error
        ? updateMutation.error.message
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : null;

  const beginEdit = (costCenter: (typeof costCenters)[number]) => {
    setEditingId(costCenter.id);
    setForm({
      code: costCenter.code,
      name: costCenter.name,
      description: costCenter.description ?? '',
      isActive: costCenter.isActive !== false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      code: form.code.trim(),
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
    const confirmed = window.confirm('¿Deseas eliminar este centro de costo?');
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
          <h1>Centros de costo</h1>
          <p>Registra, edita y retira centros de costo de forma simple para usarlo luego en activos.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <div className={styles.heroCard}>
            <span>Total</span>
            <strong>{costCenters.length}</strong>
          </div>
          <div className={styles.heroCard}>
            <span>Activos</span>
            <strong>{activeCount}</strong>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>{editingId ? 'Editar centro de costo' : 'Registrar centro de costo'}</h2>
            <p>
              {editingId
                ? 'Ajusta el código, nombre o estado del registro.'
                : 'Usa código corto y nombre claro para identificarlo rápidamente.'}
            </p>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.stack} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.stack}>
                  <span>Código</span>
                  <input
                    className="input"
                    value={form.code}
                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="CC-001"
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Nombre</span>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Administración"
                    required
                  />
                </label>

                <label className={`${styles.stack} ${styles.fieldFull}`}>
                  <span>Descripción</span>
                  <textarea
                    className="textarea"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Centro de costo para..."
                  />
                </label>

                <label className={styles.stack}>
                  <span>Estado</span>
                  <select
                    className="input"
                    value={String(form.isActive)}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'true' }))}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>
              </div>

              {errorMessage ? <p className={styles.fieldHint}>{errorMessage}</p> : null}

              <div className={styles.actionsRow}>
                <button className="button button--primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar centro de costo' : 'Guardar centro de costo'}
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
            <p>Haz cambios rápidos o elimina registros que ya no se usan.</p>
          </div>
          <div className={styles.panelBody}>
            {costCentersQuery.isLoading ? (
              <div className={styles.emptyState}>Cargando centros de costo...</div>
            ) : costCenters.length === 0 ? (
              <div className={styles.emptyState}>Todavía no hay centros de costo registrados.</div>
            ) : (
              <div className={styles.dataList}>
                {costCenters.map((costCenter) => (
                  <div
                    key={costCenter.id}
                    className={`${styles.dataRow} ${editingId === costCenter.id ? styles['dataRow--editing'] : ''}`}
                  >
                    <div>
                      <p className={styles.dataRowTitle}>{costCenter.code} - {costCenter.name}</p>
                      <p className={styles.dataRowMeta}>{costCenter.description || 'Sin descripción'}</p>
                      <div className={styles.chipGroup}>
                        <span className={styles.chip}>{costCenter.isActive === false ? 'Inactivo' : 'Activo'}</span>
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <button className="button button--ghost" type="button" onClick={() => beginEdit(costCenter)}>
                        Editar
                      </button>
                      <button className="button button--ghost" type="button" onClick={() => handleDelete(costCenter.id)}>
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