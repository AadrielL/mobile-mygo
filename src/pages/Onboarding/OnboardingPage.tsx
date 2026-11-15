import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './OnboardingPage.css';

export const OnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [refEletricista, setRefEletricista] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setRefEletricista(ref);
      localStorage.setItem('tenant_eletricista', ref);
    }
  }, [searchParams]);

  const goToLogin = () => {
    navigate('/login');
  };

  const solicitarOrcamentoCliente = () => {
    const tenantSalvo = refEletricista || localStorage.getItem('tenant_eletricista');
    if (tenantSalvo) {
      navigate('/quiz');
    } else {
      navigate('/parceiros');
    }
  };

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="landing-logo-icon">
              <span className="material-icons">bolt</span>
            </div>
            <div className="landing-brand-text">
              <span className="brand-title">
                MYGO <strong>ELÉTRICA</strong>
              </span>
              <span className="brand-sub">NBR 5410 • Palmas/TO</span>
            </div>
          </div>

          <div className="landing-nav-actions">
            <Link to="/parceiros" className="app-btn app-btn-ghost">
              <span
                className="material-icons"
                style={{ fontSize: '16px', color: 'var(--accent-primary)' }}
              >
                handshake
              </span>
              <span>Rede de Eletricistas</span>
            </Link>

            <button type="button" className="app-btn app-btn-secondary" onClick={goToLogin}>
              <span className="material-icons" style={{ fontSize: '16px' }}>
                login
              </span>
              <span>Área do Eletricista</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="hero-grid">
          <div className="hero-content">
            <div className="app-badge app-badge-amber" style={{ marginBottom: '1.25rem' }}>
              <span className="material-icons" style={{ fontSize: '14px' }}>
                verified
              </span>
              <span>ECOSSISTEMA ELÉTRICO INTELIGENTE & COTAÇÃO DIRETA</span>
            </div>

            <h1 className="hero-title">
              Orçamentos Elétricos em Minutos pela <span className="highlight">NBR 5410</span>
            </h1>

            <p className="hero-description">
              A ferramenta que conecta clientes e eletricistas autônomos de Palmas/TO com cálculos
              precisos de mão de obra, lista de materiais dimensionada e envio direto para cotação
              na Capital Elétrica.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="app-btn app-btn-primary app-btn-lg"
                onClick={solicitarOrcamentoCliente}
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>
                  calculate
                </span>
                <span>Solicitar Orçamento de Obra (Cliente)</span>
              </button>

              <button
                type="button"
                className="app-btn app-btn-outline app-btn-lg"
                onClick={goToLogin}
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>
                  badge
                </span>
                <span>Sou Eletricista</span>
              </button>
            </div>

            <div className="trust-metrics">
              <div className="trust-item">
                <span
                  className="material-icons trust-icon"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  rule
                </span>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>100% NBR 5410</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Normas da ABNT</p>
                </div>
              </div>

              <div className="trust-item">
                <span
                  className="material-icons trust-icon"
                  style={{ color: 'var(--status-success)' }}
                >
                  store
                </span>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Capital Elétrica</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Cotação Integrada
                  </p>
                </div>
              </div>

              <div className="trust-item">
                <span
                  className="material-icons trust-icon"
                  style={{ color: 'var(--status-info)' }}
                >
                  verified_user
                </span>
                <div>
                  <strong style={{ color: 'var(--text-main)' }}>Anti-Panelinha</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Oportunidade Justa
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-preview">
            <div className="app-mockup-panel">
              <div className="app-mockup-header">
                <div className="app-mockup-dots">
                  <span className="app-mockup-dot" />
                  <span className="app-mockup-dot" />
                  <span className="app-mockup-dot" />
                </div>
                <span className="app-badge app-badge-success">PROPOSTA CONFORME NBR 5410</span>
              </div>

              <div className="app-mockup-body">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '0.85rem'
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      Orçamento #MYGO-2026
                    </p>
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        marginTop: '2px'
                      }}
                    >
                      Residência Padrão - 120m²
                    </h3>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginTop: '2px'
                      }}
                    >
                      Plano Diretor Sul • Palmas / TO
                    </p>
                  </div>
                  <span className="app-badge app-badge-amber">Auditado</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '0.5rem',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Materiais Dimensionados (Extrato)
                  </p>
                  <div className="mockup-item-list">
                    <div className="mockup-item-row">
                      <span className="mockup-item-name">
                        Cabo Flexível 2,5mm² 750V (Tomadas/Iluminação)
                      </span>
                      <span className="mockup-item-val">100m</span>
                    </div>
                    <div className="mockup-item-row">
                      <span className="mockup-item-name">
                        Cabo Flexível 6,0mm² (Chuveiro Elétrico NBR)
                      </span>
                      <span className="mockup-item-val">30m</span>
                    </div>
                    <div className="mockup-item-row">
                      <span className="mockup-item-name">
                        Disjuntor Bipolar Termomagnético DIN 40A
                      </span>
                      <span className="mockup-item-val">1 un</span>
                    </div>
                    <div className="mockup-item-row">
                      <span className="mockup-item-name">
                        DPS Dispositivo Proteção Surtos 275V 20kA
                      </span>
                      <span className="mockup-item-val">2 un</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginBottom: '0.35rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Mão de Obra Especializada:
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>R$ 2.850,00</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Estimativa de Materiais:
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>R$ 1.620,00</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.5rem'
                    }}
                  >
                    <span style={{ color: 'var(--accent-primary)' }}>Total do Projeto:</span>
                    <span
                      style={{
                        color: 'var(--accent-primary)',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      R$ 4.470,00
                    </span>
                  </div>
                </div>

                <div className="mockup-partner-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className="material-icons"
                      style={{ fontSize: '18px', color: '#10b981' }}
                    >
                      shopping_cart
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                      Capital Elétrica Palmas
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: '3px'
                    }}
                  >
                    Lista pronta para transmissão direta ao WhatsApp de televendas da
                    distribuidora.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2rem auto' }}>
            <span className="app-badge app-badge-muted" style={{ marginBottom: '0.5rem' }}>
              DESENVOLVIDO PARA A CONSTRUÇÃO CIVIL
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Por que profissionais e clientes escolhem o MyGo?
            </h2>
          </div>

          <div className="app-grid-3">
            <div className="app-feature-box">
              <div className="app-feature-icon-wrapper amber">
                <span className="material-icons" style={{ fontSize: '22px' }}>
                  engineering
                </span>
              </div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.5rem'
                }}
              >
                Dimensionamento NBR 5410
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }}
              >
                Chega de chutar bitolas e disjuntores. O sistema calcula a seção adequada dos
                condutores, limites de queda de tensão e dispositivos de proteção.
              </p>
            </div>

            <div className="app-feature-box">
              <div className="app-feature-icon-wrapper green">
                <span className="material-icons" style={{ fontSize: '22px' }}>
                  storefront
                </span>
              </div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.5rem'
                }}
              >
                Cotação Direta Capital Elétrica
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }}
              >
                A lista levantada de cabos, conduítes e quadros é convertida em formato executivo e
                enviada com um toque direto para a equipe da Capital Elétrica em Palmas.
              </p>
            </div>

            <div className="app-feature-box">
              <div className="app-feature-icon-wrapper blue">
                <span className="material-icons" style={{ fontSize: '22px' }}>
                  handshake
                </span>
              </div>
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.5rem'
                }}
              >
                Matchmaking Anti-Panelinha
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }}
              >
                Clientes sem indicação prévia são direcionados para uma vitrine justa que destaca
                profissionais autônomos iniciantes com excelentes avaliações técnicas.
              </p>
            </div>
          </div>
        </div>

        <div className="cta-banner">
          <div>
            <h2
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '0.35rem'
              }}
            >
              Pronto para dimensionar sua instalação elétrica?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Leva menos de 3 minutos para receber a estimativa completa de mão de obra e materiais.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
            <button
              type="button"
              className="app-btn app-btn-primary app-btn-lg"
              onClick={solicitarOrcamentoCliente}
              style={{ flex: '1 1 220px' }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>
                play_arrow
              </span>
              <span>Iniciar Orçamento</span>
            </button>

            <Link
              to="/parceiros"
              className="app-btn app-btn-secondary app-btn-lg"
              style={{ flex: '1 1 220px' }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>
                person_search
              </span>
              <span>Ver Eletricistas</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div
          className="app-container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '1.25rem',
            paddingBottom: '1.25rem'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © 2026 MYGO Elétrica • Conforme Norma ABNT NBR 5410 • Palmas / TO
          </span>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}
            >
              Acesso Eletricista
            </Link>
            <Link
              to="/parceiros"
              style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}
            >
              Parceiros Oficiais
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
