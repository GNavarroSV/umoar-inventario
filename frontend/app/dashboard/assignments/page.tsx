'use client';

import { FormEvent, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { useAssetsQuery } from '../../../hooks/assets/assets';
import { usePeopleQuery } from '../../../hooks/people/use-people';
import {
  useAssignmentsQuery,
  useCreateAssignmentMutation,
  useMarkAssignmentReturnedMutation,
} from '../../../hooks/assignments/use-assignments';

const emptyForm = {
  assetId: '',
  assignedToPersonId: '',
  type: 'LOAN',
  dueDate: '',
  reason: '',
  notes: '',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function AssignmentsAdminPage() {
  const assignmentsQuery = useAssignmentsQuery();
  const assetsQuery = useAssetsQuery({ take: 500 });
  const peopleQuery = usePeopleQuery(true);
  const createMutation = useCreateAssignmentMutation();
  const returnMutation = useMarkAssignmentReturnedMutation();
  const [form, setForm] = useState(emptyForm);

  const assignments = assignmentsQuery.data ?? [];
  const assets = (assetsQuery.data as { data?: any[] } | undefined)?.data ?? [];
  const people = peopleQuery.data ?? [];

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'ACTIVE'),
    [assignments],
  );

  const isSubmitting = createMutation.isPending || returnMutation.isPending;
  const errorMessage =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : returnMutation.error instanceof Error
        ? returnMutation.error.message
        : assignmentsQuery.error instanceof Error
          ? assignmentsQuery.error.message
          : null;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await createMutation.mutateAsync({
      assetId: Number(form.assetId),
      assignedToPersonId: Number(form.assignedToPersonId),
      type: form.type as 'CUSTODY' | 'LOAN',
      dueDate: form.type === 'LOAN' ? form.dueDate || undefined : undefined,
      reason: form.reason.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });

    setForm(emptyForm);
  };

  const handleReturn = async (assignmentId: number) => {
    const confirmed = window.confirm('¿Deseas cerrar esta custodia temporal?');
    if (!confirmed) return;

    await returnMutation.mutateAsync({
      id: assignmentId,
      data: {
        notes: 'Retorno manual desde el panel',
      },
    });
  };

  return (
    <main className={styles.adminPage}>
      <section className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Operación</p>
          <h1>Asignaciones y custodia</h1>
          <p>Registra entregas temporales o cambios de custodia y revisa quién tiene cada activo ahora mismo.</p>
        </div>
        <div className={styles.pageHeaderActions}>
          <div className={styles.heroCard}>
            <span>Activas</span>
            <strong>{activeAssignments.length}</strong>
          </div>
          <div className={styles.heroCard}>
            <span>Histórico</span>
            <strong>{assignments.length}</strong>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Nueva asignación</h2>
            <p>
              Usa <strong>CUSTODY</strong> cuando el responsable cambia definitivamente y <strong>LOAN</strong> para
              custodia temporal con devolución automática.
            </p>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.stack} onSubmit={handleCreate}>
              <div className={styles.formGrid}>
                <label className={styles.stack}>
                  <span>Activo</span>
                  <select
                    className="input"
                    value={form.assetId}
                    onChange={(event) => setForm((current) => ({ ...current, assetId: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona un activo</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.code} - {asset.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.stack}>
                  <span>Persona asignada</span>
                  <select
                    className="input"
                    value={form.assignedToPersonId}
                    onChange={(event) => setForm((current) => ({ ...current, assignedToPersonId: event.target.value }))}
                    required
                  >
                    <option value="">Selecciona una persona</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.stack}>
                  <span>Tipo</span>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  >
                    <option value="LOAN">Custodia temporal</option>
                    <option value="CUSTODY">Cambio de custodia</option>
                  </select>
                </label>

                <label className={styles.stack}>
                  <span>Fecha de vencimiento</span>
                  <input
                    className="input"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                    disabled={form.type !== 'LOAN'}
                    required={form.type === 'LOAN'}
                  />
                </label>

                <label className={`${styles.stack} ${styles.fieldFull}`}>
                  <span>Motivo</span>
                  <textarea
                    className="textarea"
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Traslado temporal, préstamo para revisión..."
                  />
                </label>

                <label className={`${styles.stack} ${styles.fieldFull}`}>
                  <span>Notas</span>
                  <textarea
                    className="textarea"
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Observaciones adicionales"
                  />
                </label>
              </div>

              {errorMessage ? <p className={styles.fieldHint}>{errorMessage}</p> : null}

              <div className={styles.actionsRow}>
                <button className="button button--primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Crear asignación'}
                </button>
              </div>
            </form>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Asignaciones activas</h2>
            <p>Las temporales vuelven al responsable anterior cuando se cumplen las fechas o se registran como devueltas.</p>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Activo</th>
                    <th>Asignado a</th>
                    <th>Responsable previo</th>
                    <th>Tipo</th>
                    <th>Vence</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={7}>No hay asignaciones registradas.</td>
                    </tr>
                  ) : (
                    assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>{assignment.asset.code}</td>
                        <td>{assignment.assignedToPerson.name}</td>
                        <td>{assignment.previousResponsiblePerson?.name ?? '—'}</td>
                        <td>{assignment.type === 'LOAN' ? 'Temporal' : 'Custodia'}</td>
                        <td>{formatDate(assignment.dueDate)}</td>
                        <td>{assignment.status}</td>
                        <td>
                          {assignment.status === 'ACTIVE' && assignment.type === 'LOAN' ? (
                            <button
                              className="button button--ghost"
                              type="button"
                              onClick={() => handleReturn(assignment.id)}
                            >
                              Marcar devuelta
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
