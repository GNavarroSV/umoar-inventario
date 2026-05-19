'use client';

import Link from 'next/link';
import { useAssetsQuery } from '../../../hooks/assets/assets';
import styles from './assets.module.css';

type AssetItem = {
  id: number;
  code: string;
  name: string;
  status: string;
  location: string;
  currentValue: number;
};

export default function AssetsPage() {
  const { data, isLoading, isError } = useAssetsQuery();

  if (isLoading) return <p>Cargando activos...</p>;
  if (isError) return <p>No se pudieron cargar los activos.</p>;

  const assets =
    (data as { data?: AssetItem[] } | undefined)?.data ??
    (data as AssetItem[] | undefined) ??
    [];

  return (
    <section className={styles.assetsPage}>
      <div className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Activos</p>
          <h1>Listado de activos</h1>
        </div>

        <Link href="/dashboard/assets/new" className="button button--primary">
          Nuevo activo
        </Link>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Ubicación</th>
              <th>Valor actual</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={6}>No hay activos registrados.</td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.code}</td>
                  <td>{asset.name}</td>
                  <td>{asset.status}</td>
                  <td>{asset.location}</td>
                  <td>{asset.currentValue}</td>
                  <td>
                    <Link className={styles.link} href={`/dashboard/assets/${asset.id}`}>
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}