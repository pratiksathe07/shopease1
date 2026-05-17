// src/components/Loader.jsx
export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loader-wrap">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: '0.9rem' }}>{text}</p>
      </div>
    </div>
  )
}
