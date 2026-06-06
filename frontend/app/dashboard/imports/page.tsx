'use client';

import Link from 'next/link';
import { useState } from 'react';
import { API_BASE_URL, apiRequest } from '../../../config/api';
import { useAuthContext } from '../../../contexts/auth-context';
import styles from './imports.module.css';

const initialTemplateHref = '/templates/activos-carga-inicial.csv';
const updateTemplateHref = '/templates/activos-actualizacion.csv';

export default function ImportsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className="eyebrow">Carga masiva</p>
          <h1>Importación de activos</h1>
          <p className={styles.lead}>
            Usa una plantilla para alta inicial o una distinta para actualización masiva. Cada bloque descarga su ejemplo y
            mantiene reglas separadas para evitar mezclar flujos.
          </p>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <p className="eyebrow">Plantilla 1</p>
            <h2>Alta inicial de activos</h2>
            <p>Sirve para registrar activos nuevos con código autogenerado y cantidad inicial.</p>
          </div>

          <div className={styles.columns}>
            <div className={styles.sampleBox}>
              <strong>Campos mínimos</strong>
              <ul className={styles.list}>
                <li>código_legado</li>
                <li>nombre</li>
                <li>cantidad</li>
                <li>categoría</li>
                <li>responsable</li>
                <li>ubicación</li>
                <li>fecha_adquisición</li>
              </ul>
            </div>

            <div className={styles.sampleBox}>
              <strong>Campos opcionales</strong>
              <ul className={styles.list}>
                <li>serie</li>
                <li>fabricante</li>
                <li>modelo</li>
                <li>centro_de_costo</li>
                <li>valor_compra</li>
                <li>valor_actual</li>
              </ul>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href={initialTemplateHref} className="button button--primary" download>
              Descargar plantilla ejemplo
            </Link>
            <Link href={initialTemplateHref} className="button button--ghost" download>
              Descargar copia base
            </Link>
          </div>
          <div style={{ marginTop: 12 }}>
            <ImportUploader />
          </div>
          <p className={styles.downloadNote}>La primera fila del archivo contiene encabezados listos para copiar en Excel o CSV.</p>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <p className="eyebrow">Plantilla 2</p>
            <h2>Actualización masiva</h2>
            <p>Sirve para reemplazar valores simples y cantidad sobre activos ya identificados.</p>
          </div>

          <div className={styles.columns}>
            <div className={styles.sampleBox}>
              <strong>Identificación</strong>
              <ul className={styles.list}>
                <li>código_legado</li>
                <li>código</li>
                <li>serie</li>
              </ul>
            </div>

            <div className={styles.sampleBox}>
              <strong>Campos editables</strong>
              <ul className={styles.list}>
                <li>cantidad</li>
                <li>ubicación</li>
                <li>responsable</li>
                <li>centro_de_costo</li>
                <li>estado</li>
              </ul>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href={updateTemplateHref} className="button button--primary" download>
              Descargar plantilla ejemplo
            </Link>
            <Link href={updateTemplateHref} className="button button--ghost" download>
              Descargar copia base
            </Link>
          </div>
          <div style={{ marginTop: 12 }}>
            <ImportUploader />
          </div>
          <p className={styles.downloadNote}>La actualización reemplaza la cantidad actual; no suma ni resta automáticamente.</p>
        </article>
      </section>
    </main>
  );
}

function ImportUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [strategy, setStrategy] = useState('UPSERT');
  const { session } = useAuthContext();

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('strategy', strategy);

      const res = await fetch(`${API_BASE_URL}/imports/assets/dry-run`, {
        method: 'POST',
        headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined,
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Error en previsualización');
      }

      const payload = await res.json();
      setResult(payload);
    } catch (err: any) {
      setResult({ error: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute() {
    if (!result?.batchId) return;
    setLoading(true);
    try {
      const payload = await apiRequest<any>(`/imports/assets/execute/${result.batchId}`, { method: 'POST', token: session?.accessToken });
      setResult((r: any) => ({ ...r, execute: payload }));
    } catch (err: any) {
      setResult({ error: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function refreshBatch() {
    if (!result?.batchId) return;
    try {
      const batch = await apiRequest<any>(`/imports/assets/batch/${result.batchId}`, { token: session?.accessToken });
      setResult((r: any) => ({ ...r, batch }));
    } catch (err: any) {
      // ignore
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
          <option value="UPSERT">Actualizar o crear</option>
          <option value="INSERT_ONLY">Solo crear</option>
          <option value="DRY_RUN">Solo validar</option>
        </select>
        <button className="button button--primary" onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'Procesando...' : 'Previsualizar'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 12 }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
          {result.batchId && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="button button--primary" onClick={handleExecute} disabled={loading}>
                Ejecutar importación
              </button>
              <button className="button" onClick={refreshBatch} disabled={loading}>
                Actualizar estado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}