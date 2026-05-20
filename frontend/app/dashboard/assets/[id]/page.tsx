'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from '../assets.module.css';
import { useAssetQuery } from '../../../../hooks/assets/assets';

function formatDate(value?: string | Date | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value?: number | null) {
  if (value == null) return '—';

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function valueOrDash(value?: string | number | null) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function formatAssignmentType(value?: string | null) {
  if (value === 'LOAN') return 'Temporal';
  if (value === 'CUSTODY') return 'Custodia';
  return valueOrDash(value);
}

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const assetId = Number(params.id);
  const assetQuery = useAssetQuery(assetId);

  if (assetQuery.isLoading) {
    return <p>Cargando activo...</p>;
  }

  if (assetQuery.isError) {
    return <p>No se pudo cargar el activo.</p>;
  }

  const asset = assetQuery.data;

  return (
    <main className={styles.pageShell}>
      <div className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Activos</p>
          <h1>{asset?.name}</h1>
          <p className={styles.leadText}>Vista detallada del activo y su información principal.</p>
        </div>

        <div className={styles.actions}>
          <Link href={`/dashboard/assets/${assetId}/edit`} className="button button--primary">
            Editar
          </Link>
          <Link href="/dashboard/assets" className="button button--ghost">
            Volver
          </Link>
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Código</span>
          <strong>{valueOrDash(asset?.code)}</strong>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Estado</span>
          <strong>{valueOrDash(asset?.status)}</strong>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Valor actual</span>
          <strong>{formatCurrency(asset?.currentValue)}</strong>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Ubicación</span>
          <strong>{valueOrDash(asset?.location)}</strong>
        </article>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Información general</h2>
        <dl className={styles.detailsGrid}>
          <div>
            <dt>Categoría</dt>
            <dd>{valueOrDash((asset as any)?.category?.name ?? (asset as any)?.categoryId)}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{valueOrDash(asset?.responsiblePerson?.name)}</dd>
          </div>
          <div>
            <dt>Descripción</dt>
            <dd>{valueOrDash((asset as any)?.description)}</dd>
          </div>
          <div>
            <dt>Centro de costo</dt>
            <dd>{valueOrDash((asset as any)?.costCenterId)}</dd>
          </div>
          <div>
            <dt>Proveedor</dt>
            <dd>{valueOrDash((asset as any)?.supplier?.name ?? (asset as any)?.supplierId)}</dd>
          </div>
          <div>
            <dt>Serie</dt>
            <dd>{valueOrDash((asset as any)?.serialNumber)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Información financiera</h2>
        <dl className={styles.detailsGrid}>
          <div>
            <dt>Fecha de adquisición</dt>
            <dd>{formatDate(asset?.acquisitionDate)}</dd>
          </div>
          <div>
            <dt>Fecha de compra</dt>
            <dd>{formatDate((asset as any)?.purchaseDate)}</dd>
          </div>
          <div>
            <dt>Valor de compra</dt>
            <dd>{formatCurrency((asset as any)?.purchaseValue)}</dd>
          </div>
          <div>
            <dt>Garantía hasta</dt>
            <dd>{formatDate((asset as any)?.warrantyEndDate)}</dd>
          </div>
          <div>
            <dt>Meses de garantía</dt>
            <dd>{valueOrDash((asset as any)?.warrantyMonths)}</dd>
          </div>
          <div>
            <dt>Depreciación</dt>
            <dd>{valueOrDash((asset as any)?.depreciationType)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Asignaciones y custodia</h2>

        {Array.isArray(asset?.assignments) && asset.assignments.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Asignado a</th>
                  <th>Responsable previo</th>
                  <th>Inicio</th>
                  <th>Vence</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {asset.assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{formatAssignmentType(assignment.type)}</td>
                    <td>{valueOrDash(assignment.assignedToPerson?.name)}</td>
                    <td>{valueOrDash(assignment.previousResponsiblePerson?.name)}</td>
                    <td>{formatDate(assignment.startDate)}</td>
                    <td>{formatDate(assignment.dueDate)}</td>
                    <td>{valueOrDash(assignment.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyState}>No hay asignaciones registradas para este activo.</p>
        )}
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Actividad reciente</h2>

        {Array.isArray(asset?.history) && asset.history.length > 0 ? (
          <ul className={styles.historyList}>
            {asset.history.map((entry) => (
              <li key={entry.id} className={styles.historyItem}>
                <strong>
                  {valueOrDash(entry.previousStatus)} → {valueOrDash(entry.newStatus)}
                </strong>
                <span>{valueOrDash(entry.changeReason)}</span>
                <small>{formatDate(entry.createdAt)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No hay movimientos recientes para este activo.</p>
        )}
      </section>
    </main>
  );
}