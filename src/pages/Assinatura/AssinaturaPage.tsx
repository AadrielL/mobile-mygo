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
    <div
      className="app-container"
      style={{
        maxWidth: '480px',
        minHeight: '100vh',
        paddingBottom: '5rem',
        borderLeft: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 className="app-title" style={{ fontSize: '1.4rem' }}>
          Planos <span style={{ color: 'var(--accent-primary)' }}>MyGo Elétrica</span>
        </h1>
        <p className="app-subtitle" style={{ marginTop: '0.35rem' }}>
          Desbloqueie os 5 Agentes de IA, Kit Eletrotécnico NBR 5410 e Orçamentos Ilimitados.
        </p>
        <button
          type="button"
          className="app-btn app-btn-ghost"
          onClick={() => navigate('/dashboard-main')}
          style={{ marginTop: '0.65rem' }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            arrow_back
          </span>
          <span>Voltar ao Painel Mobile</span>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {/* Plano PRO Eletricista de Campo */}
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
            MAIS ESCOLHIDO POR ELETRICISTAS
          </div>
          <div style={{ marginBottom: '0.35rem', marginTop: '0.25rem' }}>
            <span className="app-badge app-badge-amber">PRO ELETRICISTA</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            PRO Eletricista de Campo
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            Orçamentos Ilimitados + Kit NBR 5410 + 25 Consultas IA/dia
          </p>
          <div
            style={{
              fontSize: '1.9rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            R$ 39,90
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            por mês
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              textAlign: 'left',
              marginBottom: '1.15rem',
              fontSize: '0.84rem'
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Kit Eletrotécnico NBR 5410 Completo (ΔV, Conduíte, BTU e QDC)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Pré-Definição de Fios Calibrada por Padrão de Casa (IA)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Link Exclusivo (?ref=) Blindado Anti-Concorrência</span>
            </li>
          </ul>
          <SubmitButton
            type="button"
            variant="primary"
            isSubmitting={isSubmitting}
            loadingText="Carregando..."
            onClick={() => iniciarPagamento(39.9)}
            style={{ width: '100%' }}
          >
            <span>Assinar PRO Eletricista (R$ 39,90/mês)</span>
          </SubmitButton>
        </div>

        {/* Plano Técnico Eletrotécnico AI Master */}
        <div className="app-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '0.35rem' }}>
            <span className="app-badge app-badge-info">ELETROTÉCNICO MASTER AI</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-info)' }}>
            Técnico Eletrotécnico AI
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            Prioridade Máxima na Fila + 60 Consultas Multi-Agentes/dia
          </p>
          <div
            style={{
              fontSize: '1.9rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            R$ 69,90
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            por mês
          </div>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              textAlign: 'left',
              marginBottom: '1.15rem',
              fontSize: '0.84rem'
            }}
          >
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Todos os 5 Agentes Liberados (NR-10, Regional UF e Auditor)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Prioridade VIP na Fila de Inferência (Sem Espera)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '16px', color: 'var(--status-success)' }}>
                check_circle
              </span>
              <span>Relatórios Executivos e Dimensionamento Trifásico/Industrial</span>
            </li>
          </ul>
          <SubmitButton
            type="button"
            variant="secondary"
            isSubmitting={isSubmitting}
            loadingText="Carregando..."
            onClick={() => iniciarPagamento(69.9)}
            style={{ width: '100%' }}
          >
            <span>Assinar Eletrotécnico AI (R$ 69,90/mês)</span>
          </SubmitButton>
        </div>

        {/* Plano Vitalício Fundador */}
        <div
          className="app-card"
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          <div style={{ marginBottom: '0.35rem' }}>
            <span className="app-badge app-badge-muted">
              VITALÍCIO FUNDADOR ({vagasVitalicias} vagas)
            </span>
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Passaporte Vitalício MyGo
          </h3>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: '0.35rem'
            }}
          >
            R$ 297,00
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            pagamento único (sem mensalidade)
          </div>
          <SubmitButton
            type="button"
            variant={vagasVitalicias > 0 ? 'secondary' : 'ghost'}
            isSubmitting={isSubmitting}
            loadingText="Carregando..."
            disabled={vagasVitalicias <= 0}
            onClick={() => iniciarPagamento(297.0)}
            style={{ width: '100%' }}
          >
            <span>{vagasVitalicias > 0 ? 'Garantir Vaga Vitalícia' : 'Esgotado'}</span>
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
