import { Link } from 'react-router-dom';
import logoMark from '../assets/logo-mark.svg';

export default function Footer({ variant = 'main' }) {
  if (variant === 'recording') {
    return (
      <footer className="footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logoMark} width="20" height="20" alt="" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg)' }}>Cadency Recording</span>
          <span className="meta">&copy; 2026 · Apache 2.0</span>
        </div>
        <div className="links">
          <a href="https://github.com/JoeCowles/cadency" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="#changelog">Changelog</a>
          <a href="#perms">Permissions</a>
          <a href="#privacy">Privacy</a>
          <a href="#discord">Discord</a>
        </div>
        <span className="meta">v0.9.2 · sha 7b1e0f4</span>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={logoMark} width="20" height="20" alt="" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--fg)' }}>Cadency</span>
        <span className="meta">&copy; 2026 · Apache 2.0</span>
      </div>
      <div className="links">
        <a href="https://github.com/JoeCowles/cadency" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="#docs">Docs</a>
        <Link to="/recording">Recording</Link>
        <a href="#changelog">Changelog</a>
        <a href="#discord">Discord</a>
        <a href="#status">Status</a>
      </div>
      <span className="meta">v0.1.0 · main</span>
    </footer>
  );
}
