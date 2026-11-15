import React, { useEffect, useState } from 'react';
import { apiService } from '../../core/services/apiService';
import { SubmitButton } from '../../components/SubmitButton';
import { SkeletonList } from '../../components/Skeleton';

export const ConfigPrecosPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isAddingExtra, setIsAddingExtra] = useState(false);

  const [config, setConfig] = useState<any>({
    valorM2ComInfra: 0,
    valorM2SemInfra: 0,
    precoMotor: 0,
    precoCamera: 0,
    precoCerca: 0,
    valorDiaria: 0,
    valorPontoExtra: 0,
    areaBase: 100,
    pontosBase: 30
  });

  const [servicosExtras, setServicosExtras] = useState<any[]>([]);
  const [novoServico, setNovoServico] = useState({ nome: '', valor: 0, ativo: true });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [cfg, extras] = await Promise.all([
        apiService.getConfig().catch(() => null),
        apiService.listarServicosExtras().catch(() => [])
      ]);
      if (cfg) setConfig(cfg);
      setServicosExtras(extras || []);
    } finally {
      setIsLoading(false);
    }
  };

  const salvarConfigGeral = async () => {
    if (isSavingConfig) return;
    setIsSavingConfig(true);
    try {
      const payload = {
        ...config,
        areaBase: config.areaBase || 100,
        pontosBase: config.pontosBase || 30
      };
      await apiService.updatePrecos(payload);
      alert('Configurações atualizadas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err?.message || 'Verifique a API 8081.'));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const adicionarExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingExtra || !novoServico.nome.trim() || novoServico.valor <= 0) return;

    setIsAddingExtra(true);
    try {
      await apiService.adicionarServicoExtra(novoServico);
      setNovoServico({ nome: '', valor: 0, ativo: true });
      await carregarDados();
    } catch {
      alert('Erro ao adicionar serviço extra.');
    } finally {
      setIsAddingExtra(false);
    }
  };

  const excluirExtra = async (id: number) => {
    if (!window.confirm('Deseja remover este serviço extra?')) return;
    try {
      await apiService.deletarServicoExtra(id);
      await carregarDados();
    } catch {
      alert('Erro ao excluir serviço extra.');
    }
  };

  const formatarMoeda = (valor: any): string =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem'
            }}
          >
            <span
              className="material-icons"
              style={{ fontSize: '20px', color: 'var(--accent-primary)' }}
            >
              tune
            </span>
            <h1 className="app-title" style={{ margin: 0 }}>
              Configuração de Preços
            </h1>
            <span className="app-badge app-badge-amber">Tabela Base</span>
          </div>
          <p className="app-subtitle" style={{ margin: 0 }}>
            Defina os valores de referência da mão de obra, instalações de segurança e serviços
            extras.
          </p>
        </div>

        <SubmitButton
          type="button"
          isSubmitting={isSavingConfig}
          loadingText="Salvando..."
          icon="save"
          onClick={salvarConfigGeral}
        >
          <span>Salvar Alterações</span>
        </SubmitButton>
      </div>

      {isLoading ? (
        <SkeletonList rows={3} height="120px" />
      ) : (
        <div className="app-grid-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="app-card">
              <div className="app-card-header">
                <span className="app-section-title">
                  <span
                    className="material-icons"
                    style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
                  >
                    square_foot
                  </span>
                  Valores por Metro Quadrado (M²)
                </span>
              </div>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  marginBottom: '1rem'
                }}
              >
                Valores base aplicados no quiz para estimar a mão de obra conforme o tipo de
                instalação.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div className="app-form-group" style={{ margin: 0 }}>
                  <label className="app-label">Com Infraestrutura (R$/m²)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    value={config.valorM2ComInfra}
                    onChange={(e) =>
                      setConfig({ ...config, valorM2ComInfra: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="app-form-group" style={{ margin: 0 }}>
                  <label className="app-label">Sem Infraestrutura (R$/m²)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    value={config.valorM2SemInfra}
                    onChange={(e) =>
                      setConfig({ ...config, valorM2SemInfra: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="app-card">
              <div className="app-card-header">
                <span className="app-section-title">
                  <span
                    className="material-icons"
                    style={{ fontSize: '15px', color: 'var(--status-info)' }}
                  >
                    security
                  </span>
                  Instalações e Segurança Eletrônica
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div className="app-form-group" style={{ margin: 0 }}>
                  <label className="app-label">Motor Portão (UN)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    value={config.precoMotor}
                    onChange={(e) => setConfig({ ...config, precoMotor: Number(e.target.value) })}
                  />
                </div>
                <div className="app-form-group" style={{ margin: 0 }}>
                  <label className="app-label">Câmera (UN)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    value={config.precoCamera}
                    onChange={(e) => setConfig({ ...config, precoCamera: Number(e.target.value) })}
                  />
                </div>
                <div className="app-form-group" style={{ margin: 0 }}>
                  <label className="app-label">Cerca (Metro)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    value={config.precoCerca}
                    onChange={(e) => setConfig({ ...config, precoCerca: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="app-card">
              <div className="app-card-header">
                <span className="app-section-title">
                  <span
                    className="material-icons"
                    style={{ fontSize: '15px', color: 'var(--status-success)' }}
                  >
                    payments
                  </span>
                  Logística & Custos Operacionais
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div className="app-form-group" style={{ margin: 0 }}>
                  <label className="app-label">Diária Técnico / Ajudante (R$)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    value={config.valorDiaria}
                    onChange={(e) => setConfig({ ...config, valorDiaria: Number(e.target.value) })}
                  />
                </div>
                <div className="app-form-group" style={{ margin: 0 }}>
                  <label className="app-label">Ponto Elétrico Extra (R$)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    value={config.valorPontoExtra}
                    onChange={(e) =>
                      setConfig({ ...config, valorPontoExtra: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="app-card" style={{ height: '100%' }}>
              <div className="app-card-header">
                <span className="app-section-title">
                  <span
                    className="material-icons"
                    style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
                  >
                    add_task
                  </span>
                  Serviços Extras Personalizados
                </span>
              </div>

              <form
                onSubmit={adicionarExtra}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div className="app-form-group">
                  <label className="app-label">Nome do Serviço</label>
                  <input
                    type="text"
                    className="app-input"
                    placeholder="Ex: Instalação de Lustre Cristal"
                    value={novoServico.nome}
                    onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                  />
                </div>
                <div className="app-form-group">
                  <label className="app-label">Valor Padrão (R$)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="app-input"
                    placeholder="0.00"
                    value={novoServico.valor || ''}
                    onChange={(e) =>
                      setNovoServico({ ...novoServico, valor: Number(e.target.value) })
                    }
                  />
                </div>
                <SubmitButton
                  type="submit"
                  variant="secondary"
                  isSubmitting={isAddingExtra}
                  loadingText="Adicionando..."
                  icon="add"
                  style={{ width: '100%' }}
                >
                  <span>Adicionar à Tabela</span>
                </SubmitButton>
              </form>

              <span className="app-label" style={{ marginBottom: '0.5rem' }}>
                Serviços Cadastrados ({servicosExtras.length})
              </span>

              {/* DESKTOP (>= 768px): Tabela */}
              <div className="app-table-container desktop-only-table">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th style={{ textAlign: 'right' }}>Valor (R$)</th>
                      <th style={{ textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicosExtras.map((s) => (
                      <tr key={s.id || s.nome}>
                        <td
                          className="break-words"
                          style={{ color: 'var(--text-main)', fontWeight: 500 }}
                        >
                          {s.nome}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                            fontFamily: "'JetBrains Mono', monospace"
                          }}
                        >
                          {formatarMoeda(s.valor)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="app-btn app-btn-ghost app-btn-sm"
                            onClick={() => excluirExtra(s.id)}
                            style={{ color: 'var(--status-danger)' }}
                          >
                            <span className="material-icons" style={{ fontSize: '16px' }}>
                              delete_outline
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {servicosExtras.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            padding: '1.5rem'
                          }}
                        >
                          Nenhum serviço extra cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE (< 768px): Cartões Verticais Empilhados (Prompt 01) */}
              <div className="mobile-only-cards">
                {servicosExtras.map((s) => (
                  <div key={s.id || s.nome} className="mobile-stack-card">
                    <div className="mobile-stack-row" style={{ alignItems: 'center' }}>
                      <div>
                        <strong className="break-words" style={{ color: 'var(--text-main)' }}>
                          {s.nome}
                        </strong>
                        <div
                          style={{
                            color: 'var(--accent-primary)',
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            marginTop: '2px'
                          }}
                        >
                          {formatarMoeda(s.valor)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="app-btn app-btn-danger app-btn-sm"
                        onClick={() => excluirExtra(s.id)}
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>
                          delete_outline
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
                {servicosExtras.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                    Nenhum serviço extra cadastrado.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
