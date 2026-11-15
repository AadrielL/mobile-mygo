import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../core/services/authService';
import { SubmitButton } from '../../components/SubmitButton';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await authService.login({ email, password });
      navigate('/dashboard-main');
    } catch (err: any) {
      setErrorMessage(
        err?.status === 403 || err?.status === 401
          ? 'E-mail ou senha inválidos.'
          : 'Erro ao conectar ao servidor.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-info-panel">
        <div className="login-info-inner">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '2rem'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: 'var(--accent-muted)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                flexShrink: 0
              }}
            >
              <span className="material-icons">bolt</span>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              MYGO <strong style={{ color: 'var(--accent-primary)' }}>ELÉTRICA</strong>
            </span>
          </div>

          <h2
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '0.65rem',
              lineHeight: 1.2
            }}
          >
            Plataforma de Orçamentos Elétricos
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}
          >
            Automatize seus cálculos de mão de obra, dimensionamento de cabos e levantamento de
            materiais conforme a NBR 5410.
          </p>

          <div className="login-features-list">
            <div className="login-feature-item">
              <span className="material-icons" style={{ color: 'var(--accent-primary)' }}>
                calculate
              </span>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Cálculo Automatizado
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Orçamentos precisos em minutos
                </p>
              </div>
            </div>

            <div className="login-feature-item">
              <span className="material-icons" style={{ color: 'var(--status-success)' }}>
                inventory_2
              </span>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Lista de Materiais NBR 5410
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Dimensionamento técnico automatizado
                </p>
              </div>
            </div>

            <div className="login-feature-item">
              <span className="material-icons" style={{ color: 'var(--status-info)' }}>
                chat
              </span>
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Envio via WhatsApp
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Proposta direto para o cliente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-inner">
          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '0.25rem'
            }}
          >
            Acessar Plataforma
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              marginBottom: '1.5rem'
            }}
          >
            Insira suas credenciais para continuar.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="app-form-group">
              <label className="app-label" htmlFor="login-email">
                E-mail Profissional
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="app-input"
                autoComplete="email"
              />
            </div>

            <div className="app-form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="app-label" htmlFor="login-password">
                Senha de Acesso
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="app-input"
                autoComplete="current-password"
              />
            </div>

            <SubmitButton
              type="submit"
              isSubmitting={isSubmitting}
              loadingText="Entrando..."
              icon="login"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              <span>Entrar</span>
            </SubmitButton>
          </form>

          {errorMessage && (
            <p
              className="break-words"
              style={{
                color: 'var(--status-danger)',
                marginTop: '1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>
                error_outline
              </span>
              <span>{errorMessage}</span>
            </p>
          )}

          <div
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-muted)'
            }}
          >
            Não tem conta?
            <Link
              to="/register"
              style={{
                color: 'var(--accent-primary)',
                fontWeight: 700,
                marginLeft: '0.35rem'
              }}
            >
              Cadastre-se grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
