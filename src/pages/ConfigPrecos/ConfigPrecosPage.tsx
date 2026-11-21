import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../../core/services/apiService';
import { authService } from '../../core/services/authService';
import { environment } from '../../config/environment';
import { SubmitButton } from '../../components/SubmitButton';
import { SkeletonList } from '../../components/Skeleton';

type AbaConfigMobile = 'PRECOS' | 'SERVICOS' | 'AJUSTES';

export const ConfigPrecosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabInicial = (): AbaConfigMobile => {
    const t = (searchParams.get('tab') || '').toLowerCase();
    if (t === 'servicos') return 'SERVICOS';
    if (t === 'ajustes') return 'AJUSTES';
    return 'PRECOS';
  };

  const [abaAtiva, setAbaAtiva] = useState<AbaConfigMobile>(tabInicial());
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [mensagemFeedback, setMensagemFeedback] = useState('');

  const [config, setConfig] = useState<any>({
    valorM2ComInfra: 45,
    valorM2SemInfra: 28,
    precoMotor: 250,
    precoCamera: 120,
    precoCerca: 35,
    valorDiaria: 250,
    valorPontoExtra: 45,
    areaBase: 100,
    pontosBase: 30
  });

  const [servicosExtras, setServicosExtras] = useState<any[]>([]);
  const [novoServico, setNovoServico] = useState({
    nome: '',
    unidade: 'UN',
    valor: 0,
    materiaisSugeridos: '',
    ativo: true
  });

  // Ajustes do Aplicativo Mobile (Salvos em localStorage para uso em campo)
  const [temaEscuro, setTemaEscuro] = useState<boolean>(
    (localStorage.getItem('mygo-theme') || 'dark') === 'dark'
  );
  const [distribuidoraNome, setDistribuidoraNome] = useState<string>(
    localStorage.getItem('mygo_distribuidora_nome') || environment.distribuidoraPadraoNome
  );
  const [distribuidoraWhats, setDistribuidoraWhats] = useState<string>(
    localStorage.getItem('mygo_distribuidora_whatsapp') || environment.distribuidoraPadraoWhatsApp
  );
  const [cidadeBase, setCidadeBase] = useState<string>(
    localStorage.getItem('cliente_cidade') || 'Palmas'
  );
  const [bairroBase, setBairroBase] = useState<string>(
    localStorage.getItem('cliente_bairro') || 'Plano Diretor Sul'
  );
  const [ufBase, setUfBase] = useState<string>(localStorage.getItem('cliente_uf') || 'TO');

  useEffect(() => {
    setAbaAtiva(tabInicial());
  }, [searchParams]);

  useEffect(() => {
    carregarDados();
  }, []);

  const trocarAba = (novaAba: AbaConfigMobile) => {
    setAbaAtiva(novaAba);
    setMensagemFeedback('');
    setSearchParams({ tab: novaAba.toLowerCase() });
  };

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

  const ajustarValor = (campo: string, delta: number) => {
    const atual = Number(config[campo] || 0);
    setConfig({ ...config, [campo]: Math.max(0, Number((atual + delta).toFixed(2))) });
  };

  const salvarConfigGeral = async () => {
    if (isSavingConfig) return;
    setIsSavingConfig(true);
    setMensagemFeedback('');
    try {
      const payload = {
        ...config,
        areaBase: config.areaBase || 100,
        pontosBase: config.pontosBase || 30
      };
      await apiService.updatePrecos(payload);
      localStorage.setItem('mygo_tabela_precos_cache', JSON.stringify(payload));
      setMensagemFeedback('✓ Tabela de preços atualizada com sucesso!');
    } catch {
      localStorage.setItem('mygo_tabela_precos_cache', JSON.stringify(config));
      setMensagemFeedback('✓ Preços salvos no dispositivo (sincronizará quando online).');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const adicionarExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingExtra || !novoServico.nome.trim() || novoServico.valor < 0) return;

    setIsAddingExtra(true);
    setMensagemFeedback('');
    try {
      await apiService.adicionarServicoExtra({
        ...novoServico,
        valor: Math.max(0, Number(novoServico.valor || 0))
      });
      setNovoServico({
        nome: '',
        unidade: 'UN',
        valor: 0,
        materiaisSugeridos: '',
        ativo: true
      });
      await carregarDados();
      setMensagemFeedback('✓ Serviço personalizado adicionado ao Quiz!');
    } catch {
      setMensagemFeedback('⚠️ Não foi possível salvar o serviço extra agora.');
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

  const alternarTemaApp = (escuro: boolean) => {
    setTemaEscuro(escuro);
    const themeStr = escuro ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeStr);
    localStorage.setItem('mygo-theme', themeStr);
  };

  const salvarAjustesMobile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mygo_distribuidora_nome', distribuidoraNome.trim());
    localStorage.setItem(
      'mygo_distribuidora_whatsapp',
      distribuidoraWhats.replace(/\D/g, '')
    );
    localStorage.setItem('cliente_cidade', cidadeBase.trim());
    localStorage.setItem('cliente_bairro', bairroBase.trim());
    localStorage.setItem('cliente_uf', ufBase.trim().toUpperCase());
    setMensagemFeedback('✓ Ajustes de campo e distribuidora salvos no aparelho!');
  };

  const formatarMoeda = (valor: any): string =>
    Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderInputPrecoMobile = (
    label: string,
    sublabel: string,
    campo: string,
    passo: number = 5
  ) => (
    <div
      key={campo}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: '0.86rem', color: 'var(--text-main)' }}>
          {label}
        </strong>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sublabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          type="button"
          className="app-btn app-btn-secondary app-btn-sm"
          style={{ minWidth: '38px', minHeight: '40px', padding: '0' }}
          onClick={() => ajustarValor(campo, -passo)}
          aria-label={`Diminuir ${label}`}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            remove
          </span>
        </button>

        <div style={{ position: 'relative', width: '92px' }}>
          <span
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          >
            R$
          </span>
          <input
            type="number"
            inputMode="decimal"
            className="app-input"
            style={{
              paddingLeft: '1.65rem',
              paddingRight: '0.4rem',
              textAlign: 'right',
              fontWeight: 700,
              minHeight: '40px',
              color: 'var(--accent-primary)',
              fontFamily: "'JetBrains Mono', monospace"
            }}
            value={config[campo] ?? 0}
            onChange={(e) => setConfig({ ...config, [campo]: Number(e.target.value) })}
          />
        </div>

        <button
          type="button"
          className="app-btn app-btn-secondary app-btn-sm"
          style={{ minWidth: '38px', minHeight: '40px', padding: '0' }}
          onClick={() => ajustarValor(campo, passo)}
          aria-label={`Aumentar ${label}`}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            add
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Cabeçalho Mobile com Ícone de Engrenagem */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}
          >
            <span className="material-icons" style={{ fontSize: '21px' }}>
              settings
            </span>
          </div>
          <div>
            <h1 className="app-title" style={{ margin: 0, fontSize: '1.12rem' }}>
              Preços &amp; Configurações
            </h1>
            <p className="app-subtitle" style={{ margin: 0, fontSize: '0.76rem' }}>
              Tabela de mão de obra, serviços do quiz e ajustes do app
            </p>
          </div>
        </div>
      </div>

      {/* Segmento Mobile em 3 Abas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.4rem',
          background: 'var(--bg-surface)',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1rem'
        }}
      >
        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'PRECOS' ? 'app-btn-primary' : 'app-btn-ghost'
          }`}
          style={{ minHeight: '40px', padding: '0.35rem 0.4rem', fontSize: '0.76rem' }}
          onClick={() => trocarAba('PRECOS')}
        >
          <span className="material-icons" style={{ fontSize: '15px' }}>
            payments
          </span>
          <span>Preços</span>
        </button>

        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'SERVICOS' ? 'app-btn-primary' : 'app-btn-ghost'
          }`}
          style={{ minHeight: '40px', padding: '0.35rem 0.4rem', fontSize: '0.76rem' }}
          onClick={() => trocarAba('SERVICOS')}
        >
          <span className="material-icons" style={{ fontSize: '15px' }}>
            list_alt
          </span>
          <span>Serviços ({servicosExtras.length})</span>
        </button>

        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'AJUSTES' ? 'app-btn-primary' : 'app-btn-ghost'
          }`}
          style={{ minHeight: '40px', padding: '0.35rem 0.4rem', fontSize: '0.76rem' }}
          onClick={() => trocarAba('AJUSTES')}
        >
          <span className="material-icons" style={{ fontSize: '15px' }}>
            settings
          </span>
          <span>Ajustes</span>
        </button>
      </div>

      {mensagemFeedback && (
        <div
          style={{
            marginBottom: '0.9rem',
            padding: '0.7rem 0.9rem',
            borderRadius: '10px',
            background: 'var(--status-success-bg)',
            border: '1px solid var(--status-success-border)',
            color: 'var(--status-success)',
            fontSize: '0.82rem',
            fontWeight: 700,
            textAlign: 'center'
          }}
        >
          {mensagemFeedback}
        </div>
      )}

      {isLoading ? (
        <SkeletonList rows={3} height="110px" />
      ) : (
        <>
          {/* ABA 1: MUDANÇA RÁPIDA DE PREÇOS */}
          {abaAtiva === 'PRECOS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="app-card">
                <div className="app-card-header" style={{ marginBottom: '0.35rem' }}>
                  <span className="app-section-title">
                    <span
                      className="material-icons"
                      style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
                    >
                      square_foot
                    </span>
                    Mão de Obra por Metro Quadrado (M²)
                  </span>
                </div>
                {renderInputPrecoMobile(
                  'Com Infraestrutura (R$/m²)',
                  'Rasgo, tubulação, passagem de cabos e fechamento',
                  'valorM2ComInfra',
                  5
                )}
                {renderInputPrecoMobile(
                  'Sem Infraestrutura (R$/m²)',
                  'Apenas fiação e montagem em conduíte existente',
                  'valorM2SemInfra',
                  5
                )}
              </div>

              <div className="app-card">
                <div className="app-card-header" style={{ marginBottom: '0.35rem' }}>
                  <span className="app-section-title">
                    <span
                      className="material-icons"
                      style={{ fontSize: '15px', color: 'var(--status-success)' }}
                    >
                      engineering
                    </span>
                    Diária Técnica &amp; Ponto Elétrico
                  </span>
                </div>
                {renderInputPrecoMobile(
                  'Diária Técnico / Eletricista',
                  'Valor base de 1 dia de serviço técnico',
                  'valorDiaria',
                  10
                )}
                {renderInputPrecoMobile(
                  'Ponto Elétrico Extra (UN)',
                  'Tomada, interruptor ou ponto de iluminação adicional',
                  'valorPontoExtra',
                  5
                )}
              </div>

              <div className="app-card">
                <div className="app-card-header" style={{ marginBottom: '0.35rem' }}>
                  <span className="app-section-title">
                    <span
                      className="material-icons"
                      style={{ fontSize: '15px', color: 'var(--status-info)' }}
                    >
                      security
                    </span>
                    Automação &amp; Segurança Eletrônica
                  </span>
                </div>
                {renderInputPrecoMobile(
                  'Motor de Portão (UN)',
                  'Instalação elétrica e comando do motor',
                  'precoMotor',
                  10
                )}
                {renderInputPrecoMobile(
                  'Câmera CFTV (UN)',
                  'Passagem e instalação por câmera',
                  'precoCamera',
                  10
                )}
                {renderInputPrecoMobile(
                  'Cerca Elétrica (Metro)',
                  'Valor por metro linear instalado',
                  'precoCerca',
                  5
                )}
              </div>

              <SubmitButton
                type="button"
                isSubmitting={isSavingConfig}
                loadingText="Salvando Preços..."
                icon="save"
                onClick={salvarConfigGeral}
                style={{ width: '100%' }}
              >
                <span>Salvar Tabela de Preços</span>
              </SubmitButton>
            </div>
          )}

          {/* ABA 2: SERVIÇOS EXTRAS DO QUIZ */}
          {abaAtiva === 'SERVICOS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="app-card">
                <div className="app-card-header">
                  <span className="app-section-title">
                    <span
                      className="material-icons"
                      style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
                    >
                      add_task
                    </span>
                    Novo Serviço Extra no Quiz
                  </span>
                </div>

                <form onSubmit={adicionarExtra}>
                  <div className="app-form-group">
                    <label className="app-label">Nome do Serviço</label>
                    <input
                      type="text"
                      className="app-input"
                      placeholder="Ex: Instalação de Chuveiro 220V / Lustre"
                      value={novoServico.nome}
                      onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="app-grid-2" style={{ gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <div className="app-form-group" style={{ margin: 0 }}>
                      <label className="app-label">Unidade</label>
                      <select
                        className="app-select"
                        value={novoServico.unidade}
                        onChange={(e) => setNovoServico({ ...novoServico, unidade: e.target.value })}
                      >
                        <option value="UN">Unidade (UN)</option>
                        <option value="PT">Ponto (PT)</option>
                        <option value="M">Metro (M)</option>
                        <option value="M2">Metro² (M²)</option>
                        <option value="KIT">Kit Completo (KIT)</option>
                      </select>
                    </div>

                    <div className="app-form-group" style={{ margin: 0 }}>
                      <label className="app-label">Mão de Obra (R$)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        className="app-input"
                        placeholder="0.00"
                        value={novoServico.valor || ''}
                        onChange={(e) =>
                          setNovoServico({
                            ...novoServico,
                            valor: Math.max(0, Number(e.target.value))
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="app-form-group">
                    <label className="app-label">Materiais Sugeridos (Opcional)</label>
                    <input
                      type="text"
                      className="app-input"
                      placeholder="Ex: 2x Conector Wago 4mm², Disjuntor 32A"
                      value={novoServico.materiaisSugeridos}
                      onChange={(e) =>
                        setNovoServico({ ...novoServico, materiaisSugeridos: e.target.value })
                      }
                    />
                  </div>

                  <SubmitButton
                    type="submit"
                    isSubmitting={isAddingExtra}
                    loadingText="Adicionando..."
                    icon="add"
                    style={{ width: '100%' }}
                  >
                    <span>Adicionar Serviço à Calculadora</span>
                  </SubmitButton>
                </form>
              </div>

              <div className="app-card">
                <span className="app-label" style={{ marginBottom: '0.65rem' }}>
                  Serviços Cadastrados ({servicosExtras.length})
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {servicosExtras.map((s) => (
                    <div key={s.id || s.nome} className="mobile-stack-card">
                      <div className="mobile-stack-row" style={{ alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong className="break-words" style={{ color: 'var(--text-main)' }}>
                            {s.nome}{' '}
                            <span className="app-badge app-badge-muted">{s.unidade || 'UN'}</span>
                          </strong>
                          {s.materiaisSugeridos && (
                            <p
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                marginTop: '2px'
                              }}
                            >
                              Materiais: {s.materiaisSugeridos}
                            </p>
                          )}
                          <div
                            style={{
                              color: 'var(--accent-primary)',
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              marginTop: '3px'
                            }}
                          >
                            {formatarMoeda(s.valor)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="app-btn app-btn-danger app-btn-sm"
                          onClick={() => excluirExtra(s.id)}
                          aria-label="Excluir serviço"
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
                      Nenhum serviço personalizado cadastrado ainda.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: AJUSTES DO APLICATIVO MOBILE & PERFIL DE CAMPO */}
          {abaAtiva === 'AJUSTES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="app-card">
                <div className="app-card-header">
                  <span className="app-section-title">
                    <span
                      className="material-icons"
                      style={{ fontSize: '15px', color: 'var(--accent-primary)' }}
                    >
                      brightness_6
                    </span>
                    Aparência &amp; Visibilidade em Obra
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`app-btn ${temaEscuro ? 'app-btn-primary' : 'app-btn-secondary'}`}
                    onClick={() => alternarTemaApp(true)}
                  >
                    <span className="material-icons" style={{ fontSize: '17px' }}>
                      dark_mode
                    </span>
                    <span>Escuro (Padrão)</span>
                  </button>

                  <button
                    type="button"
                    className={`app-btn ${!temaEscuro ? 'app-btn-primary' : 'app-btn-secondary'}`}
                    onClick={() => alternarTemaApp(false)}
                  >
                    <span className="material-icons" style={{ fontSize: '17px' }}>
                      light_mode
                    </span>
                    <span>Claro (Sol Forte)</span>
                  </button>
                </div>
              </div>

              <div className="app-card">
                <div className="app-card-header">
                  <span className="app-section-title">
                    <span
                      className="material-icons"
                      style={{ fontSize: '15px', color: 'var(--status-success)' }}
                    >
                      storefront
                    </span>
                    Distribuidora &amp; Região Base
                  </span>
                </div>

                <form onSubmit={salvarAjustesMobile}>
                  <div className="app-form-group">
                    <label className="app-label">Distribuidora Padrão (Cotação WhatsApp)</label>
                    <input
                      type="text"
                      className="app-input"
                      value={distribuidoraNome}
                      onChange={(e) => setDistribuidoraNome(e.target.value)}
                    />
                  </div>

                  <div className="app-form-group">
                    <label className="app-label">WhatsApp Televendas Distribuidora</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="app-input"
                      value={distribuidoraWhats}
                      onChange={(e) => setDistribuidoraWhats(e.target.value)}
                      placeholder="556333222120"
                    />
                  </div>

                  <div className="app-grid-2" style={{ gap: '0.65rem' }}>
                    <div className="app-form-group">
                      <label className="app-label">Cidade de Atendimento</label>
                      <input
                        type="text"
                        className="app-input"
                        value={cidadeBase}
                        onChange={(e) => setCidadeBase(e.target.value)}
                      />
                    </div>
                    <div className="app-form-group">
                      <label className="app-label">UF</label>
                      <input
                        type="text"
                        maxLength={2}
                        className="app-input"
                        value={ufBase}
                        onChange={(e) => setUfBase(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  <div className="app-form-group">
                    <label className="app-label">Bairro / Região Principal</label>
                    <input
                      type="text"
                      className="app-input"
                      value={bairroBase}
                      onChange={(e) => setBairroBase(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="app-btn app-btn-primary" style={{ width: '100%' }}>
                    <span className="material-icons">save</span>
                    <span>Salvar Ajustes do Aplicativo</span>
                  </button>
                </form>
              </div>

              <div className="app-card">
                <div className="app-card-header">
                  <span className="app-section-title">
                    <span
                      className="material-icons"
                      style={{ fontSize: '15px', color: 'var(--status-info)' }}
                    >
                      manage_accounts
                    </span>
                    Conta &amp; Atalhos do Técnico
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <button
                    type="button"
                    className="app-btn app-btn-secondary"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                    onClick={() => navigate('/ferramentas-campo')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="material-icons"
                        style={{ color: 'var(--accent-primary)', fontSize: '18px' }}
                      >
                        bolt
                      </span>
                      <span>Abrir Kit Eletrotécnico NBR 5410</span>
                    </span>
                    <span className="material-icons" style={{ fontSize: '18px' }}>
                      chevron_right
                    </span>
                  </button>

                  <button
                    type="button"
                    className="app-btn app-btn-secondary"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                    onClick={() => navigate('/assinatura')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="material-icons"
                        style={{ color: 'var(--accent-primary)', fontSize: '18px' }}
                      >
                        stars
                      </span>
                      <span>Gerenciar Plano ({authService.getPlanType()})</span>
                    </span>
                    <span className="material-icons" style={{ fontSize: '18px' }}>
                      chevron_right
                    </span>
                  </button>

                  <button
                    type="button"
                    className="app-btn app-btn-danger"
                    style={{ width: '100%' }}
                    onClick={() => {
                      authService.logout();
                      navigate('/login');
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '18px' }}>
                      logout
                    </span>
                    <span>Sair da Conta ({authService.getUserName()})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
