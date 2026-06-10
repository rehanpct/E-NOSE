import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass card-sensor flex flex-col items-center justify-center p-6 text-center h-full min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Component Failed</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[250px]">
            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
