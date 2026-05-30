/**
 * GloseMester v3 — scaffold-rot (fase B1).
 *
 * Dette er kun et levende bevis på at byggekjeden (Vite + React + TS),
 * merkevare-tokens og fonter fungerer. Faktiske sider og features bygges
 * inn i fase B2/B3 — se docs/DEL-B-REACT-PLAN.md.
 */
export default function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-8)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 900,
          color: 'var(--color-primary)',
        }}
      >
        GloseMester v3
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '40ch' }}>
        React + Vite + TypeScript-scaffold er på plass. Sider og funksjoner
        bygges inn fase for fase.
      </p>
      <span
        style={{
          background: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          borderRadius: 'var(--radius-full)',
          padding: 'var(--space-2) var(--space-4)',
          fontWeight: 700,
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Fase B1 — fundament
      </span>
    </main>
  );
}
