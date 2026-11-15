import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { materialService } from '../../core/services/materialService';
import { SubmitButton } from '../../components/SubmitButton';

export const LevantamentoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orcamentoIdAtual = searchParams.get('orcamentoId');

  const [clienteNome, setClienteNome] = useState<string>('Projeto Avulso');
  const [areaTotalM2, setAreaTotalM2] = useState<number>(60);
  const [qtdQuartos, setQtdQuartos] = useState<number>(0);
  const [qtdSalas, setQtdSalas] = useState<number>(0);
  const [qtdCozinhas, setQtdCozinhas] = useState<number>(0);
  const [qtdBanheiros, setQtdBanheiros] = useState<number>(0);
  const [qtdChuveiros, setQtdChuveiros] = useState<number>(0);
  const [qtdPontosEletrica, setQtdPontosEletrica] = useState<number>(0);
  const [distanciaQuadroPoste, setDistanciaQuadroPoste] = useState<number>(15);
  const [modoEconomico, setModoEconomico] = useState<boolean>(false);
  const [observacoesTecnicas, setObservacoesTecnicas] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [levantamentoResultado, setLevantamentoResultado] = useState<any>(null);
  const [materiaisEditaveis, setMateriaisEditaveis] = useState<any[]>([]);
  const [novoMaterialDesc, setNovoMaterialDesc] = useState<string>('');
  const [novoMaterialQtd, setNovoMaterialQtd] = useState<number>(1);
  const [novoMaterialUnidade, setNovoMaterialUnidade] = useState<string>('UN');

  const navigate = useNavigate();

  useEffect(() => {
    if (orcamentoIdAtual) {
      materialService
        .getOrcamentoPorId(orcamentoIdAtual)
        .then((orc) => {
          if (!orc) return;
          const dadosTecnicos =
            typeof orc.dadosTecnicosSnapshot === 'string'
              ? JSON.parse(orc.dadosTecnicosSnapshot)
              : orc.dadosTecnicosSnapshot || {};
          setClienteNome(orc.clienteNome || 'Cliente');
          setAreaTotalM2(dadosTecnicos.metragemM2 || 60);
          setQtdChuveiros(dadosTecnicos.qtdChuveiro || 0);
          setQtdPontosEletrica(dadosTecnicos.qtdPontosEletrica || 0);
          setDistanciaQuadroPoste(dadosTecnicos.distanciaQuadroPoste || 15);
        })
        .catch(() => {});
    }
  }, [orcamentoIdAtual]);

  const finalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setLevantamentoResultado(null);

    const payload = {
      clienteNome: clienteNome || 'Cliente',
      areaTotalM2: Math.max(1, areaTotalM2),
      qtdQuartos,
      qtdSalas,
      qtdCozinhas,
      qtdBanheiros,
      qtdChuveiros,
      qtdPontosEletrica,
      distanciaQuadroPoste,
      modoEconomico,
      observacoesTecnicas,
      orcamentoId: orcamentoIdAtual
    };

    try {
      const res = await materialService.gerarLevantamento(payload);
      const consolidados = materialService.consolidarMateriaisSemDuplicar(res?.materiais || []);
      setLevantamentoResultado(res);
      setMateriaisEditaveis(consolidados);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      if (err?.status === 429) {
        alert(
          '🚫 Limite atingido!\n\nVocê atingiu seu limite diário gratuito de 15 orçamentos/dia. Assine o plano PRO!'
        );
        navigate('/assinatura');
      } else {
        alert('Erro ao gerar levantamento: ' + (err?.message || 'Verifique a API 8082.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const alterarQuantidadeMaterial = (idx: number, novaQtd: number) => {
    setMateriaisEditaveis((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, quantidade: Math.max(0, novaQtd) } : m))
    );
  };

  const adicionarMaterialManual = () => {
    if (!novoMaterialDesc.trim() || novoMaterialQtd <= 0) return;
    const novaLista = materialService.consolidarMateriaisSemDuplicar([
      ...materiaisEditaveis,
      {
        descricao: novoMaterialDesc.trim(),
        quantidade: Math.max(1, novoMaterialQtd),
        unidade: novoMaterialUnidade
      }
    ]);
    setMateriaisEditaveis(novaLista);
    setNovoMaterialDesc('');
    setNovoMaterialQtd(1);
  };

  const cotarListaConsolidada = async () => {
    await materialService.registrarLogCotacaoEAbrirWhatsApp({
      orcamentoId: orcamentoIdAtual,
      clienteNome: levantamentoResultado?.clienteNome || clienteNome,
      itens: materiaisEditaveis
    });
  };

  if (levantamentoResultado) {
    const materiais = materiaisEditaveis;
    return (
      <div className="app-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="app-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ color: 'var(--status-success)' }}>
                inventory_2
              </span>
              <h2 className="app-title" style={{ fontSize: '1.35rem' }}>
                Lista de Materiais (NBR 5410)
              </h2>
            </div>
            <p className="app-subtitle break-words" style={{ marginTop: '0.25rem' }}>
              Cliente: {levantamentoResultado.clienteNome || clienteNome}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="app-btn app-btn-success"
              onClick={cotarListaConsolidada}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>
                storefront
              </span>
              <span>Cotar na Distribuidora (WhatsApp)</span>
            </button>
            <button
              type="button"
              className="app-btn app-btn-secondary"
              onClick={() => setLevantamentoResultado(null)}
            >
              <span>Novo Cálculo</span>
            </button>
            <button
              type="button"
              className="app-btn app-btn-primary"
              onClick={() => window.print()}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>
                picture_as_pdf
              </span>
              <span>Imprimir PDF</span>
            </button>
          </div>
        </div>

        {/* M2-03: Adicionar ou ajustar itens antes de enviar para cotação */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            marginBottom: '1rem'
          }}
        >
          <span className="app-label">
            Adicionar item extra à lista (consolida automaticamente itens iguais sem duplicar)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
            <input
              type="text"
              className="app-input"
              placeholder="Ex: Cabo Flexível 2.5mm²"
              value={novoMaterialDesc}
              onChange={(e) => setNovoMaterialDesc(e.target.value)}
              style={{ flex: '2 1 180px' }}
            />
            <input
              type="number"
              inputMode="decimal"
              min={1}
              className="app-input"
              value={novoMaterialQtd}
              onChange={(e) => setNovoMaterialQtd(Math.max(1, Number(e.target.value)))}
              style={{ flex: '0 1 90px' }}
            />
            <select
              className="app-select"
              value={novoMaterialUnidade}
              onChange={(e) => setNovoMaterialUnidade(e.target.value)}
              style={{ flex: '0 1 95px' }}
            >
              <option value="UN">UN</option>
              <option value="M">M</option>
              <option value="RL">RL</option>
              <option value="CX">CX</option>
            </select>
            <button
              type="button"
              className="app-btn app-btn-secondary"
              onClick={adicionarMaterialManual}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>
                add
              </span>
              <span>Incluir</span>
            </button>
          </div>
        </div>

        {/* DESKTOP (>= 768px): Tabela com ajuste fino de quantidade (M2-03) */}
        <div className="app-table-container desktop-only-table">
          <table className="app-table">
            <thead>
              <tr>
                <th>Material / Descrição</th>
                <th style={{ textAlign: 'center' }}>Ajustar Quantidade</th>
                <th style={{ textAlign: 'center' }}>Unidade</th>
              </tr>
            </thead>
            <tbody>
              {materiais.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td
                    className="break-words"
                    style={{ color: 'var(--text-main)', fontWeight: 600 }}
                  >
                    {item.descricao}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <button
                        type="button"
                        className="app-btn app-btn-secondary app-btn-sm"
                        onClick={() => alterarQuantidadeMaterial(idx, item.quantidade - 1)}
                      >
                        −
                      </button>
                      <strong
                        style={{
                          minWidth: '36px',
                          color: 'var(--accent-primary)',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        {item.quantidade}
                      </strong>
                      <button
                        type="button"
                        className="app-btn app-btn-secondary app-btn-sm"
                        onClick={() => alterarQuantidadeMaterial(idx, item.quantidade + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="app-badge app-badge-success">{item.unidade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE (< 768px): Cartões Verticais Empilhados com ajuste de quantidade (M2-03) */}
        <div className="mobile-only-cards">
          {materiais.map((item: any, idx: number) => (
            <div key={idx} className="mobile-stack-card">
              <strong className="break-words" style={{ color: 'var(--text-main)' }}>
                {item.descricao}
              </strong>
              <div className="mobile-stack-row" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ajustar Qtd ({item.unidade}):
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="app-btn app-btn-secondary app-btn-sm"
                    onClick={() => alterarQuantidadeMaterial(idx, item.quantidade - 1)}
                  >
                    −
                  </button>
                  <span className="app-badge app-badge-success" style={{ fontSize: '0.85rem' }}>
                    {item.quantidade} {item.unidade}
                  </span>
                  <button
                    type="button"
                    className="app-btn app-btn-secondary app-btn-sm"
                    onClick={() => alterarQuantidadeMaterial(idx, item.quantidade + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {levantamentoResultado.avisoTecnico && (
          <div
            className="break-words"
            style={{
              marginTop: '1.5rem',
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
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>
                gavel
              </span>{' '}
              Notas Técnicas NBR 5410:
            </p>
            <small style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {levantamentoResultado.avisoTecnico}
            </small>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="app-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-icons" style={{ color: 'var(--accent-primary)' }}>
              architecture
            </span>
            <h2 className="app-title" style={{ fontSize: '1.35rem' }}>
              Levantamento por Cômodo
            </h2>
          </div>
          <p className="app-subtitle break-words" style={{ marginTop: '0.25rem' }}>
            Projeto: <strong style={{ color: 'var(--text-main)' }}>{clienteNome}</strong> — O
            sistema calcula fiação e dispositivos pela NBR 5410.
          </p>
        </div>
      </div>

      <form onSubmit={finalizar}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div className="app-form-group" style={{ marginBottom: 0 }}>
            <label className="app-label">Nome do Cliente / Obra</label>
            <input
              type="text"
              className="app-input"
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              required
            />
          </div>
          <div className="app-form-group" style={{ marginBottom: 0 }}>
            <label className="app-label">Área Total (m²)</label>
            <input
              type="number"
              inputMode="decimal"
              className="app-input"
              value={areaTotalM2 || ''}
              onChange={(e) => setAreaTotalM2(Number(e.target.value))}
              min={1}
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p className="app-section-title" style={{ marginBottom: '0.85rem' }}>
            <span className="material-icons" style={{ fontSize: '14px' }}>
              home
            </span>
            Quantidade de Cômodos
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.85rem'
            }}
          >
            <div className="app-form-group" style={{ marginBottom: 0 }}>
              <label className="app-label">Quartos</label>
              <input
                type="number"
                inputMode="numeric"
                className="app-input"
                min={0}
                value={qtdQuartos}
                onChange={(e) => setQtdQuartos(Number(e.target.value))}
              />
            </div>
            <div className="app-form-group" style={{ marginBottom: 0 }}>
              <label className="app-label">Salas</label>
              <input
                type="number"
                inputMode="numeric"
                className="app-input"
                min={0}
                value={qtdSalas}
                onChange={(e) => setQtdSalas(Number(e.target.value))}
              />
            </div>
            <div className="app-form-group" style={{ marginBottom: 0 }}>
              <label className="app-label">Cozinhas</label>
              <input
                type="number"
                inputMode="numeric"
                className="app-input"
                min={0}
                value={qtdCozinhas}
                onChange={(e) => setQtdCozinhas(Number(e.target.value))}
              />
            </div>
            <div className="app-form-group" style={{ marginBottom: 0 }}>
              <label className="app-label">Banheiros</label>
              <input
                type="number"
                inputMode="numeric"
                className="app-input"
                min={0}
                value={qtdBanheiros}
                onChange={(e) => setQtdBanheiros(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }} />

        <div style={{ marginBottom: '1.5rem' }}>
          <p className="app-section-title" style={{ marginBottom: '0.85rem' }}>
            <span className="material-icons" style={{ fontSize: '14px' }}>
              bolt
            </span>
            Instalações Elétricas
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem'
            }}
          >
            <div className="app-form-group" style={{ marginBottom: 0 }}>
              <label className="app-label">Chuveiros</label>
              <input
                type="number"
                inputMode="numeric"
                className="app-input"
                min={0}
                value={qtdChuveiros}
                onChange={(e) => setQtdChuveiros(Number(e.target.value))}
              />
            </div>
            <div className="app-form-group" style={{ marginBottom: 0 }}>
              <label className="app-label">Pontos de Elétrica</label>
              <input
                type="number"
                inputMode="numeric"
                className="app-input"
                min={0}
                value={qtdPontosEletrica}
                onChange={(e) => setQtdPontosEletrica(Number(e.target.value))}
              />
            </div>
            <div className="app-form-group" style={{ marginBottom: 0 }}>
              <label className="app-label">Distância Quadro → Poste (m)</label>
              <input
                type="number"
                inputMode="decimal"
                className="app-input"
                min={0}
                value={distanciaQuadroPoste}
                onChange={(e) => setDistanciaQuadroPoste(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="modoEco"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              id="modoEco"
              checked={modoEconomico}
              onChange={(e) => setModoEconomico(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Ativar Modo Econômico
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  marginTop: '2px'
                }}
              >
                Otimiza o uso de terra e reduz custo de cabos.
              </span>
            </span>
          </label>
        </div>

        <div className="app-form-group">
          <label className="app-label">Observações Técnicas (Opcional)</label>
          <textarea
            className="app-textarea"
            rows={3}
            value={observacoesTecnicas}
            onChange={(e) => setObservacoesTecnicas(e.target.value)}
            placeholder="Ex: Usar tubulação embutida, trifásico no medidor..."
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '1.5rem',
            gap: '0.75rem'
          }}
        >
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

          <SubmitButton
            type="submit"
            isSubmitting={isSubmitting}
            loadingText="Calculando..."
            icon="architecture"
          >
            <span>Gerar Lista de Materiais</span>
          </SubmitButton>
        </div>
      </form>
    </div>
  );
};
