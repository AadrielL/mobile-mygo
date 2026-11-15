import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { materialService } from '../../core/services/materialService';
import { SubmitButton } from '../../components/SubmitButton';
import { SkeletonList } from '../../components/Skeleton';

export const PropostaClientePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [orcamento, setOrcamento] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [mensagemFeedback, setMensagemFeedback] = useState<string>('');

  useEffect(() => {
    if (id) {
      carregarProposta(id);
    }
  }, [id]);

  const carregarProposta = async (orcamentoId: string) => {
    setLoading(true);
    setErro('');
    try {
      const res = await materialService.getOrcamentoPublico(orcamentoId);
      setOrcamento(res);
      if (res?.dadosTecnicosSnapshot) {
        try {
          setSnapshot(
            typeof res.dadosTecnicosSnapshot === 'string'
              ? JSON.parse(res.dadosTecnicosSnapshot)
              : res.dadosTecnicosSnapshot
          );
        } catch {
          setSnapshot(null);
        }
      }
    } catch {
      setErro('Não foi possível localizar esta proposta ou ela foi removida.');
    } finally {
      setLoading(false);
    }
  };

  const responderProposta = async (aceitar: boolean) => {
    if (!id || isSubmitting) return;
    setIsSubmitting(true);
    setMensagemFeedback('');
    try {
      const atualizado = await materialService.responderPropostaPublica(id, aceitar);
      setOrcamento(atualizado);
      setMensagemFeedback(
        aceitar
          ? '✅ Proposta APROVADA com sucesso! Data e hora do aceite foram registradas no sistema.'
          : 'Proposta marcada como recusada.'
      );
    } catch {
      alert('Não foi possível registrar sua resposta agora. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatarMoeda = (val: any): string =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatarDataHora = (data: any): string => {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d.getTime())) return String(data);
    return d.toLocaleString('pt-BR');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        padding: '1.25rem 0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ width: '100%', maxWidth: '580px' }}>
        {loading ? (
          <SkeletonList rows={3} height="120px" />
        ) : erro ? (
          <div className="app-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <span
              className="material-icons"
              style={{ fontSize: '42px', color: 'var(--status-danger)', marginBottom: '0.5rem' }}
            >
              error_outline
            </span>
            <h2 className="app-title">Proposta Indisponível</h2>
            <p className="app-subtitle">{erro}</p>
          </div>
        ) : (
          <div className="app-card">
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <span className="app-badge app-badge-amber" style={{ marginBottom: '0.5rem' }}>
                ⚡ PROPOSTA TÉCNICA DIGITAL — NBR 5410
              </span>
              <h1 className="app-title" style={{ fontSize: '1.35rem' }}>
                Orçamento para {orcamento?.clienteNome || 'Cliente'}
              </h1>
              <p className="app-subtitle">
                Profissional Responsável:{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {orcamento?.tenantId || 'Eletricista Parceiro MyGo'}
                </strong>
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.15rem',
                textAlign: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <span className="app-label">Valor Total da Proposta (Mão de Obra & Execução)</span>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  margin: '0.25rem 0'
                }}
              >
                {formatarMoeda(orcamento?.valorTotal)}
              </div>
              <span
                className={`app-badge ${
                  orcamento?.status === 'ACEITO'
                    ? 'app-badge-success'
                    : orcamento?.status === 'RECUSADO'
                      ? 'app-badge-danger'
                      : 'app-badge-amber'
                }`}
              >
                STATUS ATUAL: {orcamento?.status || 'PENDENTE'}
              </span>
              {orcamento?.dataAceite && (
                <p style={{ fontSize: '0.75rem', color: 'var(--status-success)', marginTop: '0.4rem' }}>
                  Aceite registrado em: {formatarDataHora(orcamento.dataAceite)}
                </p>
              )}
            </div>

            {snapshot && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h3
                  style={{
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '0.65rem'
                  }}
                >
                  Resumo Técnico do Escopo
                </h3>
                <div className="app-grid-2" style={{ gap: '0.65rem' }}>
                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>Área</small>
                    <strong>{snapshot.metragemM2 || 0} m²</strong>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>Padrão</small>
                    <strong>{snapshot.complexidade || 'Residencial'}</strong>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                      Infraestrutura
                    </small>
                    <strong>{snapshot.comInfra ? 'Completa' : 'Apenas Fiação'}</strong>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                      Pontos Elétricos
                    </small>
                    <strong>{snapshot.qtdPontosEletrica || 0} pontos</strong>
                  </div>
                </div>
              </div>
            )}

            {mensagemFeedback && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-success-bg)',
                  border: '1px solid var(--status-success-border)',
                  color: 'var(--status-success)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}
              >
                {mensagemFeedback}
              </div>
            )}

            {orcamento?.status !== 'ACEITO' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <SubmitButton
                  type="button"
                  variant="primary"
                  isSubmitting={isSubmitting}
                  loadingText="Registrando Aceite..."
                  icon="check_circle"
                  onClick={() => responderProposta(true)}
                  style={{ width: '100%' }}
                >
                  <span>Aprovar Orçamento com 1 Clique</span>
                </SubmitButton>

                <SubmitButton
                  type="button"
                  variant="danger"
                  isSubmitting={isSubmitting}
                  loadingText="Processando..."
                  icon="cancel"
                  onClick={() => responderProposta(false)}
                  style={{ width: '100%' }}
                >
                  <span>Recusar Proposta</span>
                </SubmitButton>
              </div>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--status-success-bg)',
                  border: '1px solid var(--status-success-border)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--status-success)',
                  fontWeight: 700
                }}
              >
                ✓ Esta proposta já foi aprovada digitalmente!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
