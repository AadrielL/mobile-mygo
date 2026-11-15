import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../core/services/dashboardService';
import { materialService } from '../../core/services/materialService';
import { authService } from '../../core/services/authService';
import { apiService } from '../../core/services/apiService';
import { useDebounce } from '../../core/hooks/useDebounce';
import { SubmitButton } from '../../components/SubmitButton';
import { SkeletonList } from '../../components/Skeleton';

export const HistoricoPage: React.FC = () => {
  const [listaOrcamentos, setListaOrcamentos] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('USER');
  const [loading, setLoading] = useState<boolean>(true);
  const [verLixeira, setVerLixeira] = useState<boolean>(false);
  const [actionSubmittingId, setActionSubmittingId] = useState<string | null>(null);

  // Filtro com debounce de 400ms (Prompt 03) + Período (Semanal / Mensal / Todos)
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'TODOS' | 'SEMANAL' | 'MENSAL'>('TODOS');
  const [mostrarLogClientes, setMostrarLogClientes] = useState<boolean>(false);
  const termoDebounced = useDebounce(termoBusca, 400);

  // Modais
  const [mostrarModalMaterial, setMostrarModalMaterial] = useState<boolean>(false);
  const [detalheMaterial, setDetalheMaterial] = useState<any>(null);

  const [mostrarModalMaoDeObra, setMostrarModalMaoDeObra] = useState<boolean>(false);
  const [detalheOrcamento, setDetalheOrcamento] = useState<any>(null);
  const [dadosSnapshot, setDadosSnapshot] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    setUserRole((authService.getUserRole() || 'USER').toUpperCase());
    carregarProjetos(true, false);
  }, []);

  const carregarProjetos = async (force = false, lixeira = verLixeira) => {
    setLoading(true);
    try {
      const data = lixeira
        ? await dashboardService.getLixeira()
        : await dashboardService.getHistorico(force);

      const mapeados = (data || []).map((orc: any) => ({
        ...orc,
        id: orc.id || orc.orcamentoId,
        clienteNome: orc.clienteNome || orc.cliente_nome || 'Cliente sem nome',
        dataExibicao: orc.dataCriacao || orc.data_creacao,
        valorExibicao: orc.valorTotal || orc.valor_total || orc.valorEstimado || 0,
        status: orc.status || 'PENDENTE'
      }));
      setListaOrcamentos(mapeados);
    } catch {
      setListaOrcamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const alternarVisualizacao = () => {
    const proximo = !verLixeira;
    setVerLixeira(proximo);
    carregarProjetos(true, proximo);
  };

  const orcamentosFiltrados = useMemo(() => {
    const agora = new Date();
    return listaOrcamentos.filter((orc) => {
      const matchStatus = filtroStatus === 'TODOS' || orc.status === filtroStatus;
      const matchTexto =
        !termoDebounced.trim() ||
        String(orc.clienteNome).toLowerCase().includes(termoDebounced.toLowerCase()) ||
        String(orc.status).toLowerCase().includes(termoDebounced.toLowerCase());

      let matchPeriodo = true;
      if (filtroPeriodo !== 'TODOS' && orc.dataExibicao) {
        const dataOrc = new Date(orc.dataExibicao);
        if (!isNaN(dataOrc.getTime())) {
          const diffDias = (agora.getTime() - dataOrc.getTime()) / (1000 * 60 * 60 * 24);
          if (filtroPeriodo === 'SEMANAL') matchPeriodo = diffDias <= 7;
          if (filtroPeriodo === 'MENSAL') matchPeriodo = diffDias <= 30;
        }
      }

      return matchStatus && matchTexto && matchPeriodo;
    });
  }, [listaOrcamentos, filtroStatus, termoDebounced, filtroPeriodo]);

  // Log consolidado por cliente: quantos orçamentos enviados, quantos efetivados e valor convertido
  const resumoPorCliente = useMemo(() => {
    const mapa: Record<
      string,
      {
        cliente: string;
        enviados: number;
        efetivados: number;
        pendentes: number;
        valorEfetivado: number;
        ultimaData: any;
      }
    > = {};

    orcamentosFiltrados.forEach((orc) => {
      const chave = String(orc.clienteNome || 'Cliente sem nome').trim();
      if (!mapa[chave]) {
        mapa[chave] = {
          cliente: chave,
          enviados: 0,
          efetivados: 0,
          pendentes: 0,
          valorEfetivado: 0,
          ultimaData: orc.dataExibicao
        };
      }
      mapa[chave].enviados += 1;
      if (orc.status === 'ACEITO') {
        mapa[chave].efetivados += 1;
        mapa[chave].valorEfetivado += Number(orc.valorExibicao || 0);
      } else {
        mapa[chave].pendentes += 1;
      }
    });

    return Object.values(mapa).sort((a, b) => b.efetivados - a.efetivados || b.enviados - a.enviados);
  }, [orcamentosFiltrados]);

  const metricasPeriodo = useMemo(() => {
    const totalEnviados = orcamentosFiltrados.length;
    const totalEfetivados = orcamentosFiltrados.filter((o) => o.status === 'ACEITO').length;
    const valorTotalEfetivado = orcamentosFiltrados
      .filter((o) => o.status === 'ACEITO')
      .reduce((acc, o) => acc + Number(o.valorExibicao || 0), 0);
    return { totalEnviados, totalEfetivados, valorTotalEfetivado };
  }, [orcamentosFiltrados]);

  const confirmarRecusar = async (id: string) => {
    if (actionSubmittingId) return;
    if (
      !window.confirm(
        'Deseja enviar este orçamento para a lixeira? Ele será excluído permanentemente em 7 dias.'
      )
    ) {
      return;
    }
    setActionSubmittingId(id);
    try {
      await dashboardService.recusarOrcamento(id);
      await carregarProjetos(true, verLixeira);
    } catch {
      alert('Erro ao mover para a lixeira.');
    } finally {
      setActionSubmittingId(null);
    }
  };

  const restaurar = async (id: string) => {
    if (actionSubmittingId) return;
    setActionSubmittingId(id);
    try {
      await dashboardService.restaurarOrcamento(id);
      alert('Orçamento restaurado com sucesso!');
      await carregarProjetos(true, verLixeira);
    } catch {
      alert('Erro ao restaurar orçamento.');
    } finally {
      setActionSubmittingId(null);
    }
  };

  const alterarStatus = async (id: string, novoStatus: string) => {
    if (actionSubmittingId) return;
    setActionSubmittingId(id);
    try {
      await dashboardService.alterarStatus(id, novoStatus);
      await carregarProjetos(true, verLixeira);
    } catch {
      alert('Erro ao atualizar status.');
    } finally {
      setActionSubmittingId(null);
    }
  };

  const organizarMateriais = (materiais: any[]) => {
    const categorias: Record<string, any[]> = {
      'Fios e Cabos': [],
      Disjuntores: [],
      'Proteção e Outros': []
    };
    materiais.forEach((item) => {
      const desc = String(item.descricao || '').toLowerCase();
      if (desc.includes('cabo') || desc.includes('fio') || desc.includes('circuito')) {
        categorias['Fios e Cabos'].push(item);
      } else if (desc.includes('disjuntor')) {
        categorias['Disjuntores'].push(item);
      } else {
        categorias['Proteção e Outros'].push(item);
      }
    });
    return categorias;
  };

  const verDetalhesMateriais = async (orcamentoId: string) => {
    if (!orcamentoId || actionSubmittingId) return;
    setActionSubmittingId(orcamentoId);
    try {
      const res = await materialService.getDetalhesMaterial(orcamentoId);
      if (!res) {
        alert('Lista de materiais não encontrada.');
        return;
      }
      setDetalheMaterial({
        clienteNome: res.clienteNome,
        valorTotalEstimado: res.valorTotalEstimado || 0,
        avisoTecnico: res.avisoTecnico || '',
        dataGeracao: new Date(),
        itens: res.materiais || [],
        categorias: organizarMateriais(res.materiais || [])
      });
      setMostrarModalMaterial(true);
    } catch {
      alert('Este orçamento ainda não possui uma lista gerada.');
    } finally {
      setActionSubmittingId(null);
    }
  };

  const verDetalhesMaoDeObra = async (orcamentoId: string) => {
    if (!orcamentoId || actionSubmittingId) return;
    setActionSubmittingId(orcamentoId);
    try {
      const orc = await materialService.getOrcamentoPorId(orcamentoId);
      if (!orc) {
        alert('Orçamento não encontrado.');
        return;
      }
      setDetalheOrcamento(orc);
      if (orc.dadosTecnicosSnapshot) {
        try {
          setDadosSnapshot(
            typeof orc.dadosTecnicosSnapshot === 'string'
              ? JSON.parse(orc.dadosTecnicosSnapshot)
              : orc.dadosTecnicosSnapshot
          );
        } catch {
          setDadosSnapshot(null);
        }
      } else {
        setDadosSnapshot(null);
      }
      setMostrarModalMaoDeObra(true);
    } catch {
      alert('Não foi possível carregar os detalhes deste orçamento.');
    } finally {
      setActionSubmittingId(null);
    }
  };

  const formatarData = (data: any): string => {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d.getTime())) return String(data);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${min}`;
  };

  const formatarMoeda = (valor: any): string => {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const cotarCapitalEletrica = () => {
    if (!detalheMaterial) return;
    const msg = apiService.gerarMensagemCapitalEletrica(
      detalheMaterial.clienteNome || 'Cliente',
      detalheMaterial.itens || []
    );
    window.open(`https://wa.me/556333222120?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="app-card" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="app-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="material-icons"
              style={{ color: 'var(--accent-primary)', fontSize: '24px' }}
            >
              {verLixeira ? 'delete_sweep' : 'history'}
            </span>
            <h2 className="app-title" style={{ fontSize: '1.35rem' }}>
              {verLixeira
                ? 'Lixeira de Orçamentos'
                : userRole === 'ADMIN'
                  ? 'Gestão de Orçamentos'
                  : 'Meus Orçamentos'}
            </h2>
          </div>
          {verLixeira ? (
            <p className="app-subtitle text-danger" style={{ marginTop: '0.25rem' }}>
              Itens na lixeira são removidos permanentemente após 7 dias.
            </p>
          ) : (
            <p className="app-subtitle" style={{ marginTop: '0.25rem' }}>
              Histórico completo de propostas elétricas e relatórios técnicos.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className={`app-btn ${!verLixeira ? 'app-btn-danger' : 'app-btn-secondary'}`}
            onClick={alternarVisualizacao}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>
              {verLixeira ? 'arrow_back' : 'delete'}
            </span>
            <span>{verLixeira ? 'Voltar ao Histórico' : 'Ver Lixeira'}</span>
          </button>

          <button
            type="button"
            className="app-btn app-btn-ghost"
            onClick={() => navigate('/dashboard-main')}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>
              arrow_back
            </span>
            <span>Voltar</span>
          </button>
        </div>
      </div>

      {/* Painel de Log de Conversão (Semanal / Mensal) e Apontamento de Efetivação */}
      {!verLixeira && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span
                className="material-icons"
                style={{ color: 'var(--accent-primary)', fontSize: '18px' }}
              >
                insights
              </span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Log de Vendas & Efetivação por Cliente
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`app-btn app-btn-sm ${
                  filtroPeriodo === 'TODOS' ? 'app-btn-primary' : 'app-btn-secondary'
                }`}
                onClick={() => setFiltroPeriodo('TODOS')}
              >
                <span>Geral</span>
              </button>
              <button
                type="button"
                className={`app-btn app-btn-sm ${
                  filtroPeriodo === 'SEMANAL' ? 'app-btn-primary' : 'app-btn-secondary'
                }`}
                onClick={() => setFiltroPeriodo('SEMANAL')}
              >
                <span>Semanal (7d)</span>
              </button>
              <button
                type="button"
                className={`app-btn app-btn-sm ${
                  filtroPeriodo === 'MENSAL' ? 'app-btn-primary' : 'app-btn-secondary'
                }`}
                onClick={() => setFiltroPeriodo('MENSAL')}
              >
                <span>Mensal (30d)</span>
              </button>
              <button
                type="button"
                className={`app-btn app-btn-sm ${
                  mostrarLogClientes ? 'app-btn-success' : 'app-btn-outline'
                }`}
                onClick={() => setMostrarLogClientes((prev) => !prev)}
              >
                <span className="material-icons" style={{ fontSize: '15px' }}>
                  people_alt
                </span>
                <span>{mostrarLogClientes ? 'Ocultar Log por Cliente' : 'Ver Log por Cliente'}</span>
              </button>
            </div>
          </div>

          <div className="app-grid-3" style={{ gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>
                ORÇAMENTOS ENVIADOS ({filtroPeriodo})
              </small>
              <strong
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--text-main)',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {metricasPeriodo.totalEnviados}
              </strong>
            </div>

            <div
              style={{
                padding: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--status-success-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>
                COMPRAS EFETIVADAS (APROVADOS)
              </small>
              <strong
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--status-success)',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {metricasPeriodo.totalEfetivados}
              </strong>
            </div>

            <div
              style={{
                padding: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>
                VOLUME EFETIVADO NO PERÍODO
              </small>
              <strong
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--accent-primary)',
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                {formatarMoeda(metricasPeriodo.valorTotalEfetivado)}
              </strong>
            </div>
          </div>

          {mostrarLogClientes && (
            <div style={{ marginTop: '1rem' }}>
              <h4
                style={{
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  marginBottom: '0.6rem',
                  letterSpacing: '0.05em'
                }}
              >
                Histórico Consolidado por Cliente ({resumoPorCliente.length})
              </h4>
              <div className="mobile-only-cards" style={{ display: 'flex' }}>
                {resumoPorCliente.map((cli) => (
                  <div key={cli.cliente} className="mobile-stack-card">
                    <div className="mobile-stack-row">
                      <strong className="break-words" style={{ color: 'var(--text-main)' }}>
                        {cli.cliente}
                      </strong>
                      <span
                        className={`app-badge ${
                          cli.efetivados > 0 ? 'app-badge-success' : 'app-badge-amber'
                        }`}
                      >
                        {cli.efetivados > 0
                          ? `✓ ${cli.efetivados} Efetivada(s)`
                          : 'Aguardando Efetivação'}
                      </span>
                    </div>
                    <div className="mobile-stack-row" style={{ fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Orçamentos enviados: <strong>{cli.enviados}</strong> | Pendentes:{' '}
                        <strong>{cli.pendentes}</strong>
                      </span>
                      <strong
                        style={{
                          color: 'var(--status-success)',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        Total Fechado: {formatarMoeda(cli.valorEfetivado)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra de Busca e Filtro com Debounce de 400ms (Prompt 03) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}
      >
        <input
          type="search"
          className="app-input"
          placeholder="Buscar por nome do cliente ou projeto..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
        <select
          className="app-select"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="TODOS">Todos os Status (Efetivados + Pendentes)</option>
          <option value="PENDENTE">Apenas Não Efetivados (Pendentes)</option>
          <option value="ACEITO">Apenas Efetivados (Aceitos / Comprados)</option>
        </select>
      </div>

      {loading ? (
        <SkeletonList rows={4} height="96px" />
      ) : (
        <>
          {/* DESKTOP (>= 768px): Layout Tabular */}
          <div className="app-table-container desktop-only-table">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Cliente / Projeto</th>
                  <th style={{ textAlign: 'center' }}>Data</th>
                  <th style={{ textAlign: 'center' }}>Valor Estimado</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosFiltrados.map((orc) => {
                  const busy = actionSubmittingId === orc.id;
                  return (
                    <tr key={orc.id}>
                      <td>
                        <strong className="break-words" style={{ color: 'var(--text-main)' }}>
                          {orc.clienteNome}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        {formatarData(orc.dataExibicao)}
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        {formatarMoeda(orc.valorExibicao)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`app-badge ${
                            orc.status === 'ACEITO' ? 'app-badge-success' : 'app-badge-amber'
                          }`}
                        >
                          {orc.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '0.5rem',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}
                        >
                          {!verLixeira ? (
                            <>
                              <SubmitButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                isSubmitting={busy}
                                loadingText="Abrindo..."
                                onClick={() => verDetalhesMaoDeObra(orc.id)}
                              >
                                <span
                                  className="material-icons"
                                  style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
                                >
                                  calculate
                                </span>
                                <span>Mão de Obra</span>
                              </SubmitButton>

                              <SubmitButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                isSubmitting={busy}
                                loadingText="Abrindo..."
                                onClick={() => verDetalhesMateriais(orc.id)}
                              >
                                <span className="material-icons" style={{ fontSize: '15px' }}>
                                  inventory_2
                                </span>
                                <span>Materiais</span>
                              </SubmitButton>

                              {userRole === 'ADMIN' && (
                                <>
                                  <button
                                    type="button"
                                    className="app-btn app-btn-primary app-btn-sm"
                                    onClick={() => navigate(`/levantamento?orcamentoId=${orc.id}`)}
                                  >
                                    <span>Lista Técnica</span>
                                  </button>
                                  <SubmitButton
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    isSubmitting={busy}
                                    loadingText="..."
                                    className="text-success"
                                    onClick={() => alterarStatus(orc.id, 'ACEITO')}
                                    title="Aceitar / Aprovar Proposta"
                                  >
                                    <span className="material-icons" style={{ fontSize: '15px' }}>
                                      check
                                    </span>
                                  </SubmitButton>
                                  <SubmitButton
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    isSubmitting={busy}
                                    loadingText="..."
                                    onClick={() => confirmarRecusar(orc.id)}
                                    title="Mover para lixeira"
                                  >
                                    <span className="material-icons" style={{ fontSize: '15px' }}>
                                      delete
                                    </span>
                                  </SubmitButton>
                                </>
                              )}
                            </>
                          ) : (
                            <SubmitButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              isSubmitting={busy}
                              loadingText="Restaurando..."
                              className="text-success"
                              onClick={() => restaurar(orc.id)}
                            >
                              <span className="material-icons" style={{ fontSize: '15px' }}>
                                restore
                              </span>
                              <span>Restaurar</span>
                            </SubmitButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {orcamentosFiltrados.length === 0 && (
              <div
                style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    fontSize: '40px',
                    color: 'var(--text-disabled)',
                    marginBottom: '0.5rem'
                  }}
                >
                  inbox
                </span>
                <p>
                  {verLixeira
                    ? 'A lixeira está vazia.'
                    : 'Nenhum orçamento encontrado no histórico.'}
                </p>
              </div>
            )}
          </div>

          {/* MOBILE (< 768px): Cartões Verticais Empilhados (Prompt 01) */}
          <div className="mobile-only-cards">
            {orcamentosFiltrados.map((orc) => {
              const busy = actionSubmittingId === orc.id;
              return (
                <div key={orc.id} className="mobile-stack-card">
                  <div className="mobile-stack-row">
                    <div>
                      <strong
                        className="break-words"
                        style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}
                      >
                        {orc.clienteNome}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatarData(orc.dataExibicao)}
                      </span>
                    </div>
                    <span
                      className={`app-badge ${
                        orc.status === 'ACEITO' ? 'app-badge-success' : 'app-badge-amber'
                      }`}
                    >
                      {orc.status}
                    </span>
                  </div>

                  <div
                    className="mobile-stack-row"
                    style={{
                      padding: '0.5rem 0',
                      borderTop: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      alignItems: 'baseline'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      Valor Estimado
                    </span>
                    <strong
                      style={{
                        fontSize: '1.15rem',
                        color: 'var(--accent-primary)',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      {formatarMoeda(orc.valorExibicao)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {!verLixeira ? (
                      <>
                        <SubmitButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          isSubmitting={busy}
                          loadingText="Abrindo..."
                          onClick={() => verDetalhesMaoDeObra(orc.id)}
                          style={{ flex: '1 1 130px' }}
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
                          >
                            calculate
                          </span>
                          <span>Mão de Obra</span>
                        </SubmitButton>

                        <SubmitButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          isSubmitting={busy}
                          loadingText="Abrindo..."
                          onClick={() => verDetalhesMateriais(orc.id)}
                          style={{ flex: '1 1 130px' }}
                        >
                          <span className="material-icons" style={{ fontSize: '15px' }}>
                            inventory_2
                          </span>
                          <span>Materiais</span>
                        </SubmitButton>

                        <SubmitButton
                          type="button"
                          variant={orc.status === 'ACEITO' ? 'secondary' : 'primary'}
                          size="sm"
                          isSubmitting={busy}
                          loadingText="Apontando..."
                          onClick={() =>
                            alterarStatus(orc.id, orc.status === 'ACEITO' ? 'PENDENTE' : 'ACEITO')
                          }
                          style={{ flex: '1 1 100%' }}
                        >
                          <span className="material-icons" style={{ fontSize: '16px' }}>
                            {orc.status === 'ACEITO' ? 'verified' : 'check_circle_outline'}
                          </span>
                          <span>
                            {orc.status === 'ACEITO'
                              ? 'Compra Efetivada (Marcar Pendente)'
                              : 'Apontar como Efetivado (Venda Fechada)'}
                          </span>
                        </SubmitButton>

                        {userRole === 'ADMIN' && (
                          <>
                            <button
                              type="button"
                              className="app-btn app-btn-secondary app-btn-sm"
                              onClick={() => navigate(`/levantamento?orcamentoId=${orc.id}`)}
                              style={{ flex: '1 1 130px' }}
                            >
                              <span>Lista Técnica</span>
                            </button>
                            <SubmitButton
                              type="button"
                              variant="danger"
                              size="sm"
                              isSubmitting={busy}
                              loadingText="..."
                              onClick={() => confirmarRecusar(orc.id)}
                            >
                              <span className="material-icons" style={{ fontSize: '15px' }}>
                                delete
                              </span>
                            </SubmitButton>
                          </>
                        )}
                      </>
                    ) : (
                      <SubmitButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        isSubmitting={busy}
                        loadingText="Restaurando..."
                        className="text-success"
                        onClick={() => restaurar(orc.id)}
                        style={{ width: '100%' }}
                      >
                        <span className="material-icons" style={{ fontSize: '15px' }}>
                          restore
                        </span>
                        <span>Restaurar</span>
                      </SubmitButton>
                    )}
                  </div>
                </div>
              );
            })}

            {orcamentosFiltrados.length === 0 && (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    fontSize: '36px',
                    color: 'var(--text-disabled)',
                    marginBottom: '0.5rem'
                  }}
                >
                  inbox
                </span>
                <p>{verLixeira ? 'A lixeira está vazia.' : 'Nenhum orçamento encontrado.'}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DE MATERIAIS */}
      {mostrarModalMaterial && detalheMaterial && (
        <div className="app-modal-overlay" onClick={() => setMostrarModalMaterial(false)}>
          <div
            className="app-modal"
            style={{ maxWidth: '850px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-icons" style={{ color: 'var(--accent-primary)' }}>
                  description
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Relatório de Materiais (NBR 5410)
                </h3>
              </div>
              <button
                type="button"
                className="btn-close-custom"
                onClick={() => setMostrarModalMaterial(false)}
              >
                &times;
              </button>
            </div>

            <div className="app-modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div className="break-words">
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Levantamento Técnico
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    <strong>Cliente:</strong> {detalheMaterial.clienteNome}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Data: {formatarData(detalheMaterial.dataGeracao)}
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase'
                    }}
                  >
                    Valor Estimado
                  </span>
                  <h3
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'var(--status-success)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    R$ {detalheMaterial.valorTotalEstimado}
                  </h3>
                </div>
              </div>

              {Object.entries(detalheMaterial.categorias || {}).map(([catName, items]: any) => {
                if (!items || items.length === 0) return null;
                return (
                  <div key={catName} style={{ marginBottom: '1.25rem' }}>
                    <h5
                      style={{
                        color: 'var(--accent-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '16px' }}>
                        label_important
                      </span>
                      {catName}
                    </h5>

                    <div className="desktop-only-table">
                      <table className="app-table">
                        <thead>
                          <tr>
                            <th>Descrição do Item</th>
                            <th style={{ textAlign: 'center' }}>Qtd</th>
                            <th style={{ textAlign: 'center' }}>Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="break-words">{item.descricao}</td>
                              <td
                                style={{
                                  textAlign: 'center',
                                  fontWeight: 700,
                                  color: 'var(--text-main)'
                                }}
                              >
                                {item.quantidade}
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                {item.unidade}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mobile-only-cards">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="mobile-stack-card">
                          <strong className="break-words" style={{ color: 'var(--text-main)' }}>
                            {item.descricao}
                          </strong>
                          <div className="mobile-stack-row">
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              Quantidade:
                            </span>
                            <span className="app-badge app-badge-amber">
                              {item.quantidade} {item.unidade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {detalheMaterial.avisoTecnico && (
                <div
                  className="break-words"
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'var(--accent-muted)',
                    borderLeft: '3px solid var(--accent-primary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      fontSize: '0.85rem',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Notas Técnicas NBR 5410:
                  </p>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {detalheMaterial.avisoTecnico}
                  </small>
                </div>
              )}
            </div>

            <div className="app-modal-footer">
              <button
                type="button"
                className="app-btn app-btn-success"
                onClick={cotarCapitalEletrica}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  storefront
                </span>
                <span>Cotar na Capital Elétrica</span>
              </button>
              <button
                type="button"
                className="app-btn app-btn-primary"
                onClick={() => window.print()}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  print
                </span>
                <span>Imprimir / PDF</span>
              </button>
              <button
                type="button"
                className="app-btn app-btn-secondary"
                onClick={() => setMostrarModalMaterial(false)}
              >
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE MÃO DE OBRA */}
      {mostrarModalMaoDeObra && detalheOrcamento && (
        <div className="app-modal-overlay" onClick={() => setMostrarModalMaoDeObra(false)}>
          <div
            className="app-modal"
            style={{ maxWidth: '750px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-icons" style={{ color: 'var(--accent-primary)' }}>
                  calculate
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Detalhamento de Mão de Obra
                </h3>
              </div>
              <button
                type="button"
                className="btn-close-custom"
                onClick={() => setMostrarModalMaoDeObra(false)}
              >
                &times;
              </button>
            </div>

            <div className="app-modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div className="break-words">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {detalheOrcamento.clienteNome}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Data: {formatarData(detalheOrcamento.dataCriacao)} | Status:{' '}
                    <span className="app-badge app-badge-amber">{detalheOrcamento.status}</span>
                  </p>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase'
                    }}
                  >
                    Valor Total
                  </span>
                  <h3
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    {formatarMoeda(detalheOrcamento.valorTotal)}
                  </h3>
                </div>
              </div>

              {dadosSnapshot && (
                <div>
                  <h5
                    style={{
                      color: 'var(--accent-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      marginBottom: '0.75rem'
                    }}
                  >
                    Especificações da Obra
                  </h5>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                        Área Total
                      </small>
                      <strong>{dadosSnapshot.metragemM2} m²</strong>
                    </div>
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                        Complexidade
                      </small>
                      <strong>{dadosSnapshot.complexidade || 'Padrão'}</strong>
                    </div>
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                        Infraestrutura
                      </small>
                      <strong>{dadosSnapshot.comInfra ? 'Completa' : 'Apenas Fiação'}</strong>
                    </div>
                    <div
                      style={{
                        padding: '0.75rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                        Pontos Elétricos
                      </small>
                      <strong>{dadosSnapshot.qtdPontosEletrica || 0} pontos</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="app-modal-footer">
              <button
                type="button"
                className="app-btn app-btn-secondary"
                onClick={() => setMostrarModalMaoDeObra(false)}
              >
                <span>Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
