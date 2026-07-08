import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error in ForceGraph3D:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '24px 32px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          color: '#fca5a5',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          maxWidth: '80%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          zIndex: 10
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f87171', fontWeight: 'bold' }}>3D Graphics Rendering Failed</h3>
          <p style={{ margin: '0 0 16px 0', lineHeight: 1.4 }}>{this.state.error?.toString()}</p>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.8rem' }}>
            This usually indicates a WebGL context issue or a Three.js compatibility conflict in the browser. 2D Mode is unaffected.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
