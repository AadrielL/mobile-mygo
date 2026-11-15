import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../core/services/dashboardService';
import { SkeletonList } from '../../components/Skeleton';

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [totalOrcamentos, setTotalOrcamentos] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [taxaConversao, setTaxaConversao] = useState(0);
  const [statusMap, setStatusMap] = useState<Record<string, number>>({});
  const [mediasMensais, setMediasMensais] = useState<{ mes: string; media: number }[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async (force = false) => {
    setLoading(true);
    try {
      const [stats, dados] = await Promise.all([
        dashboardService.getStats(force).catch(() => null),
        dashboardService.getHistorico(force).catch(() => [])
      ]);

      if (stats) {
        setTaxaConversao(stats.taxaConversao || 0);
      }

      if (dados && dados.length > 0) {
        const total = dados.length;
        setTotalOrcamentos(total);

        const sMap: Record<string, number> = {};
        const mensal: Record<string, { soma: number; qtd: number }> = {};
        let somaTotal = 0;

        dados.forEach((orc: any) => {
          const status = orc.status || 'PENDENTE';
          const valor = Number(orc.valorTotal || orc.valor_total || orc.valorEstimado || 0);
          const dataRaw = orc.dataCriacao || orc.data_creacao;

          sMap[status] = (sMap[status] || 0) + 1;
          somaTotal += valor;

          if (dataRaw) {
            const d = new Date(dataRaw);
            if (!isNaN(d.getTime())) {
              const chaveMes = `${d.getMonth() + 1}/${d.getFullYear()}`;
              if (!mensal[chaveMes]) mensal[chaveMes] = { soma: 0, qtd: 0 };
              mensal[chaveMes].soma += valor;
              mensal[chaveMes].qtd += 1;
            }
          }
        });

        setTicketMedio(somaTotal / (total || 1));
        setStatusMap(sMap);
        setMediasMensais(
          Object.entries(mensal).map(([mes, val]) => ({
            mes,
            media: val.soma / (val.qtd || 1)
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const maxMedia = Math.max(...mediasMensais.map((m) => m.media), 1);

  return (
    <div className="dashboard-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 className="app-title" style={{ fontSize: '1.45rem' }}>
            Relatórios de Gestão
          </h2>
          <p className="app-subtitle">
            Análise consolidada de volume, conversão e métricas de desempenho.
          </p>
        </div>
        <button
          type="button"
          className="app-btn app-btn-secondary"
          onClick={() => carregarDados(true)}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            refresh
          </span>
          <span>Atualizar Dados</span>
        </button>
      </div>

      {loading ? (
        <SkeletonList rows={3} height="110px" />
      ) : (
        <>
          <div className="app-grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="app-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-info)',
                  flexShrink: 0
                }}
              >
                <span className="material-icons">assessment</span>
              </div>
              <div>
                <span className="app-label" style={{ marginBottom: 0 }}>
                  Total de Orçamentos
                </span>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {totalOrcamentos}
                </div>
              </div>
            </div>

            <div className="app-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-success)',
                  flexShrink: 0
                }}
              >
                <span className="material-icons">payments</span>
              </div>
              <div>
                <span className="app-label" style={{ marginBottom: 0 }}>
                  Ticket Médio
                </span>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'var(--status-success)',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="app-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-muted)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0
                }}
              >
                <span className="material-icons">trending_up</span>
              </div>
              <div>
                <span className="app-label" style={{ marginBottom: 0 }}>
                  Taxa de Conversão
                </span>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {Number(taxaConversao).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="app-grid-2">
            {/* Distribuição por Status (CSS Leve sem dependências pesadas) */}
            <div className="app-card">
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: '18px', color: 'var(--accent-primary)' }}
                >
                  pie_chart
                </span>
                Distribuição por Status
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(statusMap).map(([status, count]) => {
                  const pct = totalOrcamentos > 0 ? Math.round((count / totalOrcamentos) * 100) : 0;
                  return (
                    <div key={status}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          marginBottom: '0.3rem'
                        }}
                      >
                        <strong style={{ color: 'var(--text-main)' }}>{status}</strong>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: '10px',
                          background: 'var(--bg-surface)',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background:
                              status === 'ACEITO'
                                ? 'var(--status-success)'
                                : 'var(--accent-primary)',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(statusMap).length === 0 && (
                  <p style={{ color: 'var(--text-muted)' }}>Sem dados suficientes.</p>
                )}
              </div>
            </div>

            {/* Média de Valor Mensal */}
            <div className="app-card">
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: '18px', color: 'var(--status-info)' }}
                >
                  bar_chart
                </span>
                Média de Valor Mensal
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {mediasMensais.map((item) => {
                  const pct = Math.round((item.media / maxMedia) * 100);
                  return (
                    <div key={item.mes}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem',
                          marginBottom: '0.3rem'
                        }}
                      >
                        <strong style={{ color: 'var(--text-main)' }}>{item.mes}</strong>
                        <span
                          style={{
                            color: 'var(--status-info)',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700
                          }}
                        >
                          R$ {item.media.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div
                        style={{
                          height: '10px',
                          background: 'var(--bg-surface)',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--status-info)',
                            borderRadius: '9999px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {mediasMensais.length === 0 && (
                  <p style={{ color: 'var(--text-muted)' }}>Sem registros mensais.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
