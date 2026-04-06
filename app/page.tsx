import type { JSX } from 'react';

export default function Home(): JSX.Element {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        background: '#f5f7fb',
        color: '#111827',
        padding: '1.5rem',
      }}
    >
      <section
        style={{
          width: 'min(520px, 100%)',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(17, 24, 39, 0.06)',
        }}
      >
        <div style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '0.75rem' }} aria-hidden="true">
          🐒
        </div>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Nothing to see here</h1>
        <p style={{ marginTop: '0.6rem', marginBottom: 0, color: '#6b7280' }}>
          This is a backend API service. Use the API endpoints instead of opening the root URL.
        </p>
      </section>
    </main>
  );
}
