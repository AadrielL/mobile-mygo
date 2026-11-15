import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../core/services/authService';
import { environment } from '../../config/environment';
import { SubmitButton } from '../../components/SubmitButton';

declare const MercadoPago: any;

export const AssinaturaPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [erroMP, setErroMP] = useState('');
  const [vagasVitalicias, setVagasVitalicias] = useState(1000);

  const mpRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inicializarMP();
    authService
      .getVagasVitalicias()
      .then((v) => setVagasVitalicias(typeof v === 'number' ? v : 1000))
      .catch(() => {});
  }, []);

  const inicializarMP = () => {
    if (typeof MercadoPago === 'undefined') {
      setTimeout(() => inicializarMP(), 1000);
      return;
    }
    try {
      mpRef.current = new MercadoPago(environment.mercadoPagoPublicKey, {
        locale: 'pt-BR'
      });
    } catch {
      setErroMP('Erro ao inicializar o SDK do Mercado Pago.');
    }
  };

  const iniciarPagamento = (valor: number) => {
    if (isSubmitting) return;
    if (!mpRef.current) {
      setErroMP('SDK do Mercado Pago não está pronto. Aguarde...');
      inicializarMP();
      return;
    }

    setIsSubmitting(true);
    setErroMP('');

    setTimeout(() => {
      setIsSubmitting(false);
      setCheckoutActive(true);
      setTimeout(() => renderizarBrick(valor), 150);
    }, 400);
  };

  const renderizarBrick = (valor: number) => {
    const container = document.getElementById('wallet_container');
    if (!container || !mpRef.current) return;
    container.innerHTML = '';

    try {
      mpRef.current.bricks().create('payment', 'wallet_container', {
        initialization: { amount: valor },
        customization: {
          paymentMethods: {
            ticket: 'all',
            bankTransfer: 'all',
            creditCard: 'all',
            debitCard: 'all',
            mercadoPago: 'all'
          }
        },
        callbacks: {
          onReady: () => {},
          onSubmit: ({ formData }: any) => {
            return new Promise<void>((resolve, reject) => {
              authService
                .processarPagamento(formData)
                .then((res: any) => {
                  resolve();
                  if (res?.id) {
                    mostrarTelaDeStatus(res.id);
                  } else if (res?.status === 'approved') {
                    alert('Pagamento aprovado com sucesso!');
                    fecharCheckout();
                  }
                })
                .catch(() => {
                  reject();
                  setErroMP('Erro ao processar o pagamento com a API.');
                });
            });
          },
          onError: () => {
            setErroMP('Falha ao carregar o formulário de pagamento.');
          }
        }
      });
    } catch {
      setErroMP('Erro ao criar o componente de pagamento.');
    }
  };

  const mostrarTelaDeStatus = (paymentId: string) => {
    const container = document.getElementById('wallet_container');
    if (!container || !mpRef.current) return;
    container.innerHTML = '';

    try {
      mpRef.current.bricks().create('statusScreen', 'wallet_container', {
        initialization: { paymentId },
        customization: {
          visual: {
            hideStatusDetails: false,
            hideTransactionDate: false,
            style: { theme: 'default' }
          }
        },
        callbacks: {
          onReady: () => {},
          onError: () => {}
        }
      });
    } catch {
      // silencioso
    }
  };

  const fecharCheckout = async () => {
    setCheckoutActive(false);
    setErroMP('');
    setIsSubmitting(true);
    try {
      await authService.refreshSession();
      const plan = authService.getPlanType();
      if (plan !== 'FREE') {
        alert('⚡ Assinatura confirmada com sucesso! Bem-vindo ao MyGo PRO.');
        navigate('/dashboard-main');
      }
    } catch {
      // silencioso
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1040px', paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="app-title" style={{ fontSize: '1.6rem' }}>
          Assinatura <span style={{ color: 'var(--accent-primary)' }}>PRO</span>
        </h1>
        <p className="app-subtitle" style={{ marginTop: '0.4rem' }}>
          Desbloqueie orçamentos ilimitados e acesso completo à plataforma.
        </p>
        <button
          type="button"
          className="app-btn app-btn-ghost"
          onClick={() => navigate('/quiz')}
          style={{ marginTop: '0.85rem' }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            arrow_back
          </span>
          <span>Continuar no Plano Grátis (3 orçamentos/dia)</span>
        </button>
      </div>

      {erroMP && (
        <div
          className="break-words"
          style={{
            background: 'var(--status-danger-bg)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: 'var(--status-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span className="material-icons">error_outline</span>
          <span>{erroMP}</span>
        </div>
      )}

      <div className="app-grid-3">
        {/* Plano Semanal */}
        <div className="app-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className="app-badge app-badge-muted">SEMANAL</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-info)' }}>
            Plano Semanal
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Até 50 Orçamentos / dia
          </p>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            R$ 1,99
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            por semana
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              textAlign: 'left',
              marginBottom: '1.5rem',
              flex: 1
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Dashboard Liberado</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Relatórios Gerenciais</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Envio via WhatsApp</span>
            </li>
          </ul>
          <SubmitButton
            type="button"
            variant="secondary"
            isSubmitting={isSubmitting}
            loadingText="Carregando..."
            onClick={() => iniciarPagamento(1.99)}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <span>Assinar Semanal</span>
          </SubmitButton>
        </div>

        {/* Plano Mensal */}
        <div
          className="app-card"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            borderColor: 'var(--accent-primary)',
            position: 'relative',
            boxShadow: '0 0 0 1px var(--accent-primary)'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent-primary)',
              color: '#0c0e12',
              padding: '2px 14px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              whiteSpace: 'nowrap'
            }}
          >
            MAIS POPULAR
          </div>
          <div style={{ marginBottom: '0.5rem', marginTop: '0.25rem' }}>
            <span className="app-badge app-badge-amber">MENSAL</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            Plano Mensal
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Até 100 Orçamentos / dia
          </p>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            R$ 9,99
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            por mês
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              textAlign: 'left',
              marginBottom: '1.5rem',
              flex: 1
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Dashboard Liberado</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Relatórios Gerenciais</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Envio via WhatsApp</span>
            </li>
          </ul>
          <SubmitButton
            type="button"
            variant="primary"
            isSubmitting={isSubmitting}
            loadingText="Carregando..."
            onClick={() => iniciarPagamento(9.99)}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <span>Assinar Mensal</span>
          </SubmitButton>
        </div>

        {/* Plano Vitalício */}
        <div
          className="app-card"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '2px 14px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              whiteSpace: 'nowrap'
            }}
          >
            {vagasVitalicias} / 1000 vagas
          </div>
          <div style={{ marginBottom: '0.5rem', marginTop: '0.25rem' }}>
            <span className="app-badge app-badge-muted">VITALÍCIO</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Plano Vitalício
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Acesso Ilimitado para Sempre
          </p>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            R$ 199
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            pagamento único
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              textAlign: 'left',
              marginBottom: '1.5rem',
              flex: 1
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>100 Orçamentos / dia</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Sem cobranças mensais</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Todas as ferramentas</span>
            </li>
          </ul>
          <SubmitButton
            type="button"
            variant={vagasVitalicias > 0 ? 'secondary' : 'ghost'}
            isSubmitting={isSubmitting}
            loadingText="Carregando..."
            disabled={vagasVitalicias <= 0}
            onClick={() => iniciarPagamento(199.0)}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            <span>{vagasVitalicias > 0 ? 'Garantir Vaga' : 'Esgotado'}</span>
          </SubmitButton>
        </div>
      </div>

      {checkoutActive && (
        <div className="app-modal-overlay">
          <div className="app-modal" style={{ maxWidth: '550px' }}>
            <div className="app-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-icons" style={{ color: 'var(--status-success)' }}>
                  lock
                </span>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  Pagamento Seguro
                </h3>
              </div>
              <button type="button" className="btn-close-custom" onClick={fecharCheckout}>
                &times;
              </button>
            </div>
            <div className="app-modal-body">
              <div id="wallet_container" style={{ minHeight: '220px' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
