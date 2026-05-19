'use client';

import { FormEvent, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import {
  useCreatePersonMutation,
  useDeletePersonMutation,
  usePeopleQuery,
  useUpdatePersonMutation,
} from '../../../hooks/people/use-people';

const emptyForm = {
  name: '',
  email: '',
  documentNumber: '',
  phone: '',
  isActive: true,
};

export default function PeopleAdminPage() {
  const peopleQuery = usePeopleQuery();
  const createMutation = useCreatePersonMutation();
  const updateMutation = useUpdatePersonMutation();
  const deleteMutation = useDeletePersonMutation();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const people = peopleQuery.data ?? [];
  const activeCount = useMemo(() => people.filter((item) => item.isActive !== false).length, [people]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const errorMessage =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : updateMutation.error instanceof Error
        ? updateMutation.error.message
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : null;

  const beginEdit = (person: (typeof people)[number]) => {
    setEditingId(person.id);
    setForm({
      name: person.name,
      email: person.email ?? '',
      documentNumber: person.documentNumber ?? '',
      phone: person.phone ?? '',
      isActive: person.isActive !== false,
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
      email: form.email.trim() || undefined,
      documentNumber: form.documentNumber.trim() || undefined,
      phone: form.phone.trim() || undefined,
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
    const confirmed = window.confirm('¿Deseas eliminar esta persona?');
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
          <h1>Personas</h1>
          <p>Registra y administra responsables, contactos y referencias para usar en activos y asignaciones.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <div className={styles.heroCard}>
            <span>Total</span>
            <strong>{people.length}</strong>
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
            <h2>{editingId ? 'Editar persona' : 'Registrar persona'}</h2>
            <p>
              {editingId
                ? 'Ajusta los datos de contacto o el estado del registro.'
                : 'Usa nombre completo y completa solo los datos que tengas disponibles.'}
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
                    placeholder="Juan Perez"
                    required
                  />
                </label>

                <label className={styles.stack}>
                  <span>Correo</span>
                  <input
                    className="input"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="correo@universidad.edu"
                    type="email"
                  />
                </label>

                <label className={styles.stack}>
                  <span>Documento</span>
                  <input
                    className="input"
                    value={form.documentNumber}
                    onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))}
                    placeholder="123456789"
                  />
                </label>

                <label className={styles.stack}>
                  <span>Telefono</span>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="3000000000"
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
              </div>

              {errorMessage ? <p className={styles.fieldHint}>{errorMessage}</p> : null}

              <div className={styles.actionsRow}>
                <button className="button button--primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar persona' : 'Guardar persona'}
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
            <p>Revisa los contactos registrados y haz cambios rápidos cuando sea necesario.</p>
          </div>
          <div className={styles.panelBody}>
            {peopleQuery.isLoading ? (
              <div className={styles.emptyState}>Cargando personas...</div>
            ) : people.length === 0 ? (
              <div className={styles.emptyState}>Todavía no hay personas registradas.</div>
            ) : (
              <div className={styles.dataList}>
                {people.map((person) => (
                  <div
                    key={person.id}
                    className={`${styles.dataRow} ${editingId === person.id ? styles['dataRow--editing'] : ''}`}
                  >
                    <div>
                      <p className={styles.dataRowTitle}>{person.name}</p>
                      <p className={styles.dataRowMeta}>
                        {person.email || 'Sin correo'} · {person.documentNumber || 'Sin documento'}
                      </p>
                      <div className={styles.chipGroup}>
                        <span className={styles.chip}>{person.phone || 'Sin telefono'}</span>
                        <span className={styles.chip}>{person.isActive === false ? 'Inactiva' : 'Activa'}</span>
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <button className="button button--ghost" type="button" onClick={() => beginEdit(person)}>
                        Editar
                      </button>
                      <button className="button button--ghost" type="button" onClick={() => handleDelete(person.id)}>
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