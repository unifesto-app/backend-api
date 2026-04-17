export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Unifesto API</h1>
      <p>Backend API is running.</p>
      <ul>
        <li><a href="/api/health">Health Check</a></li>
      </ul>
    </div>
  );
}
