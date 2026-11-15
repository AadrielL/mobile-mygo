import React from 'react';

interface SkeletonProps {
  rows?: number;
  height?: string;
  className?: string;
}

/**
 * Skeleton leve em CSS puro (sem bibliotecas externas) para substituir telas em branco
 * durante o carregamento de dados (Prompt 03 - Economia de VPS).
 */
export const SkeletonList: React.FC<SkeletonProps> = ({
  rows = 3,
  height = '84px',
  className = ''
}) => {
  return (
    <div className={`skeleton-list ${className}`.trim()} role="status" aria-label="Carregando...">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-card"
          style={{ minHeight: height }}
        >
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
          <div className="skeleton-line skeleton-short" />
        </div>
      ))}
    </div>
  );
};
