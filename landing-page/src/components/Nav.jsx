import { Link, useLocation } from 'react-router-dom';
import logoMark from '../assets/logo-mark.svg';

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.56C20.22 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
  </svg>
);

export default function Nav({ variant = 'main' }) {
  const location = useLocation();
  const isRecording = location.pathname === '/recording';

  return (
    <nav className="nav">
      <Link className="brand" to="/">
        <img src={logoMark} alt="" />
        <span className="name">Cadency</span>
      </Link>
      <div className="links">
        <a href="/#products">Products</a>
        <a href="/#open-source">Open source</a>
        <Link to="/recording" className={isRecording ? 'active' : ''}>Recording</Link>
        <a href="#docs">Docs</a>
      </div>
      <div className="spacer"></div>
      <span className="nav-mono">
        <span className="pulse"></span>
        {variant === 'recording' ? 'v0.9.2 BETA' : 'v0.1.0 · Apache 2.0'}
      </span>
      <a
        className="gh-btn"
        href="https://github.com/JoeCowles/cadency"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon />
        {variant === 'recording' ? 'Source' : 'GitHub'}
      </a>
    </nav>
  );
}
