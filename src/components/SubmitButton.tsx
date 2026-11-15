import React from 'react';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean;
  loadingText?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline';
  size?: 'md' | 'sm' | 'lg';
}

/**
 * Componente reutilizável de botão com bloqueio contra cliques duplos (isSubmitting)
 * e altura mínima de 44px para toque confortável em obra (Frente 01 - Prompts 02 e 03).
 */
export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting = false,
  loadingText = 'Salvando...',
  icon,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...rest
}) => {
  const variantClass = `app-btn-${variant}`;
  const sizeClass = size === 'sm' ? 'app-btn-sm' : size === 'lg' ? 'app-btn-lg' : '';

  return (
    <button
      {...rest}
      disabled={disabled || isSubmitting}
      aria-busy={isSubmitting}
      className={`app-btn ${variantClass} ${sizeClass} ${className}`.trim()}
    >
      {isSubmitting ? (
        <>
          <span
            className="material-icons spin"
            style={{ fontSize: '18px' }}
            aria-hidden="true"
          >
            sync
          </span>
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && (
            <span className="material-icons" style={{ fontSize: '18px' }} aria-hidden="true">
              {icon}
            </span>
          )}
          {children}
        </>
      )}
    </button>
  );
};
