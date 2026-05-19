export default function DashboardHomePage() {
  return (
    <main className="dashboard-home">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Bienvenido</p>
          <h1>Gestión de inventario</h1>
          <p>Administra activos, préstamos, mantenimiento y reportes desde un solo lugar.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Activos</h2>
          <p>Consulta y administra los bienes registrados en el sistema.</p>
        </article>

        <article className="dashboard-card">
          <h2>Custodia y préstamos</h2>
          <p>Controla entregas, devoluciones y responsables de activos.</p>
        </article>

        <article className="dashboard-card">
          <h2>Mantenimiento</h2>
          <p>Da seguimiento a reparaciones y servicios de bienes.</p>
        </article>

        <article className="dashboard-card">
          <h2>Reportes</h2>
          <p>Revisa información útil para gestión y control del inventario.</p>
        </article>
      </section>
    </main>
  );
}