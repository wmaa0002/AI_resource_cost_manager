/**
 * 响应式布局组件
 */

import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidths = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-8xl',
  full: 'max-w-full',
};

export function Container({ children, className = '', size = 'lg' }: ContainerProps) {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidths[size]} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

const gapSizes = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function ResponsiveGrid({
  children,
  className = '',
  cols = 2,
  gap = 'md',
}: ResponsiveGridProps) {
  return (
    <div className={`grid ${gridCols[cols]} ${gapSizes[gap]} ${className}`}>
      {children}
    </div>
  );
}

interface FlexProps {
  children: ReactNode;
  className?: string;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 'sm' | 'md' | 'lg';
}

const flexDirections = {
  row: 'flex-row',
  col: 'flex-col',
};

const alignItems = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyContent = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

const flexGaps = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export function Flex({
  children,
  className = '',
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
}: FlexProps) {
  return (
    <div
      className={`
        flex ${flexDirections[direction]} ${alignItems[align]}
        ${justifyContent[justify]} ${flexGaps[gap]} ${className}
      `}
    >
      {children}
    </div>
  );
}

interface HideProps {
  children: ReactNode;
  below?: 'sm' | 'md' | 'lg' | 'xl';
  above?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Hide({ children, below, above }: HideProps) {
  let className = '';

  if (below) {
    const breakpoints: Record<string, string> = {
      sm: 'block sm:hidden',
      md: 'block md:hidden',
      lg: 'block lg:hidden',
      xl: 'block xl:hidden',
    };
    className = breakpoints[below];
  }

  if (above) {
    const breakpoints: Record<string, string> = {
      sm: 'hidden sm:block',
      md: 'hidden md:block',
      lg: 'hidden lg:block',
      xl: 'hidden xl:block',
    };
    className = breakpoints[above];
  }

  return <div className={className}>{children}</div>;
}

interface ShowProps {
  children: ReactNode;
  when?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Show({ children, when }: ShowProps) {
  if (!when) return <>{children}</>;

  const breakpoints: Record<string, string> = {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
  };

  return <div className={breakpoints[when]}>{children}</div>;
}

interface SpacerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Spacer({ size = 'md' }: SpacerProps) {
  const heights: Record<string, string> = {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  return <div className={heights[size]} />;
}
