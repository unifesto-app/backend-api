import type { JSX } from 'react';

export default function Home(): JSX.Element {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>UNIFESTO API</h1>
      <p>Version 1.0.0</p>
      <p>Status: ok</p>
    </main>
  );
}
