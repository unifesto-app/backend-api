import type { JSX } from 'react';

export default function BlockedPage(): JSX.Element {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0b1020',
        color: '#f8fafc',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        padding: '1.5rem',
      }}
    >
      <section
        style={{
          width: 'min(560px, 100%)',
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.35)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.7rem' }}>Access Blocked</h1>
        <p style={{ marginTop: '0.8rem', marginBottom: 0, color: '#94a3b8' }}>
          You are prohibited from UNIFESTO due to repeated access attempts. If you believe this is a mistake, please contact support.
        </p>
        <p style={{ marginTop: '0.55rem', marginBottom: 0, color: '#64748b', fontSize: '0.9rem' }}>
          This IP is  blocked from our system due to repeated access attempts.
        </p>
      </section>
    </main>
  );
}
