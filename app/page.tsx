"use client";

import { useEffect, type JSX } from 'react';

export default function Home(): JSX.Element {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace('https://unifesto.app/');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

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
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: '0.75rem' }} aria-hidden="true">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="30" r="12" fill="#C99A6B" />
            <circle cx="78" cy="30" r="12" fill="#C99A6B" />
            <circle cx="18" cy="30" r="6" fill="#E7C9A8" />
            <circle cx="78" cy="30" r="6" fill="#E7C9A8" />
            <ellipse cx="48" cy="44" rx="30" ry="28" fill="#B8804F" />
            <ellipse cx="48" cy="52" rx="20" ry="16" fill="#E7C9A8" />
            <circle cx="38" cy="42" r="3" fill="#1F2937" />
            <circle cx="58" cy="42" r="3" fill="#1F2937" />
            <ellipse cx="48" cy="52" rx="2.2" ry="1.8" fill="#7C4A25" />
            <path d="M41 58C42.8 60 45.2 61 48 61C50.8 61 53.2 60 55 58" stroke="#7C4A25" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Nothing to see here</h1>
        <p style={{ marginTop: '0.6rem', marginBottom: 0, color: '#6b7280' }}>
          Redirecting to home in 5 seconds.
        </p>
        <a
          href="https://unifesto.app/"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            textDecoration: 'none',
            background: '#111827',
            color: '#ffffff',
            padding: '0.55rem 1rem',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          Back to Home
        </a>
      </section>
    </main>
  );
}
