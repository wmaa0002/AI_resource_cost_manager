/**
 * 加载状态组件
 */

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfigs = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export function Loading({ size = 'md', className = '' }: LoadingProps) {
  return (
    <div
      className={`
        inline-block rounded-full border-gray-300 border-t-blue-500 animate-spin
        ${sizeConfigs[size]}
        ${className}
      `}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = '加载中...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <Loading size="lg" />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  );
}

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <Loading size="md" />
      {text && <span className="text-gray-500">{text}</span>}
    </div>
  );
}

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = '页面加载中...' }: PageLoaderProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <Loading size="lg" />
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
}
