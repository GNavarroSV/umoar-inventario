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

  const asset = assetQuery.data as any;

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
            <dd>{valueOrDash(asset?.category?.name ?? asset?.categoryId)}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{valueOrDash(asset?.responsiblePerson?.name ?? asset?.responsiblePersonId)}</dd>
          </div>
          <div>
            <dt>Descripción</dt>
            <dd>{valueOrDash(asset?.description)}</dd>
          </div>
          <div>
            <dt>Centro de costo</dt>
            <dd>{valueOrDash(asset?.costCenterId)}</dd>
          </div>
          <div>
            <dt>Proveedor</dt>
            <dd>{valueOrDash(asset?.supplier?.name ?? asset?.supplierId)}</dd>
          </div>
          <div>
            <dt>Serie</dt>
            <dd>{valueOrDash(asset?.serialNumber)}</dd>
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
            <dd>{formatDate(asset?.purchaseDate)}</dd>
          </div>
          <div>
            <dt>Valor de compra</dt>
            <dd>{formatCurrency(asset?.purchaseValue)}</dd>
          </div>
          <div>
            <dt>Garantía hasta</dt>
            <dd>{formatDate(asset?.warrantyEndDate)}</dd>
          </div>
          <div>
            <dt>Meses de garantía</dt>
            <dd>{valueOrDash(asset?.warrantyMonths)}</dd>
          </div>
          <div>
            <dt>Depreciación</dt>
            <dd>{valueOrDash(asset?.depreciationType)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Actividad reciente</h2>

        {Array.isArray(asset?.history) && asset.history.length > 0 ? (
          <ul className={styles.historyList}>
            {asset.history.map((entry: any) => (
              <li key={entry.id} className={styles.historyItem}>
                <strong>{entry.previousStatus} → {entry.newStatus}</strong>
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