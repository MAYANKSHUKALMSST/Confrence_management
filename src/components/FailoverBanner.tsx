import React from 'react';
import { useFailover } from '@/lib/failover';

export const FailoverBanner: React.FC = () => {
  const { isHealthy, isFailoverActive, activeRole } = useFailover();

  // On Primary, everything normal
  if (activeRole === 'primary' && isHealthy) {
    return null;
  }

  // Server Unreachable
  if (!isHealthy) {
    return (
      <div style={styles.banner} className="failover-banner failover-banner--danger">
        <div style={styles.content}>
          <span style={styles.icon}>🔴</span>
          <span style={styles.text}>Connection lost — attempting redundant failover...</span>
          <span style={styles.spinner}>⏳</span>
        </div>
      </div>
    );
  }

  // On Backup / Failover Active
  if (isFailoverActive) {
    return (
      <div style={styles.banner} className="failover-banner failover-banner--warning">
        <div style={styles.content}>
          <span style={styles.icon}>🟡</span>
          <span style={styles.text}>
            Running on Redundant Backup Server
          </span>
          <span style={styles.subtext}>Main server is being restored...</span>
        </div>
      </div>
    );
  }

  return null;
};

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: '8px 16px',
    fontSize: '13px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    animation: 'slideDown 0.3s ease-out',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    maxWidth: '960px',
    margin: '0 auto',
  },
  icon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  text: {
    color: 'inherit',
  },
  subtext: {
    opacity: 0.7,
    fontSize: '12px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
};

// Inject keyframes and theme-specific styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .failover-banner--warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
    }
    .failover-banner--success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
    }
    .failover-banner--danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
    }
    /* Push page content down when banner is shown */
    .failover-banner + * {
      margin-top: 40px;
    }
  `;
  document.head.appendChild(styleEl);
}

export default FailoverBanner;
