import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../core/services/authService';
import { dashboardService } from '../../core/services/dashboardService';
import { SkeletonList } from '../../components/Skeleton';
import './MainViewPage.css';

export const MainViewPage: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('USER');
  const [userName, setUserName] = useState<string>('Usuário');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [aceitosCount, setAceitosCount] = useState<number>(0);
  const [pendentesCount, setPendentesCount] = useState<number>(0);
  const [ultimosOrcamentos, setUltimosOrcamentos] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    setUserRole((authService.getUserRole() || 'USER').toUpperCase());
    setUserName(authService.getUserName() || 'Usuário');

    carregarMetricas();
    carregarUltimos();
  }, []);

  const carregarMetricas = async () => {
    setLoadingStats(true);
    try {
      const res = await dashboardService.getStats();
      setStats(res);
      if (res && res.statusCount) {
        setAceitosCount(res.statusCount['ACEITO'] || res.statusCount['FINALIZADO'] || 0);
        setPendentesCount(res.statusCount['PENDENTE'] || res.statusCount['EM_ANALISE'] || 0);
      }
    } catch {
      // silencioso
    } finally {
      setLoadingStats(false);
    }
  };

  const carregarUltimos = async () => {
    try {
      const dados = await dashboardService.getHistorico();
      if (dados && dados.length > 0) {
        setUltimosOrcamentos(
          dados.slice(0, 4).map((orc) => ({
            id: orc.id || orc.orcamentoId,
            clienteNome: orc.clienteNome || orc.cliente_nome || 'Cliente',
            valorTotal: orc.valorTotal || orc.valor_total || orc.valorEstimado || 0,
            status: orc.status || 'PENDENTE',
            data: orc.dataCriacao || orc.data_creacao
          }))
        );
      }
    } catch {
      // silencioso
    }
  };

  const formatarMoeda = (valor: any): string => {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="dashboard-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.2rem'
            }}
          >
            <h1 className="app-title" style={{ margin: 0 }}>
              Painel de Engenharia
            </h1>
            <span className="app-badge app-badge-muted" style={{ fontSize: '0.65rem' }}>
              v2.6 React
            </span>
          </div>
          <p className="app-subtitle break-words" style={{ margin: 0 }}>
            Operador conectado: <strong style={{ color: 'var(--text-main)' }}>{userName}</strong> —
            Cálculos elétricos NBR 5410.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--status-success)'
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            APIs CONECTADAS
          </span>
        </div>
      </div>

      {loadingStats ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <SkeletonList rows={1} height="90px" />
        </div>
      ) : (
        <div
          className="app-card"
          style={{ padding: 0, marginBottom: '1.75rem', overflow: 'hidden' }}
        >
          <div className="metrics-strip-grid">
            <div className="metric-item">
              <span className="metric-label">Volume de Orçamentos</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span className="metric-value">{stats?.totalOrcamentos || 0}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>projetos</span>
              </div>
            </div>

            <div className="metric-item">
              <span className="metric-label">Taxa de Conversão</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span
                  className="metric-value"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {Number(stats?.taxaConversao || 0).toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>fechadas</span>
              </div>
            </div>

            <div className="metric-item">
              <span className="metric-label">Propostas Aprovadas</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span
                  className="metric-value"
                  style={{ color: 'var(--status-success)' }}
                >
                  {aceitosCount}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  / {pendentesCount} pendentes
                </span>
              </div>
            </div>

            <div className="metric-item" style={{ borderRight: 'none' }}>
              <span className="metric-label">Limite Diário (Hoje)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span className="metric-value">
                  {stats?.budgetsToday || 0}/{stats?.dailyLimit || 15}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {stats?.planType || 'FREE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}
        >
          <span className="app-section-title">
            <span
              className="material-icons"
              style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
            >
              handyman
            </span>
            Ferramentas Operacionais
          </span>
        </div>

        <div className="tools-grid">
          <div
            className="app-card app-card-interactive"
            onClick={() => navigate('/quiz')}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  Gerador de Orçamento
                </span>
                <span className="app-badge app-badge-amber">Quiz NBR 5410</span>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  lineHeight: 1.4
                }}
              >
                Cálculo automatizado de mão de obra com parâmetros de área, infraestrutura e
                equipamentos.
              </p>
            </div>
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Calcular proposta
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)'
                }}
              >
                Iniciar →
              </span>
            </div>
          </div>

          <div
            className="app-card app-card-interactive"
            onClick={() => navigate('/levantamento')}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  Levantamento de Materiais
                </span>
                <span className="app-badge app-badge-success">Cabos & Proteções</span>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  lineHeight: 1.4
                }}
              >
                Dimensionamento por cômodo de condutores, disjuntores e dispositivos conforme a
                norma.
              </p>
            </div>
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Dimensionar lista
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--status-success)'
                }}
              >
                Acessar →
              </span>
            </div>
          </div>

          <div
            className="app-card app-card-interactive"
            onClick={() => navigate('/historico')}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  Histórico & Propostas
                </span>
                <span className="app-badge app-badge-muted">Registros</span>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  lineHeight: 1.4
                }}
              >
                Consulta de orçamentos, aprovações, detalhamento de mão de obra e exportação em PDF.
              </p>
            </div>
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Gerenciar propostas
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Consultar →
              </span>
            </div>
          </div>

          {userRole === 'ADMIN' && (
            <div
              className="app-card app-card-interactive"
              onClick={() => navigate('/reports')}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span
                    style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}
                  >
                    Relatórios de Gestão
                  </span>
                  <span className="app-badge app-badge-muted">Admin</span>
                </div>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    lineHeight: 1.4
                  }}
                >
                  Análise consolidada de faturamento, volume mensal e métricas de desempenho.
                </p>
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Métricas executivas
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Ver Relatórios →
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {ultimosOrcamentos.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}
          >
            <span className="app-section-title">
              <span
                className="material-icons"
                style={{ fontSize: '15px', color: 'var(--text-muted)' }}
              >
                schedule
              </span>
              Propostas Recentes
            </span>
            <button
              type="button"
              className="app-btn app-btn-ghost app-btn-sm"
              onClick={() => navigate('/historico')}
            >
              Ver todas ({stats?.totalOrcamentos || ultimosOrcamentos.length}) →
            </button>
          </div>

          {/* DESKTOP (>= 768px): Tabela tradicional */}
          <div className="app-table-container desktop-only-table">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Cliente / Projeto</th>
                  <th style={{ textAlign: 'center' }}>Data</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {ultimosOrcamentos.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/historico')}
                  >
                    <td>
                      <strong
                        className="break-words"
                        style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}
                      >
                        {item.clienteNome}
                      </strong>
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem'
                      }}
                    >
                      {item.data}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`app-badge ${
                          item.status === 'ACEITO' ? 'app-badge-success' : 'app-badge-amber'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      {formatarMoeda(item.valorTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE (< 768px): Cartões Verticais Empilhados (Prompt 01) */}
          <div className="mobile-only-cards">
            {ultimosOrcamentos.map((item, idx) => (
              <div
                key={item.id || idx}
                className="mobile-stack-card"
                onClick={() => navigate('/historico')}
                style={{ cursor: 'pointer' }}
              >
                <div className="mobile-stack-row">
                  <strong
                    className="break-words"
                    style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}
                  >
                    {item.clienteNome}
                  </strong>
                  <span
                    className={`app-badge ${
                      item.status === 'ACEITO' ? 'app-badge-success' : 'app-badge-amber'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mobile-stack-row" style={{ alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.data}
                  </span>
                  <strong
                    style={{
                      fontSize: '1rem',
                      color: 'var(--accent-primary)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    {formatarMoeda(item.valorTotal)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
