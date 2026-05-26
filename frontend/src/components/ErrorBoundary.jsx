import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-50 border border-red-200 rounded-xl">
          <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong.</h1>
          <p className="font-mono text-sm text-red-500 mb-4">{this.state.error?.toString()}</p>
          <pre className="p-4 bg-white rounded border border-red-100 overflow-auto text-xs text-slate-700">
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
