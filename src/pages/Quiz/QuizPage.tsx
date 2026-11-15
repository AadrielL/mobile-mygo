import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../core/services/apiService';
import { useDebounce } from '../../core/hooks/useDebounce';
import { SubmitButton } from '../../components/SubmitButton';
import './QuizPage.css';

interface ServicoExtraUI {
  id?: number;
  nome: string;
  valor: number;
  selecionado: boolean;
  quantidade: number;
}

const OPCOES_TIPO_OBRA = [
  { value: 'RESIDENCIAL', label: 'Residencial', icon: '🏠', desc: 'Casas e apartamentos' },
  { value: 'COMERCIAL', label: 'Comercial', icon: '🏢', desc: 'Lojas e escritórios' },
  { value: 'REFORMA', label: 'Reforma', icon: '🔨', desc: 'Adequação elétrica' },
  { value: 'ALTO_PADRAO', label: 'Alto Padrão', icon: '⭐', desc: 'Projetos especiais' }
];

export const QuizPage: React.FC = () => {
  const [quizAberto, setQuizAberto] = useState(false);
  const [passoAtual, setPassoAtual] = useState(1);
  const [sabeDistancia, setSabeDistancia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exibirModal, setExibirModal] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState<any>(null);
  const [numeroWhatsApp, setNumeroWhatsApp] = useState('');

  // Campos do formulário
  const [nomeCliente, setNomeCliente] = useState('');
  const [metragemM2, setMetragemM2] = useState<number>(0);
  const [comInfra, setComInfra] = useState<boolean>(true);
  const [complexidade, setComplexidade] = useState<string>('RESIDENCIAL');
  const [distanciaQuadroPoste, setDistanciaQuadroPoste] = useState<number>(0);
  const [qtdChuveiro, setQtdChuveiro] = useState<number>(0);
  const [qtdArCondicionado, setQtdArCondicionado] = useState<number>(0);
  const [qtdCameras, setQtdCameras] = useState<number>(0);
  const [metrosCerca, setMetrosCerca] = useState<number>(0);
  const [qtdPontosEletrica, setQtdPontosEletrica] = useState<number>(0);
  const [qtdMotoresPortao, setQtdMotoresPortao] = useState<number>(0);

  const [servicosExtras, setServicosExtras] = useState<ServicoExtraUI[]>([]);
  const [buscaExtra, setBuscaExtra] = useState('');
  const buscaExtraDebounced = useDebounce(buscaExtra, 400);

  const navigate = useNavigate();

  useEffect(() => {
    apiService
      .getServicosExtras()
      .then((servicos) => {
        if (servicos && servicos.length > 0) {
          setServicosExtras(
            servicos.map((s: any) => ({
              id: s.id,
              nome: s.nome,
              valor: s.valor,
              selecionado: false,
              quantidade: 1
            }))
          );
        }
      })
      .catch(() => setServicosExtras([]));
  }, []);

  const totalPassos = servicosExtras.length > 0 ? 5 : 4;
  const progressoPorcentagem = (passoAtual / totalPassos) * 100;
  const ehUltimoPasso = passoAtual === totalPassos;

  const abrirQuiz = () => {
    setQuizAberto(true);
    setPassoAtual(1);
  };

  const fecharQuiz = () => {
    setQuizAberto(false);
  };

  const toggleExtra = (idx: number) => {
    setServicosExtras((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, selecionado: !item.selecionado } : item))
    );
  };

  const alterarQtdExtra = (idx: number, delta: number) => {
    setServicosExtras((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, quantidade: Math.max(1, item.quantidade + delta) } : item
      )
    );
  };

  const finalizar = async () => {
    if (isSubmitting) return;
    if (!nomeCliente.trim() || metragemM2 <= 0) {
      alert('Por favor, preencha os campos obrigatórios (Nome do Cliente e Área em m²).');
      setPassoAtual(3);
      return;
    }

    setIsSubmitting(true);

    const adicionais = servicosExtras
      .filter((s) => s.selecionado)
      .map((s) => ({
        nomeServico: s.nome,
        precoUnitario: s.valor,
        quantidade: s.quantidade,
        selecionado: true
      }));

    const payload = {
      nomeCliente,
      metragemM2,
      comInfra,
      complexidade,
      distanciaQuadroPoste: sabeDistancia ? distanciaQuadroPoste : 0,
      qtdChuveiro,
      qtdArCondicionado,
      qtdCameras,
      metrosCerca,
      qtdPontosEletrica,
      qtdMotoresPortao,
      adicionais,
      visitasEstimadas: 1,
      diariaAjudante: 0
    };

    try {
      const resultado = await apiService.gerarOrcamento(payload);
      setResultadoCalculo({
        ...resultado,
        valorTotalMaoDeObra: resultado?.valorTotalMaoDeObra || 0,
        custoLogistica: resultado?.custoLogistica || 0
      });
      setExibirModal(true);
    } catch (err: any) {
      if (err?.status === 429) {
        alert(
          '🚫 Limite diário atingido!\n\nVocê atingiu seu limite diário gratuito de 3 requisições. Volte amanhã ou assine o plano PRO!'
        );
        fecharQuiz();
        navigate('/assinatura');
      } else {
        alert('Erro ao calcular orçamento. Verifique se as APIs estão online.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const proximoPasso = () => {
    if (passoAtual < totalPassos) {
      setPassoAtual((p) => p + 1);
    } else {
      finalizar();
    }
  };

  const voltarPasso = () => {
    if (passoAtual > 1) setPassoAtual((p) => p - 1);
  };

  const fecharModalResultado = () => {
    setExibirModal(false);
    setQuizAberto(false);
    setNumeroWhatsApp('');
    if (resultadoCalculo?.id) {
      navigate(`/levantamento?orcamentoId=${resultadoCalculo.id}`);
    }
  };

  const cotarCapitalEletrica = () => {
    if (!resultadoCalculo) return;
    const nome = nomeCliente || 'Cliente';
    const total = (
      (resultadoCalculo.valorTotalMaoDeObra || 0) + (resultadoCalculo.custoLogistica || 0)
    ).toFixed(2);
    const msg =
      `⚡ *SOLICITAÇÃO DE COTAÇÃO — CAPITAL ELÉTRICA (PALMAS/TO)*\n` +
      `Cliente / Projeto: *${nome}*\n` +
      `Mão de Obra Estimada: *R$ ${total}*\n` +
      `-------------------------------------------\n` +
      `Olá Capital Elétrica! Gostaria de cotar a lista de materiais para este projeto elétrico dimensionado no AMORIS Tech (NBR 5410).`;
    window.open(`https://wa.me/556333222120?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const enviarWhatsApp = () => {
    if (!numeroWhatsApp || !resultadoCalculo) return;
    const nome = nomeCliente || 'Cliente';
    const total = (
      (resultadoCalculo.valorTotalMaoDeObra || 0) + (resultadoCalculo.custoLogistica || 0)
    ).toFixed(2);
    const telefone = numeroWhatsApp.replace(/\D/g, '');
    const msg = `Olá! O orçamento elétrico para o projeto "${nome}" ficou no valor estimado de R$ ${total}.\nPara mais detalhes, entre em contato.`;
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const valorTotalFormatado = (
    (resultadoCalculo?.valorTotalMaoDeObra || 0) + (resultadoCalculo?.custoLogistica || 0)
  ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {!quizAberto && !exibirModal && (
        <div className="quiz-landing">
          <div className="landing-card app-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}
            >
              <span
                className="material-icons"
                style={{ fontSize: '22px', color: 'var(--accent-primary)' }}
              >
                calculate
              </span>
              <span className="app-badge app-badge-amber">Módulo de Engenharia</span>
            </div>

            <h1 className="app-title" style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
              Cálculo de Orçamento NBR 5410
            </h1>
            <p
              className="app-subtitle"
              style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}
            >
              Dimensionamento automatizado de mão de obra, complexidade da instalação e custos
              operacionais.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}
            >
              <span className="app-badge app-badge-muted">
                <span className="material-icons" style={{ fontSize: '13px' }}>
                  schedule
                </span>{' '}
                ~3 min
              </span>
              <span className="app-badge app-badge-muted">
                <span className="material-icons" style={{ fontSize: '13px' }}>
                  check_circle
                </span>{' '}
                NBR 5410
              </span>
              <span className="app-badge app-badge-muted">
                <span className="material-icons" style={{ fontSize: '13px' }}>
                  picture_as_pdf
                </span>{' '}
                PDF Pronto
              </span>
            </div>

            <button
              type="button"
              className="app-btn app-btn-primary"
              onClick={abrirQuiz}
              style={{ width: '100%' }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>
                play_arrow
              </span>
              <span>Iniciar Dimensionamento</span>
            </button>
          </div>
        </div>
      )}

      {quizAberto && !exibirModal && (
        <div className="quiz-overlay">
          <div className="quiz-modal">
            <div className="quiz-modal-header">
              <button type="button" className="btn-voltar-quiz" onClick={fecharQuiz}>
                <span className="material-icons">arrow_back</span>
                <span>Voltar</span>
              </button>
              <div className="quiz-progress-bar">
                <div
                  className="quiz-progress-fill"
                  style={{ width: `${progressoPorcentagem}%` }}
                />
              </div>
              <span className="quiz-passo-label">
                {passoAtual} / {totalPassos}
              </span>
            </div>

            <div className="quiz-body">
              {passoAtual === 1 && (
                <div className="quiz-step">
                  <p className="quiz-step-num">Passo 1</p>
                  <h2 className="quiz-question">Qual é o tipo da obra?</h2>
                  <div className="quiz-cards-grid">
                    {OPCOES_TIPO_OBRA.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`quiz-option-card ${
                          complexidade === opt.value ? 'selected' : ''
                        }`}
                        onClick={() => setComplexidade(opt.value)}
                      >
                        <span className="option-icon">{opt.icon}</span>
                        <strong>{opt.label}</strong>
                        <small>{opt.desc}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {passoAtual === 2 && (
                <div className="quiz-step">
                  <p className="quiz-step-num">Passo 2</p>
                  <h2 className="quiz-question">Incluir infraestrutura?</h2>
                  <p className="quiz-hint">(eletrodutos, caixas, quadro elétrico)</p>
                  <div className="quiz-cards-grid">
                    <button
                      type="button"
                      className={`quiz-option-card ${comInfra ? 'selected' : ''}`}
                      onClick={() => setComInfra(true)}
                    >
                      <span className="option-icon">🔧</span>
                      <strong>Sim, completo</strong>
                      <small>Inclui materiais e mão de obra</small>
                    </button>

                    <button
                      type="button"
                      className={`quiz-option-card ${!comInfra ? 'selected' : ''}`}
                      onClick={() => setComInfra(false)}
                    >
                      <span className="option-icon">⚡</span>
                      <strong>Não, só fiação</strong>
                      <small>Apenas cabos e conexões</small>
                    </button>
                  </div>
                </div>
              )}

              {passoAtual === 3 && (
                <div className="quiz-step">
                  <p className="quiz-step-num">Passo 3</p>
                  <h2 className="quiz-question">Dados da obra</h2>
                  <div className="quiz-fields-grid">
                    <div className="quiz-field full">
                      <label>Nome do Cliente / Projeto</label>
                      <input
                        type="text"
                        className="app-input"
                        value={nomeCliente}
                        onChange={(e) => setNomeCliente(e.target.value)}
                        placeholder="Ex: Casa do João"
                      />
                    </div>
                    <div className="quiz-field">
                      <label>Área total (m²)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        className="app-input"
                        value={metragemM2 || ''}
                        onChange={(e) => setMetragemM2(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="quiz-field">
                      <label>Pontos Elétricos</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        className="app-input"
                        value={qtdPontosEletrica || ''}
                        onChange={(e) => setQtdPontosEletrica(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="quiz-field full">
                      <label>Distância Poste ao Quadro?</label>
                      <select
                        className="app-select"
                        value={sabeDistancia ? 'sim' : 'nao'}
                        onChange={(e) => setSabeDistancia(e.target.value === 'sim')}
                      >
                        <option value="nao">Não sei / Padrão (0m)</option>
                        <option value="sim">Sim, eu sei a distância</option>
                      </select>
                    </div>
                    {sabeDistancia && (
                      <div className="quiz-field full">
                        <label>Distância em Metros</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="app-input"
                          value={distanciaQuadroPoste || ''}
                          onChange={(e) => setDistanciaQuadroPoste(Number(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {passoAtual === 4 && (
                <div className="quiz-step">
                  <p className="quiz-step-num">Passo 4</p>
                  <h2 className="quiz-question">Quais equipamentos serão instalados?</h2>
                  <p className="quiz-hint">Coloque 0 nos que não se aplicam</p>
                  <div className="quiz-equip-grid">
                    <div className="equip-item">
                      <span className="equip-icon">🚿</span>
                      <label>Chuveiros</label>
                      <div className="counter">
                        <button
                          type="button"
                          onClick={() => setQtdChuveiro((v) => Math.max(0, v - 1))}
                        >
                          −
                        </button>
                        <span>{qtdChuveiro}</span>
                        <button type="button" onClick={() => setQtdChuveiro((v) => v + 1)}>
                          +
                        </button>
                      </div>
                    </div>

                    <div className="equip-item">
                      <span className="equip-icon">❄️</span>
                      <label>Ar Condicionado</label>
                      <div className="counter">
                        <button
                          type="button"
                          onClick={() => setQtdArCondicionado((v) => Math.max(0, v - 1))}
                        >
                          −
                        </button>
                        <span>{qtdArCondicionado}</span>
                        <button type="button" onClick={() => setQtdArCondicionado((v) => v + 1)}>
                          +
                        </button>
                      </div>
                    </div>

                    <div className="equip-item">
                      <span className="equip-icon">📷</span>
                      <label>Câmeras (CFTV)</label>
                      <div className="counter">
                        <button
                          type="button"
                          onClick={() => setQtdCameras((v) => Math.max(0, v - 1))}
                        >
                          −
                        </button>
                        <span>{qtdCameras}</span>
                        <button type="button" onClick={() => setQtdCameras((v) => v + 1)}>
                          +
                        </button>
                      </div>
                    </div>

                    <div className="equip-item">
                      <span className="equip-icon">🚗</span>
                      <label>Motores de Portão</label>
                      <div className="counter">
                        <button
                          type="button"
                          onClick={() => setQtdMotoresPortao((v) => Math.max(0, v - 1))}
                        >
                          −
                        </button>
                        <span>{qtdMotoresPortao}</span>
                        <button type="button" onClick={() => setQtdMotoresPortao((v) => v + 1)}>
                          +
                        </button>
                      </div>
                    </div>

                    <div className="equip-item full">
                      <span className="equip-icon">⚡</span>
                      <label>Cerca Elétrica (Metros)</label>
                      <div className="counter">
                        <button
                          type="button"
                          onClick={() => setMetrosCerca((v) => Math.max(0, v - 1))}
                        >
                          −
                        </button>
                        <span>{metrosCerca}</span>
                        <button type="button" onClick={() => setMetrosCerca((v) => v + 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {passoAtual === 5 && servicosExtras.length > 0 && (
                <div className="quiz-step">
                  <p className="quiz-step-num">Passo 5</p>
                  <h2 className="quiz-question">Serviços Adicionais</h2>
                  <p className="quiz-hint">Selecione o que precisar (opcional)</p>

                  <div className="app-form-group">
                    <input
                      type="search"
                      className="app-input"
                      placeholder="Filtrar serviços adicionais..."
                      value={buscaExtra}
                      onChange={(e) => setBuscaExtra(e.target.value)}
                    />
                  </div>

                  <div className="extras-grid">
                    {servicosExtras.map((s, idx) => {
                      if (
                        buscaExtraDebounced.trim() &&
                        !s.nome.toLowerCase().includes(buscaExtraDebounced.toLowerCase())
                      ) {
                        return null;
                      }
                      return (
                        <div
                          key={s.id || idx}
                          className={`extra-card break-words ${s.selecionado ? 'selected' : ''}`}
                          onClick={() => toggleExtra(idx)}
                        >
                          <div className="extra-header">
                            <span className="extra-check material-icons">
                              {s.selecionado ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                            <strong>{s.nome}</strong>
                          </div>
                          {s.selecionado && (
                            <div
                              className="extra-qty"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <label>Quantidade:</label>
                              <div className="counter">
                                <button type="button" onClick={() => alterarQtdExtra(idx, -1)}>
                                  −
                                </button>
                                <span>{s.quantidade}</span>
                                <button type="button" onClick={() => alterarQtdExtra(idx, 1)}>
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="quiz-footer">
              {passoAtual > 1 && (
                <button type="button" className="app-btn app-btn-secondary" onClick={voltarPasso}>
                  <span className="material-icons">chevron_left</span>
                  <span>Voltar</span>
                </button>
              )}

              <SubmitButton
                type="button"
                isSubmitting={isSubmitting}
                loadingText="Calculando..."
                onClick={proximoPasso}
                style={{ marginLeft: 'auto' }}
              >
                {!ehUltimoPasso ? (
                  <>
                    <span>Próximo</span>
                    <span className="material-icons">chevron_right</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons">bolt</span>
                    <span>Gerar Orçamento</span>
                  </>
                )}
              </SubmitButton>
            </div>
          </div>
        </div>
      )}

      {exibirModal && (
        <div className="app-modal-overlay">
          <div className="resultado-card">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-success-bg)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}
            >
              <span className="material-icons" style={{ fontSize: '32px' }}>
                check_circle
              </span>
            </div>

            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '0.25rem'
              }}
            >
              Orçamento Gerado!
            </h2>
            <p
              className="break-words"
              style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}
            >
              Valor estimado para o projeto de{' '}
              <strong style={{ color: 'var(--text-main)' }}>{nomeCliente}</strong>:
            </p>

            <div className="price-box">
              <span className="value">R$ {valorTotalFormatado}</span>
            </div>

            <div
              style={{
                margin: '1.25rem 0',
                textAlign: 'left',
                background: 'var(--bg-surface)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)'
                }}
              >
                Enviar Proposta via WhatsApp
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={numeroWhatsApp}
                  onChange={(e) => setNumeroWhatsApp(e.target.value)}
                  placeholder="(63) 9XXXX-XXXX"
                  className="app-input"
                  style={{ flex: '1 1 160px' }}
                />
                <button
                  type="button"
                  className="app-btn app-btn-primary"
                  onClick={enviarWhatsApp}
                  disabled={!numeroWhatsApp}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>
                    chat
                  </span>
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                className="app-btn app-btn-secondary"
                onClick={cotarCapitalEletrica}
                style={{
                  flex: 1,
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  color: 'var(--status-success)'
                }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: '17px', color: 'var(--status-success)' }}
                >
                  storefront
                </span>
                <span>Cotar na Capital Elétrica</span>
              </button>

              <button
                type="button"
                className="app-btn app-btn-secondary"
                onClick={() => window.print()}
              >
                <span className="material-icons" style={{ fontSize: '17px' }}>
                  print
                </span>
              </button>
            </div>

            <button
              type="button"
              className="app-btn app-btn-primary"
              onClick={fecharModalResultado}
              style={{ width: '100%' }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>
                inventory_2
              </span>
              <span>Ver Levantamento de Materiais</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
