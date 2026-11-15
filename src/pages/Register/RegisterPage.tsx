import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../core/services/authService';
import { SubmitButton } from '../../components/SubmitButton';

export const RegisterPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState<'ELETRICISTA' | 'CLIENTE'>('ELETRICISTA');

  const [etapaVerificacao, setEtapaVerificacao] = useState(false);
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sucessoMensagem, setSucessoMensagem] = useState('');

  const navigate = useNavigate();

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage('');
    setSucessoMensagem('');

    if (!nome || !email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        'A senha deve ter no mínimo 8 caracteres (com maiúscula, minúscula e número).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({
        nome,
        email,
        password,
        tipoPerfil
      });
      setEtapaVerificacao(true);
      setSucessoMensagem('Código de verificação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      if (err?.error && typeof err.error === 'string') {
        setErrorMessage(err.error);
      } else if (err?.status === 400) {
        setErrorMessage('Dados inválidos ou e-mail já cadastrado.');
      } else if (err?.status === 0) {
        setErrorMessage('Não foi possível conectar ao servidor.');
      } else {
        setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!codigoVerificacao || codigoVerificacao.trim().length !== 6) {
      setErrorMessage('Por favor, digite o código de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await authService.verificarCodigo(email, codigoVerificacao.trim());
      alert('⚡ Conta ativada com sucesso! Bem-vindo ao ecossistema AMORIS Tech.');
      navigate('/dashboard-main');
    } catch (err: any) {
      if (err?.error && typeof err.error === 'string') {
        setErrorMessage(err.error);
      } else {
        setErrorMessage('Código incorreto ou expirado. Solicite um novo código.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onReenviarCodigo = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    setSucessoMensagem('');

    try {
      await authService.reenviarCodigo(email);
      setSucessoMensagem('Novo código enviado para o seu e-mail!');
    } catch {
      setErrorMessage('Não foi possível reenviar o código agora. Tente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem 0.85rem'
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--accent-muted)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              margin: '0 auto 0.85rem auto'
            }}
          >
            <span className="material-icons" style={{ fontSize: '26px' }}>
              bolt
            </span>
          </div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '0.25rem'
            }}
          >
            {etapaVerificacao ? 'Confirme seu E-mail' : 'Criar Conta AMORIS Tech'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {etapaVerificacao
              ? 'Enviamos um código de segurança de 6 dígitos para o seu endereço.'
              : 'Plataforma inteligente de cálculos elétricos NBR 5410 e orçamentos.'}
          </p>
        </div>

        {!etapaVerificacao ? (
          <div className="app-card">
            <form onSubmit={onRegister}>
              <div className="app-form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="app-label">Tipo de Perfil</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginTop: '0.25rem'
                  }}
                >
                  <button
                    type="button"
                    className={`app-btn ${
                      tipoPerfil === 'ELETRICISTA' ? 'app-btn-primary' : 'app-btn-secondary'
                    }`}
                    onClick={() => setTipoPerfil('ELETRICISTA')}
                  >
                    <span className="material-icons" style={{ fontSize: '16px' }}>
                      handyman
                    </span>
                    <span>Eletricista</span>
                  </button>

                  <button
                    type="button"
                    className={`app-btn ${
                      tipoPerfil === 'CLIENTE' ? 'app-btn-primary' : 'app-btn-secondary'
                    }`}
                    onClick={() => setTipoPerfil('CLIENTE')}
                  >
                    <span className="material-icons" style={{ fontSize: '16px' }}>
                      person
                    </span>
                    <span>Cliente</span>
                  </button>
                </div>
              </div>

              <div className="app-form-group">
                <label className="app-label">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                  className="app-input"
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="app-input"
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Senha de Acesso (mínimo 8 caracteres)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex: SenhaForte@2026"
                  required
                  className="app-input"
                />
                <small
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    marginTop: '3px',
                    display: 'block'
                  }}
                >
                  Deve conter letras maiúsculas, minúsculas e números.
                </small>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  background: 'var(--accent-muted)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    color: 'var(--accent-primary)',
                    fontSize: '20px',
                    marginTop: '1px'
                  }}
                >
                  verified_user
                </span>
                <div>
                  <span className="app-badge app-badge-amber" style={{ marginBottom: '0.35rem' }}>
                    CONTA SEGURA
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Um código de verificação será enviado para confirmar a autenticidade do seu
                    e-mail.
                  </p>
                </div>
              </div>

              <SubmitButton
                type="submit"
                isSubmitting={isSubmitting}
                loadingText="Enviando código..."
                icon="mail"
                style={{ width: '100%' }}
              >
                <span>Continuar e Receber Código</span>
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
                marginTop: '1.25rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}
            >
              Já tem conta?
              <Link
                to="/login"
                style={{
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  marginLeft: '0.25rem'
                }}
              >
                Fazer Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="app-card">
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span
                className="material-icons"
                style={{
                  fontSize: '48px',
                  color: 'var(--accent-primary)',
                  marginBottom: '0.5rem'
                }}
              >
                mark_email_read
              </span>
              <p className="break-words" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Código enviado para: <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
              </p>
            </div>

            {sucessoMensagem && (
              <p
                style={{
                  color: 'var(--status-success)',
                  background: 'var(--status-success-bg)',
                  border: '1px solid var(--status-success-border)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                  textAlign: 'center'
                }}
              >
                {sucessoMensagem}
              </p>
            )}

            <form onSubmit={onVerificarCodigo}>
              <div className="app-form-group" style={{ textAlign: 'center' }}>
                <label className="app-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Digite o código de 6 dígitos
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={codigoVerificacao}
                  onChange={(e) => setCodigoVerificacao(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="app-input"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.35em',
                    textAlign: 'center',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                />
              </div>

              <SubmitButton
                type="submit"
                isSubmitting={isSubmitting}
                loadingText="Verificando..."
                icon="check_circle"
                disabled={codigoVerificacao.length < 6}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                <span>Ativar Minha Conta</span>
              </SubmitButton>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '1.25rem'
                }}
              >
                <button
                  type="button"
                  className="app-btn app-btn-ghost app-btn-sm"
                  onClick={() => setEtapaVerificacao(false)}
                >
                  <span className="material-icons" style={{ fontSize: '15px' }}>
                    arrow_back
                  </span>
                  <span>Corrigir e-mail</span>
                </button>

                <button
                  type="button"
                  className="app-btn app-btn-secondary app-btn-sm"
                  onClick={onReenviarCodigo}
                  disabled={isSubmitting}
                >
                  <span className="material-icons" style={{ fontSize: '15px' }}>
                    refresh
                  </span>
                  <span>Reenviar Código</span>
                </button>
              </div>
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
                  gap: '0.4rem',
                  justifyContent: 'center'
                }}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  error_outline
                </span>
                <span>{errorMessage}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
