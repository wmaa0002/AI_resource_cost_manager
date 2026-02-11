/**
 * 骨架屏组件
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const variantStyles = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
};

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-gray-200 ${variantStyles[variant]}
        ${className}
      `}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  height?: number;
}

export function SkeletonList({ count = 3, height = 60 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} className="w-full" />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  showImage?: boolean;
}

export function SkeletonCard({ showImage = false }: SkeletonCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-4">
        {showImage && (
          <Skeleton width={48} height={48} variant="circular" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <Skeleton height={40} className="w-full" />
      <div className="flex gap-2">
        <Skeleton width={80} height={24} />
        <Skeleton width={80} height={24} />
      </div>
    </div>
  );
}
