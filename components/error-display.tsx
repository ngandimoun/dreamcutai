import { AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  suggestion: string;
  severity: 'critical' | 'warning' | 'info';
  onRetry?: () => void;
}

export function ErrorDisplay({ error, suggestion, severity, onRetry }: ErrorDisplayProps) {
  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600'
    }
  };
  
  const config = severityConfig[severity];
  
  return (
    <div className={`border rounded-lg p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.icon}`} />
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${config.text}`}>{error}</h3>
          <div className="flex items-start gap-2 mt-2">
            <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.icon}`} />
            <p className={`text-sm ${config.text}`}>{suggestion}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              type="button"
              className={`mt-3 flex items-center gap-2 text-sm font-medium ${config.text} hover:underline`}
            >
              <RefreshCw className="w-4 h-4" />
              Try again with simpler content
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


