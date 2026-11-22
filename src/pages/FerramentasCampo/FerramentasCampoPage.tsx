import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '../../core/httpClient';
import { environment } from '../../config/environment';

type AbaFerramenta =
  | 'QUEDA_TENSAO'
  | 'ELETRODUTO'
  | 'MOTOR_AR'
  | 'QDC_PADRAO'
  | 'CALIBRACAO_FIOS'
  | 'MULTI_AGENTES';

const SECOES_COMERCIAIS = [1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0, 50.0, 70.0];
const AMPACIDADE_B1_2C = [17.5, 24.0, 32.0, 41.0, 57.0, 76.0, 101.0, 125.0, 151.0, 192.0];
const AMPACIDADE_B1_3C = [15.5, 21.0, 28.0, 36.0, 50.0, 68.0, 89.0, 110.0, 134.0, 171.0];
const DISJUNTORES_DIN = [10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200];

function calcularQuedaLocal(params: {
  potenciaWatts: number;
  tensaoVolts: number;
  distanciaMetros: number;
  sistema: string;
  fatorPotencia: number;
  limiteQuedaPercentual: number;
  finalidade: string;
}) {
  const rho = 0.0172;
  const trifasico = params.sistema === 'TRIFASICO';
  const fatorCirc = trifasico ? Math.sqrt(3) : 2.0;
  const fp = params.fatorPotencia > 0 && params.fatorPotencia <= 1 ? params.fatorPotencia : 0.92;
  const v = params.tensaoVolts > 0 ? params.tensaoVolts : 220;
  const lim = params.limiteQuedaPercentual > 0 ? params.limiteQuedaPercentual : 4.0;

  const ib = trifasico
    ? params.potenciaWatts / (Math.sqrt(3) * v * fp)
    : params.potenciaWatts / (v * fp);

  const secaoMinNorma = params.finalidade === 'ILUMINACAO' ? 1.5 : 2.5;
  const deltaVMax = (lim / 100) * v;
  const secaoQueda = (fatorCirc * rho * params.distanciaMetros * ib * fp) / deltaVMax;
  const tabIz = trifasico ? AMPACIDADE_B1_3C : AMPACIDADE_B1_2C;

  let secaoEscolhida = SECOES_COMERCIAIS[SECOES_COMERCIAIS.length - 1];
  let izEscolhido = tabIz[tabIz.length - 1];

  for (let i = 0; i < SECOES_COMERCIAIS.length; i++) {
    if (
      SECOES_COMERCIAIS[i] >= secaoMinNorma &&
      SECOES_COMERCIAIS[i] >= secaoQueda &&
      tabIz[i] >= ib
    ) {
      secaoEscolhida = SECOES_COMERCIAIS[i];
      izEscolhido = tabIz[i];
      break;
    }
  }

  let disjuntorIn = DISJUNTORES_DIN[DISJUNTORES_DIN.length - 1];
  for (const d of DISJUNTORES_DIN) {
    if (d >= Math.ceil(ib)) {
      disjuntorIn = d;
      break;
    }
  }

  if (disjuntorIn > izEscolhido) {
    for (let i = 0; i < SECOES_COMERCIAIS.length; i++) {
      if (tabIz[i] >= disjuntorIn && SECOES_COMERCIAIS[i] >= secaoEscolhida) {
        secaoEscolhida = SECOES_COMERCIAIS[i];
        izEscolhido = tabIz[i];
        break;
      }
    }
  }

  const quedaVolts = (fatorCirc * rho * params.distanciaMetros * ib * fp) / secaoEscolhida;
  const quedaPct = (quedaVolts / v) * 100;
  const prefixoDisj = trifasico
    ? 'Tripolar DIN '
    : params.sistema === 'BIFASICO'
      ? 'Bipolar DIN '
      : 'Monopolar DIN ';

  return {
    correnteProjetoAmperes: Number(ib.toFixed(2)),
    secaoRecomendadaMm2: secaoEscolhida,
    capacidadeConducaoCaboAmperes: izEscolhido,
    disjuntorRecomendado: `${prefixoDisj}${disjuntorIn}A (Curva C)`,
    disjuntorAmperes: disjuntorIn,
    quedaTensaoRealPercentual: Number(quedaPct.toFixed(2)),
    quedaTensaoRealVolts: Number(quedaVolts.toFixed(2)),
    limiteNormativoPercentual: lim,
    conformeNbr5410: quedaPct <= lim && ib <= disjuntorIn && disjuntorIn <= izEscolhido,
    notaTecnica: `Coordenação NBR 5410 (Ib=${ib.toFixed(1)}A ≤ In=${disjuntorIn}A ≤ Iz=${izEscolhido}A) com queda de ${quedaPct.toFixed(2)}% em ${params.distanciaMetros}m.`
  };
}

export const FerramentasCampoPage: React.FC = () => {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<AbaFerramenta>('QUEDA_TENSAO');
  const [calculando, setCalculando] = useState(false);

  // Estado 1: Queda de Tensão & Condutor
  const [potenciaW, setPotenciaW] = useState('4400');
  const [tensaoV, setTensaoV] = useState('220');
  const [distanciaM, setDistanciaM] = useState('25');
  const [sistema, setSistema] = useState<'MONOFASICO' | 'BIFASICO' | 'TRIFASICO'>('MONOFASICO');
  const [finalidade, setFinalidade] = useState<'TOMADAS_FORCA' | 'ILUMINACAO'>('TOMADAS_FORCA');
  const [limiteQueda, setLimiteQueda] = useState('4.0');
  const [resQueda, setResQueda] = useState<any>(() =>
    calcularQuedaLocal({
      potenciaWatts: 4400,
      tensaoVolts: 220,
      distanciaMetros: 25,
      sistema: 'MONOFASICO',
      fatorPotencia: 0.92,
      limiteQuedaPercentual: 4.0,
      finalidade: 'TOMADAS_FORCA'
    })
  );

  // Estado 2: Eletroduto
  const [bitola1, setBitola1] = useState('2.5');
  const [qtd1, setQtd1] = useState('3');
  const [bitola2, setBitola2] = useState('4.0');
  const [qtd2, setQtd2] = useState('2');
  const [resEletroduto, setResEletroduto] = useState<any>({
    eletrodutoRecomendado: '20mm (1/2")',
    totalCondutores: 5,
    areaOcupadaCabosMm2: 58.26,
    areaInternaEletrodutoMm2: 176.71,
    taxaOcupacaoRealPercentual: 32.97,
    taxaMaximaNbr5410Percentual: 40,
    conformeNbr5410: true
  });

  // Estado 3: Motor (CV) & Ar-Condicionado (BTU)
  const [tipoEquip, setTipoEquip] = useState<'AR_CONDICIONADO' | 'MOTOR_CV'>('AR_CONDICIONADO');
  const [valorEquip, setValorEquip] = useState('12000');
  const [tensaoEquip, setTensaoEquip] = useState('220');
  const [distEquip, setDistEquip] = useState('15');
  const [resEquip, setResEquip] = useState<any>(null);

  // Estado 4: QDC & Padrão de Entrada
  const [cargaKw, setCargaKw] = useState('15');
  const [tensaoFn, setTensaoFn] = useState('220');
  const [qtdCircuitos, setQtdCircuitos] = useState('8');
  const [resQdc, setResQdc] = useState<any>(null);

  // Estado 5: Calibração de Fios por Padrão de Casa + Feedback Pós-Obra (IA)
  const [padraoCasa, setPadraoCasa] = useState('CASA_PADRAO_MEDIO_LAJE');
  const [areaCasaM2, setAreaCasaM2] = useState('120');
  const [statusFeedback, setStatusFeedback] = useState<'BATEU_EXATO' | 'FALTOU_FIO' | 'SOBROU_FIO'>('BATEU_EXATO');
  const [deltaMetros, setDeltaMetros] = useState('25');
  const [comentarioObra, setComentarioObra] = useState('');
  const [fatorIaSalvo, setFatorIaSalvo] = useState<number>(() =>
    Number(localStorage.getItem('mygo_fator_ia_fios') || '1.05')
  );
  const [msgFeedbackIa, setMsgFeedbackIa] = useState('');

  // Estado 6: Consultor Multi-Agentes Especializados (NR-10, Regional UF e Auditor Comercial)
  const [agenteSelecionado, setAgenteSelecionado] = useState<
    'AGENTE_DIAGNOSTICO_NR10' | 'AGENTE_GEOLOCALIZACAO' | 'AGENTE_AUDITOR_PROPOSTA'
  >('AGENTE_DIAGNOSTICO_NR10');
  const [contextoAgente, setContextoAgente] = useState('IDR 30mA desarmando ao ligar chuveiro');
  const [ufAgente, setUfAgente] = useState(() => localStorage.getItem('cliente_uf') || 'TO');
  const [cidadeAgente, setCidadeAgente] = useState(
    () => localStorage.getItem('cliente_cidade') || 'Palmas'
  );
  const [valorPropostaAgente, setValorPropostaAgente] = useState('3850');
  const [resAgente, setResAgente] = useState<any>(null);

  const executarQuedaTensao = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = {
      potenciaWatts: Number(potenciaW) || 1000,
      tensaoVolts: Number(tensaoV) || 220,
      distanciaMetros: Number(distanciaM) || 10,
      sistema,
      fatorPotencia: 0.92,
      limiteQuedaPercentual: Number(limiteQueda) || 4.0,
      finalidade
    };
    setCalculando(true);
    try {
      const apiRes = await httpClient.post<any>(
        `${environment.apiMateriaisUrl}/api/materiais/eletrotecnica/queda-tensao`,
        payload
      );
      setResQueda(apiRes);
    } catch {
      setResQueda(calcularQuedaLocal(payload));
    } finally {
      setCalculando(false);
    }
  };

  const executarEletroduto = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const b1 = Number(bitola1) || 2.5;
    const q1 = Number(qtd1) || 0;
    const b2 = Number(bitola2) || 0;
    const q2 = Number(qtd2) || 0;
    setCalculando(true);
    try {
      const apiRes = await httpClient.post<any>(
        `${environment.apiMateriaisUrl}/api/materiais/eletrotecnica/eletroduto`,
        {
          bitolaPrincipalMm2: b1,
          quantidadePrincipal: q1,
          bitolaSecundariaMm2: b2,
          quantidadeSecundaria: q2
        }
      );
      setResEletroduto(apiRes);
    } catch {
      const diam = (s: number) =>
        s <= 1.5 ? 3.0 : s <= 2.5 ? 3.6 : s <= 4 ? 4.2 : s <= 6 ? 4.9 : s <= 10 ? 6.2 : s <= 16 ? 7.4 : 9.2;
      const area1 = Math.PI * Math.pow(diam(b1) / 2, 2) * q1;
      const area2 = b2 > 0 && q2 > 0 ? Math.PI * Math.pow(diam(b2) / 2, 2) * q2 : 0;
      const totalC = Math.max(1, q1 + q2);
      const areaTot = area1 + area2;
      const lim = totalC === 1 ? 0.53 : totalC === 2 ? 0.31 : 0.4;
      const opcoes = [
        { nome: '20mm (1/2")', area: Math.PI * 7.5 * 7.5 },
        { nome: '25mm (3/4")', area: Math.PI * 9.7 * 9.7 },
        { nome: '32mm (1")', area: Math.PI * 12.7 * 12.7 },
        { nome: '40mm (1.1/4")', area: Math.PI * 16.4 * 16.4 },
        { nome: '50mm (1.1/2")', area: Math.PI * 20.6 * 20.6 },
        { nome: '60mm (2")', area: Math.PI * 25.7 * 25.7 }
      ];
      const eleito = opcoes.find((o) => areaTot <= o.area * lim) || opcoes[opcoes.length - 1];
      const ocup = (areaTot / eleito.area) * 100;
      setResEletroduto({
        eletrodutoRecomendado: eleito.nome,
        totalCondutores: totalC,
        areaOcupadaCabosMm2: Number(areaTot.toFixed(2)),
        areaInternaEletrodutoMm2: Number(eleito.area.toFixed(2)),
        taxaOcupacaoRealPercentual: Number(ocup.toFixed(2)),
        taxaMaximaNbr5410Percentual: lim * 100,
        conformeNbr5410: ocup <= lim * 100
      });
    } finally {
      setCalculando(false);
    }
  };

  const executarMotorAr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = Number(valorEquip) || 12000;
    const v = Number(tensaoEquip) || 220;
    const d = Number(distEquip) || 15;
    setCalculando(true);
    try {
      const apiRes = await httpClient.post<any>(
        `${environment.apiMateriaisUrl}/api/materiais/eletrotecnica/motor-ar`,
        {
          tipoEquipamento: tipoEquip,
          valor: val,
          tensaoVolts: v,
          distanciaMetros: d
        }
      );
      setResEquip(apiRes);
    } catch {
      const potW = tipoEquip === 'MOTOR_CV' ? (val * 735.5) / 0.82 : val * 0.095;
      const base = calcularQuedaLocal({
        potenciaWatts: potW,
        tensaoVolts: v,
        distanciaMetros: d,
        sistema: v >= 380 ? 'TRIFASICO' : 'BIFASICO',
        fatorPotencia: tipoEquip === 'MOTOR_CV' ? 0.82 : 0.92,
        limiteQuedaPercentual: 4.0,
        finalidade: 'TOMADAS_FORCA'
      });
      setResEquip({
        ...base,
        equipamento:
          tipoEquip === 'MOTOR_CV' ? `${val} CV (Motor Elétrico)` : `${val} BTU/h (Ar-Condicionado)`,
        potenciaEletricaEstimadaWatts: Number(potW.toFixed(0)),
        correntePartidaEstimadaAmperes: Number(
          (base.correnteProjetoAmperes * (tipoEquip === 'MOTOR_CV' ? 5.5 : 1.4)).toFixed(1)
        )
      });
    } finally {
      setCalculando(false);
    }
  };

  const executarQdc = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const kw = Number(cargaKw) || 15;
    const vfn = Number(tensaoFn) || 220;
    const circs = Number(qtdCircuitos) || 8;
    setCalculando(true);
    try {
      const apiRes = await httpClient.post<any>(
        `${environment.apiMateriaisUrl}/api/materiais/eletrotecnica/qdc-padrao`,
        {
          cargaInstaladaKw: kw,
          tensaoFaseNeutro: vfn,
          quantidadeCircuitosTerminais: circs
        }
      );
      setResQdc(apiRes);
    } catch {
      const fd = kw <= 10 ? 0.85 : kw <= 25 ? 0.72 : 0.62;
      const demKva = (kw * fd) / 0.92;
      const polos = kw <= 12 ? 1 : kw <= 25 ? 2 : 3;
      const vLinha = vfn === 127 ? 220 : 380;
      const iDem =
        polos === 1
          ? (demKva * 1000) / vfn
          : polos === 2
            ? (demKva * 1000) / vLinha
            : (demKva * 1000) / (Math.sqrt(3) * vLinha);
      const disj = DISJUNTORES_DIN.find((d) => d >= Math.max(32, Math.ceil(iDem))) || 100;
      const idr = disj <= 40 ? 40 : disj <= 63 ? 63 : 80;
      const cabo = disj <= 40 ? 6 : disj <= 50 ? 10 : disj <= 63 ? 16 : 25;
      const res = circs <= 6 ? 2 : circs <= 12 ? 3 : circs <= 30 ? 4 : Math.ceil(circs * 0.15);
      const mods = circs + res + polos + 4 + (polos + 1);
      const qdcComercial = mods <= 12 ? 12 : mods <= 18 ? 18 : mods <= 24 ? 24 : 36;
      setResQdc({
        modalidadeFornecimento:
          polos === 1
            ? 'Monofásico (Fase + Neutro + Terra)'
            : polos === 2
              ? 'Bifásico (2 Fases + Neutro + Terra)'
              : 'Trifásico (3 Fases + Neutro + Terra)',
        demandaCalculadaKva: Number(demKva.toFixed(2)),
        correnteDemandaAmperes: Number(iDem.toFixed(1)),
        disjuntorGeral: `${disj}A (${polos === 1 ? 'Monopolar' : polos === 2 ? 'Bipolar' : 'Tripolar'} DIN)`,
        idrRecomendado: `IDR ${polos === 1 ? 'Bipolar' : 'Tetrapolar'} ${idr}A / 30mA`,
        dpsRecomendado: `${polos + 1}x DPS Classe II 275V 20kA/45kA`,
        caboEntradaAterramentoMm2: `${cabo} mm² (Cobre 750V)`,
        reservaObrigatoriaNbr5410: `${res} circuitos livres`,
        quadroDistribuicaoSugerido: `QDC para ${qdcComercial} módulos DIN com barramento pente`
      });
    } finally {
      setCalculando(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <span className="app-badge app-badge-amber" style={{ marginBottom: '0.25rem' }}>
            ⚡ KIT DE CAMPO • ELETROTÉCNICA &amp; ELETRICISTA
          </span>
          <h1 className="app-title" style={{ margin: 0 }}>
            Ferramentas Técnicas NBR 5410
          </h1>
        </div>
        <button
          type="button"
          className="app-btn app-btn-secondary app-btn-sm"
          onClick={() => navigate('/dashboard-main')}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            arrow_back
          </span>
          <span>Painel</span>
        </button>
      </div>

      {/* Seletor de Abas Mobile Touch */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}
      >
        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'QUEDA_TENSAO' ? 'app-btn-primary' : 'app-btn-secondary'
          }`}
          onClick={() => setAbaAtiva('QUEDA_TENSAO')}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            bolt
          </span>
          <span>1. Cabo &amp; Queda (ΔV)</span>
        </button>

        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'ELETRODUTO' ? 'app-btn-primary' : 'app-btn-secondary'
          }`}
          onClick={() => setAbaAtiva('ELETRODUTO')}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            architecture
          </span>
          <span>2. Eletroduto (40%)</span>
        </button>

        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'MOTOR_AR' ? 'app-btn-primary' : 'app-btn-secondary'
          }`}
          onClick={() => {
            setAbaAtiva('MOTOR_AR');
            if (!resEquip) executarMotorAr();
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            ac_unit
          </span>
          <span>3. Ar (BTU) &amp; Motor</span>
        </button>

        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'QDC_PADRAO' ? 'app-btn-primary' : 'app-btn-secondary'
          }`}
          onClick={() => {
            setAbaAtiva('QDC_PADRAO');
            if (!resQdc) executarQdc();
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            grid_view
          </span>
          <span>4. QDC, IDR &amp; DPS</span>
        </button>

        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'CALIBRACAO_FIOS' ? 'app-btn-primary' : 'app-btn-secondary'
          }`}
          onClick={() => setAbaAtiva('CALIBRACAO_FIOS')}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            auto_graph
          </span>
          <span>5. Calibrar Fios (IA)</span>
        </button>

        <button
          type="button"
          className={`app-btn app-btn-sm ${
            abaAtiva === 'MULTI_AGENTES' ? 'app-btn-primary' : 'app-btn-secondary'
          }`}
          onClick={() => setAbaAtiva('MULTI_AGENTES')}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>
            smart_toy
          </span>
          <span>6. Agentes NR-10 &amp; UF</span>
        </button>
      </div>

      {/* ABA 1: QUEDA DE TENSÃO E BITOLA */}
      {abaAtiva === 'QUEDA_TENSAO' && (
        <div className="app-card">
          <form onSubmit={executarQuedaTensao}>
            <div className="app-form-group">
              <label className="app-label">Atalhos Rápidos de Equipamento</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Chuveiro 5500W', w: '5500', v: '220', f: 'TOMADAS_FORCA' },
                  { label: 'Chuveiro 7500W', w: '7500', v: '220', f: 'TOMADAS_FORCA' },
                  { label: 'TUG Cozinha 2200W', w: '2200', v: '220', f: 'TOMADAS_FORCA' },
                  { label: 'Iluminação 800W', w: '800', v: '220', f: 'ILUMINACAO' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="app-btn app-btn-secondary app-btn-sm"
                    style={{ fontSize: '0.73rem', padding: '0.3rem 0.65rem', minHeight: '36px' }}
                    onClick={() => {
                      setPotenciaW(preset.w);
                      setTensaoV(preset.v);
                      setFinalidade(preset.f as any);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="app-grid-2" style={{ gap: '0.65rem' }}>
              <div className="app-form-group">
                <label className="app-label">Potência (Watts)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="app-input"
                  value={potenciaW}
                  onChange={(e) => setPotenciaW(e.target.value)}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Distância do QDC (m)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="app-input"
                  value={distanciaM}
                  onChange={(e) => setDistanciaM(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="app-grid-2" style={{ gap: '0.65rem' }}>
              <div className="app-form-group">
                <label className="app-label">Tensão (V)</label>
                <select
                  className="app-select"
                  value={tensaoV}
                  onChange={(e) => setTensaoV(e.target.value)}
                >
                  <option value="220">220V (Padrão Palmas/TO)</option>
                  <option value="127">127V (Monofásico)</option>
                  <option value="380">380V (Trifásico)</option>
                </select>
              </div>

              <div className="app-form-group">
                <label className="app-label">Sistema / Fases</label>
                <select
                  className="app-select"
                  value={sistema}
                  onChange={(e) => setSistema(e.target.value as any)}
                >
                  <option value="MONOFASICO">Monofásico (F+N)</option>
                  <option value="BIFASICO">Bifásico (F+F)</option>
                  <option value="TRIFASICO">Trifásico (3F+N)</option>
                </select>
              </div>
            </div>

            <div className="app-grid-2" style={{ gap: '0.65rem' }}>
              <div className="app-form-group">
                <label className="app-label">Circuito</label>
                <select
                  className="app-select"
                  value={finalidade}
                  onChange={(e) => setFinalidade(e.target.value as any)}
                >
                  <option value="TOMADAS_FORCA">Força / Tomadas (mín. 2,5mm²)</option>
                  <option value="ILUMINACAO">Iluminação (mín. 1,5mm²)</option>
                </select>
              </div>

              <div className="app-form-group">
                <label className="app-label">Limite Queda ΔV (%)</label>
                <select
                  className="app-select"
                  value={limiteQueda}
                  onChange={(e) => setLimiteQueda(e.target.value)}
                >
                  <option value="4.0">4% (Circuito Terminal)</option>
                  <option value="2.0">2% (Alimentador QDC)</option>
                  <option value="5.0">5% (Total Instalação)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="app-btn app-btn-primary"
              style={{ width: '100%', marginTop: '0.35rem' }}
              disabled={calculando}
            >
              <span className="material-icons">calculate</span>
              <span>{calculando ? 'Dimensionando...' : 'Calcular Bitola e Disjuntor'}</span>
            </button>
          </form>

          {resQueda && (
            <div
              style={{
                marginTop: '1.1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}
              >
                <span className="app-badge app-badge-success">✓ DIMENSIONAMENTO NBR 5410</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--accent-primary)'
                  }}
                >
                  ΔV: {resQueda.quedaTensaoRealPercentual}% ({resQueda.quedaTensaoRealVolts}V)
                </span>
              </div>

              <div className="mobile-stack-row" style={{ marginBottom: '0.55rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  Condutor Cobre 750V:
                </span>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                  Cabo {resQueda.secaoRecomendadaMm2} mm²
                </strong>
              </div>

              <div className="mobile-stack-row" style={{ marginBottom: '0.55rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  Proteção Recomendada:
                </span>
                <strong style={{ color: 'var(--status-success)', fontSize: '0.96rem' }}>
                  {resQueda.disjuntorRecomendado}
                </strong>
              </div>

              <div className="mobile-stack-row" style={{ marginBottom: '0.55rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                  Corrente de Projeto (Ib):
                </span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {resQueda.correnteProjetoAmperes} A (Suporta até{' '}
                  {resQueda.capacidadeConducaoCaboAmperes} A)
                </strong>
              </div>

              <p
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.5rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.5rem'
                }}
              >
                {resQueda.notaTecnica}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: OCUPAÇÃO DE ELETRODUTO */}
      {abaAtiva === 'ELETRODUTO' && (
        <div className="app-card">
          <form onSubmit={executarEletroduto}>
            <div className="app-grid-2" style={{ gap: '0.65rem' }}>
              <div className="app-form-group">
                <label className="app-label">Cabo Grupo 1 (mm²)</label>
                <select
                  className="app-select"
                  value={bitola1}
                  onChange={(e) => setBitola1(e.target.value)}
                >
                  {SECOES_COMERCIAIS.map((s) => (
                    <option key={s} value={s}>
                      Cabo {s} mm²
                    </option>
                  ))}
                </select>
              </div>
              <div className="app-form-group">
                <label className="app-label">Qtd. Cabos Grupo 1</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="app-input"
                  value={qtd1}
                  onChange={(e) => setQtd1(e.target.value)}
                />
              </div>
            </div>

            <div className="app-grid-2" style={{ gap: '0.65rem' }}>
              <div className="app-form-group">
                <label className="app-label">Cabo Grupo 2 (Opcional)</label>
                <select
                  className="app-select"
                  value={bitola2}
                  onChange={(e) => setBitola2(e.target.value)}
                >
                  <option value="0">Nenhum</option>
                  {SECOES_COMERCIAIS.map((s) => (
                    <option key={s} value={s}>
                      Cabo {s} mm²
                    </option>
                  ))}
                </select>
              </div>
              <div className="app-form-group">
                <label className="app-label">Qtd. Cabos Grupo 2</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="app-input"
                  value={qtd2}
                  onChange={(e) => setQtd2(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="app-btn app-btn-primary" style={{ width: '100%' }}>
              <span className="material-icons">straighten</span>
              <span>Calcular Diâmetro do Conduíte</span>
            </button>
          </form>

          {resEletroduto && (
            <div
              style={{
                marginTop: '1.1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="mobile-stack-row" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Eletroduto Mínimo:</span>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                  {resEletroduto.eletrodutoRecomendado}
                </strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Taxa de Ocupação:</span>
                <strong style={{ color: 'var(--status-success)' }}>
                  {resEletroduto.taxaOcupacaoRealPercentual}% (Limite NBR:{' '}
                  {resEletroduto.taxaMaximaNbr5410Percentual}%)
                </strong>
              </div>
              <div className="mobile-stack-row">
                <span style={{ color: 'var(--text-secondary)' }}>Total de Condutores:</span>
                <strong>
                  {resEletroduto.totalCondutores} cabos ({resEletroduto.areaOcupadaCabosMm2} mm²)
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: AR-CONDICIONADO (BTU) E MOTORES (CV) */}
      {abaAtiva === 'MOTOR_AR' && (
        <div className="app-card">
          <form onSubmit={executarMotorAr}>
            <div className="app-form-group">
              <label className="app-label">Tipo de Carga</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${
                    tipoEquip === 'AR_CONDICIONADO' ? 'app-btn-primary' : 'app-btn-secondary'
                  }`}
                  onClick={() => {
                    setTipoEquip('AR_CONDICIONADO');
                    setValorEquip('12000');
                  }}
                >
                  ❄️ Ar-Condicionado (BTU)
                </button>
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${
                    tipoEquip === 'MOTOR_CV' ? 'app-btn-primary' : 'app-btn-secondary'
                  }`}
                  onClick={() => {
                    setTipoEquip('MOTOR_CV');
                    setValorEquip('3');
                  }}
                >
                  ⚙️ Motor Elétrico (CV)
                </button>
              </div>
            </div>

            <div className="app-grid-2" style={{ gap: '0.65rem' }}>
              <div className="app-form-group">
                <label className="app-label">
                  {tipoEquip === 'AR_CONDICIONADO' ? 'Capacidade (BTU/h)' : 'Potência (CV)'}
                </label>
                {tipoEquip === 'AR_CONDICIONADO' ? (
                  <select
                    className="app-select"
                    value={valorEquip}
                    onChange={(e) => setValorEquip(e.target.value)}
                  >
                    <option value="9000">9.000 BTU/h</option>
                    <option value="12000">12.000 BTU/h</option>
                    <option value="18000">18.000 BTU/h</option>
                    <option value="24000">24.000 BTU/h</option>
                    <option value="30000">30.000 BTU/h</option>
                  </select>
                ) : (
                  <select
                    className="app-select"
                    value={valorEquip}
                    onChange={(e) => setValorEquip(e.target.value)}
                  >
                    <option value="1">1,0 CV</option>
                    <option value="1.5">1,5 CV</option>
                    <option value="2">2,0 CV</option>
                    <option value="3">3,0 CV</option>
                    <option value="5">5,0 CV</option>
                    <option value="7.5">7,5 CV</option>
                    <option value="10">10,0 CV</option>
                  </select>
                )}
              </div>

              <div className="app-form-group">
                <label className="app-label">Distância (m)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="app-input"
                  value={distEquip}
                  onChange={(e) => setDistEquip(e.target.value)}
                />
              </div>
            </div>

            <div className="app-form-group">
              <label className="app-label">Tensão de Alimentação</label>
              <select
                className="app-select"
                value={tensaoEquip}
                onChange={(e) => setTensaoEquip(e.target.value)}
              >
                <option value="220">220V (Monofásico / Bifásico)</option>
                <option value="380">380V (Trifásico Industrial)</option>
                <option value="127">127V</option>
              </select>
            </div>

            <button type="submit" className="app-btn app-btn-primary" style={{ width: '100%' }}>
              <span className="material-icons">bolt</span>
              <span>Dimensionar Circuito do Equipamento</span>
            </button>
          </form>

          {resEquip && (
            <div
              style={{
                marginTop: '1.1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Potência Elétrica:</span>
                <strong>{resEquip.potenciaEletricaEstimadaWatts} W</strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Corrente Nominal / Partida:</span>
                <strong>
                  {resEquip.correnteProjetoAmperes} A (Pico: {resEquip.correntePartidaEstimadaAmperes}{' '}
                  A)
                </strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Condutor Recomendado:</span>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '1.05rem' }}>
                  Cabo {resEquip.secaoRecomendadaMm2} mm²
                </strong>
              </div>
              <div className="mobile-stack-row">
                <span style={{ color: 'var(--text-secondary)' }}>Disjuntor Exclusivo:</span>
                <strong style={{ color: 'var(--status-success)' }}>
                  {resEquip.disjuntorRecomendado}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 4: QDC, IDR E DPS */}
      {abaAtiva === 'QDC_PADRAO' && (
        <div className="app-card">
          <form onSubmit={executarQdc}>
            <div className="app-grid-2" style={{ gap: '0.65rem' }}>
              <div className="app-form-group">
                <label className="app-label">Carga Instalada Total (kW)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="app-input"
                  value={cargaKw}
                  onChange={(e) => setCargaKw(e.target.value)}
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Nº de Circuitos no QDC</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="app-input"
                  value={qtdCircuitos}
                  onChange={(e) => setQtdCircuitos(e.target.value)}
                />
              </div>
            </div>

            <div className="app-form-group">
              <label className="app-label">Tensão Fase-Neutro da Concessionária</label>
              <select
                className="app-select"
                value={tensaoFn}
                onChange={(e) => setTensaoFn(e.target.value)}
              >
                <option value="220">220V / 380V (Padrão Energisa TO)</option>
                <option value="127">127V / 220V</option>
              </select>
            </div>

            <button type="submit" className="app-btn app-btn-primary" style={{ width: '100%' }}>
              <span className="material-icons">verified_user</span>
              <span>Dimensionar QDC, IDR e DPS</span>
            </button>
          </form>

          {resQdc && (
            <div
              style={{
                marginTop: '1.1rem',
                padding: '1rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Padrão de Entrada:</span>
                <strong style={{ color: 'var(--accent-primary)' }}>
                  {resQdc.modalidadeFornecimento}
                </strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Disjuntor Geral:</span>
                <strong>{resQdc.disjuntorGeral}</strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Proteção Diferencial (IDR):</span>
                <strong style={{ color: 'var(--status-success)' }}>{resQdc.idrRecomendado}</strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Proteção contra Surtos:</span>
                <strong>{resQdc.dpsRecomendado}</strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ramal Entrada / Terra:</span>
                <strong>{resQdc.caboEntradaAterramentoMm2}</strong>
              </div>
              <div className="mobile-stack-row">
                <span style={{ color: 'var(--text-secondary)' }}>Quadro QDC (c/ Reserva NBR):</span>
                <strong>
                  {resQdc.quadroDistribuicaoSugerido} (+{resQdc.reservaObrigatoriaNbr5410})
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 5: CALIBRAÇÃO DE FIOS POR PADRÃO DE CASA & FEEDBACK PÓS-OBRA (IA) */}
      {abaAtiva === 'CALIBRACAO_FIOS' && (() => {
        const areaNum = Math.max(20, Number(areaCasaM2) || 120);
        const coefs: Record<string, { nome: string; c15: number; c25: number; c40: number; c60: number }> = {
          CASA_POPULAR_TERREA: { nome: 'Casa Térrea Popular / Forro PVC', c15: 1.35, c25: 2.1, c40: 0.65, c60: 0.45 },
          CASA_PADRAO_MEDIO_LAJE: { nome: 'Casa Padrão Médio com Laje', c15: 1.6, c25: 2.55, c40: 0.95, c60: 0.55 },
          SOBRADO_ALTO_PADRAO: { nome: 'Sobrado / Alto Padrão (2 QDCs)', c15: 1.95, c25: 3.1, c40: 1.35, c60: 0.75 },
          APARTAMENTO_DRYWALL: { nome: 'Apartamento / Forro Gesso Drywall', c15: 1.25, c25: 1.95, c40: 0.85, c60: 0.4 }
        };
        const atual = coefs[padraoCasa] || coefs.CASA_PADRAO_MEDIO_LAJE;
        const m15 = Math.ceil(areaNum * atual.c15 * fatorIaSalvo);
        const m25 = Math.ceil(areaNum * atual.c25 * fatorIaSalvo);
        const m40 = Math.ceil(areaNum * atual.c40 * fatorIaSalvo);
        const m60 = Math.ceil(areaNum * atual.c60 * fatorIaSalvo);
        const totalM = m15 + m25 + m40 + m60;

        const enviarFeedbackIa = async (e: React.FormEvent) => {
          e.preventDefault();
          const d = Math.abs(Number(deltaMetros) || 0);
          let novoF = fatorIaSalvo;
          if (statusFeedback === 'FALTOU_FIO' && totalM > 0) {
            const razao = Math.min(1.15, (totalM + d) / totalM);
            novoF = Number(((0.85 * fatorIaSalvo) + (0.15 * fatorIaSalvo * razao)).toFixed(3));
          } else if (statusFeedback === 'SOBROU_FIO' && totalM > 0) {
            const razao = Math.max(0.85, (totalM - d) / totalM);
            novoF = Number(((0.85 * fatorIaSalvo) + (0.15 * fatorIaSalvo * razao)).toFixed(3));
          }
          setFatorIaSalvo(novoF);
          localStorage.setItem('mygo_fator_ia_fios', String(novoF));
          try {
            await httpClient.post(`${environment.apiMateriaisUrl}/api/materiais/eletrotecnica/calibracao-fios`, {
              padraoCasa,
              areaM2: areaNum,
              statusFeedback,
              deltaMetros: d,
              fatorAtual: fatorIaSalvo,
              comentario: comentarioObra
            });
          } catch {
            // Salvo localmente e calibrado
          }
          setMsgFeedbackIa(
            `✓ IA Calibrada! Novo coeficiente para ${atual.nome}: x${novoF} (baseado no seu feedback de obra).`
          );
          setComentarioObra('');
        };

        return (
          <div className="app-card">
            <div className="app-form-group">
              <label className="app-label">Padrão Construtivo do Imóvel</label>
              <select
                className="app-select"
                value={padraoCasa}
                onChange={(e) => {
                  setPadraoCasa(e.target.value);
                  setMsgFeedbackIa('');
                }}
              >
                <option value="CASA_POPULAR_TERREA">Casa Popular Térrea / MCMV (Forro PVC)</option>
                <option value="CASA_PADRAO_MEDIO_LAJE">Casa Térrea Padrão Médio (Laje Embutida)</option>
                <option value="SOBRADO_ALTO_PADRAO">Sobrado / Alto Padrão (Pé-Direito Duplo)</option>
                <option value="APARTAMENTO_DRYWALL">Apartamento / Gesso Acartonado (Drywall)</option>
              </select>
            </div>

            <div className="app-form-group">
              <label className="app-label">Área Construída (m²)</label>
              <input
                type="number"
                inputMode="decimal"
                className="app-input"
                value={areaCasaM2}
                onChange={(e) => setAreaCasaM2(e.target.value)}
              />
            </div>

            <div
              style={{
                padding: '0.95rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span className="app-badge app-badge-amber">PRÉ-DEFINIÇÃO CALIBRADA (x{fatorIaSalvo})</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total: {totalM}m</span>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cabo 1,5 mm² (Iluminação):</span>
                <strong>{m15} m ({(m15 / 100).toFixed(1)} rolos)</strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cabo 2,5 mm² (Tomadas TUG):</span>
                <strong style={{ color: 'var(--accent-primary)' }}>{m25} m ({(m25 / 100).toFixed(1)} rolos)</strong>
              </div>
              <div className="mobile-stack-row" style={{ marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cabo 4,0 mm² (Cozinha / Ar Split):</span>
                <strong>{m40} m ({(m40 / 100).toFixed(1)} rolos)</strong>
              </div>
              <div className="mobile-stack-row">
                <span style={{ color: 'var(--text-secondary)' }}>Cabo 6,0 mm² (Chuveiros 220V):</span>
                <strong>{m60} m ({(m60 / 100).toFixed(1)} rolos)</strong>
              </div>
            </div>

            <form onSubmit={enviarFeedbackIa}>
              <span className="app-label" style={{ marginBottom: '0.45rem' }}>
                Feedback Pós-Obra (Ensinar a IA Regional)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${statusFeedback === 'BATEU_EXATO' ? 'app-btn-primary' : 'app-btn-secondary'}`}
                  onClick={() => setStatusFeedback('BATEU_EXATO')}
                >
                  ✓ Bateu
                </button>
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${statusFeedback === 'FALTOU_FIO' ? 'app-btn-primary' : 'app-btn-secondary'}`}
                  onClick={() => setStatusFeedback('FALTOU_FIO')}
                >
                  + Faltou Fio
                </button>
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${statusFeedback === 'SOBROU_FIO' ? 'app-btn-primary' : 'app-btn-secondary'}`}
                  onClick={() => setStatusFeedback('SOBROU_FIO')}
                >
                  - Sobrou Fio
                </button>
              </div>

              {statusFeedback !== 'BATEU_EXATO' && (
                <div className="app-form-group">
                  <label className="app-label">
                    Quantos metros {statusFeedback === 'FALTOU_FIO' ? 'faltaram' : 'sobraram'} na obra?
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className="app-input"
                    value={deltaMetros}
                    onChange={(e) => setDeltaMetros(e.target.value)}
                  />
                </div>
              )}

              <div className="app-form-group">
                <label className="app-label">Observação da Obra (Opcional)</label>
                <input
                  type="text"
                  className="app-input"
                  placeholder="Ex: Laje com pé-direito alto exigiu mais descidas de 2,5mm²"
                  value={comentarioObra}
                  onChange={(e) => setComentarioObra(e.target.value)}
                />
              </div>

              <button type="submit" className="app-btn app-btn-primary" style={{ width: '100%' }}>
                <span className="material-icons">psychology</span>
                <span>Registrar Feedback e Calibrar IA</span>
              </button>
            </form>

            {msgFeedbackIa && (
              <p
                style={{
                  marginTop: '0.85rem',
                  padding: '0.7rem',
                  borderRadius: '8px',
                  background: 'var(--status-success-bg)',
                  border: '1px solid var(--status-success-border)',
                  color: 'var(--status-success)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              >
                {msgFeedbackIa}
              </p>
            )}
          </div>
        );
      })()}

      {/* ABA 6: CONSULTOR MULTI-AGENTES PROTEGIDOS POR ESCOPO (NR-10, REGIONAL UF E PROPOSTA) */}
      {abaAtiva === 'MULTI_AGENTES' && (() => {
        const consultarAgente = async (e: React.FormEvent) => {
          e.preventDefault();
          const areaNum = Math.max(20, Number(areaCasaM2) || 120);
          const valProp = Number(valorPropostaAgente) || 3850;
          setCalculando(true);
          try {
            const apiRes = await httpClient.post<any>(
              `${environment.apiMateriaisUrl}/api/materiais/eletrotecnica/consultar-agente`,
              {
                agente: agenteSelecionado,
                contexto: contextoAgente,
                uf: ufAgente,
                cidade: cidadeAgente,
                areaM2: areaNum,
                valorProposta: valProp
              }
            );
            setResAgente(apiRes);
          } catch {
            const s = contextoAgente.toLowerCase();
            if (agenteSelecionado === 'AGENTE_DIAGNOSTICO_NR10') {
              const ehIdr = s.includes('idr') || s.includes('dr') || s.includes('fuga');
              setResAgente({
                agenteAcionado: 'AGENTE_DIAGNOSTICO_NR10',
                escopoRbac: 'SCOPE_SAFETY_DIAGNOSTICS',
                diagnostico: ehIdr
                  ? 'Atuação do IDR (30mA) por corrente de fuga à terra ou neutro compartilhado entre circuitos.'
                  : 'Sobrecarga térmica (Ib > In) ou mal contato em borne provocando aquecimento/desarme.',
                passosCampo: ehIdr
                  ? [
                      '1. Desligue todos os disjuntores terminais e rearme o IDR para testar o barramento.',
                      '2. Ligue um disjuntor por vez até achar o circuito com fuga.',
                      '3. Verifique se dois circuitos compartilham o mesmo neutro.'
                    ]
                  : [
                      '1. Meça a corrente real com alicate amperímetro e compare com Iz do cabo.',
                      '2. Reaperte os bornes e aplique terminal tubular (ilhós) nos cabos flexíveis.'
                    ],
                checklistNr10: [
                  '1. Seccionamento do circuito',
                  '2. Bloqueio mecânico LOTO',
                  '3. Constatação de ausência de tensão (F-N e F-T)',
                  '4. Sinalização do QDC'
                ]
              });
            } else if (agenteSelecionado === 'AGENTE_GEOLOCALIZACAO') {
              const tensao220 = !['SP', 'RJ', 'MG'].includes(ufAgente.toUpperCase());
              const m2Val = ufAgente.toUpperCase() === 'SP' ? 58 : ufAgente.toUpperCase() === 'GO' ? 50 : 45;
              setResAgente({
                agenteAcionado: 'AGENTE_GEOLOCALIZACAO',
                escopoRbac: 'SCOPE_GEO_PRICING',
                regiaoAnalisada: `${cidadeAgente}/${ufAgente.toUpperCase()}`,
                concessionaria:
                  ufAgente.toUpperCase() === 'TO'
                    ? 'Energisa Tocantins'
                    : ufAgente.toUpperCase() === 'GO'
                      ? 'Equatorial Goiás'
                      : `Concessionária ${ufAgente.toUpperCase()}`,
                tensaoPadrao: tensao220 ? '220V (Fase-Neutro) / 380V' : '127V (Fase-Neutro) / 220V',
                faixaJustaMaoDeObraM2: `R$ ${m2Val},00/m² (Com Infra) | Estimativa p/ ${areaNum}m²: R$ ${(areaNum * m2Val).toFixed(2)}`,
                notaRegional: tensao220
                  ? 'Rede 220V F-N: chuveiro 5500W = 25A (Cabo 4,0mm² + Disjuntor 32A).'
                  : 'Rede 127V/220V: chuveiros e ar split devem usar circuito 220V Bifásico (Fase+Fase) com disjuntor Bipolar.'
              });
            } else {
              setResAgente({
                agenteAcionado: 'AGENTE_AUDITOR_PROPOSTA',
                escopoRbac: 'SCOPE_PROPOSAL_AUDITOR',
                textoArgumentacaoCliente: `Olá! Sua proposta técnica para o imóvel de ${areaNum}m² (R$ ${valProp.toFixed(2)}) segue 100% a Norma ABNT NBR 5410: garante circuitos independentes sem aquecimento na fiação, proteção IDR 30mA contra choques, DPS contra surtos/raios e lista de cabos calibrada sem desperdício.`
              });
            }
          } finally {
            setCalculando(false);
          }
        };

        return (
          <div className="app-card">
            <div className="app-form-group">
              <label className="app-label">Selecione o Agente Especializado (Rota Isolada RBAC)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${
                    agenteSelecionado === 'AGENTE_DIAGNOSTICO_NR10'
                      ? 'app-btn-primary'
                      : 'app-btn-secondary'
                  }`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    setAgenteSelecionado('AGENTE_DIAGNOSTICO_NR10');
                    setResAgente(null);
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>
                    health_and_safety
                  </span>
                  <span>Agente 4: Diagnóstico de Panes &amp; Checklist NR-10</span>
                </button>

                <button
                  type="button"
                  className={`app-btn app-btn-sm ${
                    agenteSelecionado === 'AGENTE_GEOLOCALIZACAO'
                      ? 'app-btn-primary'
                      : 'app-btn-secondary'
                  }`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    setAgenteSelecionado('AGENTE_GEOLOCALIZACAO');
                    setResAgente(null);
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>
                    public
                  </span>
                  <span>Agente 2: Geolocalização, Concessionária &amp; Preço/m² por UF</span>
                </button>

                <button
                  type="button"
                  className={`app-btn app-btn-sm ${
                    agenteSelecionado === 'AGENTE_AUDITOR_PROPOSTA'
                      ? 'app-btn-primary'
                      : 'app-btn-secondary'
                  }`}
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    setAgenteSelecionado('AGENTE_AUDITOR_PROPOSTA');
                    setResAgente(null);
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>
                    verified
                  </span>
                  <span>Agente 5: Argumentação Técnica NBR 5410 p/ Fechar Cliente</span>
                </button>
              </div>
            </div>

            <form onSubmit={consultarAgente}>
              {agenteSelecionado === 'AGENTE_DIAGNOSTICO_NR10' && (
                <div className="app-form-group">
                  <label className="app-label">Sintoma ou Defeito na Obra</label>
                  <select
                    className="app-select"
                    value={contextoAgente}
                    onChange={(e) => setContextoAgente(e.target.value)}
                  >
                    <option value="IDR 30mA desarmando ao ligar chuveiro">
                      IDR 30mA desarmando (Fuga à Terra / Neutro Compartilhado)
                    </option>
                    <option value="Cabo aquecendo e cheiro de queimado no QDC">
                      Cabo ou disjuntor aquecendo no QDC (Efeito Joule / Borne)
                    </option>
                    <option value="Disjuntor desarmando apos 10 minutos">
                      Disjuntor caindo após alguns minutos (Sobrecarga vs. Curto)
                    </option>
                  </select>
                </div>
              )}

              {agenteSelecionado === 'AGENTE_GEOLOCALIZACAO' && (
                <div className="app-grid-2" style={{ gap: '0.65rem' }}>
                  <div className="app-form-group">
                    <label className="app-label">Estado (UF)</label>
                    <input
                      type="text"
                      maxLength={2}
                      className="app-input"
                      value={ufAgente}
                      onChange={(e) => setUfAgente(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="app-form-group">
                    <label className="app-label">Cidade</label>
                    <input
                      type="text"
                      className="app-input"
                      value={cidadeAgente}
                      onChange={(e) => setCidadeAgente(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {agenteSelecionado === 'AGENTE_AUDITOR_PROPOSTA' && (
                <div className="app-grid-2" style={{ gap: '0.65rem' }}>
                  <div className="app-form-group">
                    <label className="app-label">Área da Obra (m²)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="app-input"
                      value={areaCasaM2}
                      onChange={(e) => setAreaCasaM2(e.target.value)}
                    />
                  </div>
                  <div className="app-form-group">
                    <label className="app-label">Valor da Proposta (R$)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      className="app-input"
                      value={valorPropostaAgente}
                      onChange={(e) => setValorPropostaAgente(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="app-btn app-btn-primary" style={{ width: '100%' }}>
                <span className="material-icons">smart_toy</span>
                <span>Acionar Agente Protegido</span>
              </button>
            </form>

            {resAgente && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.95rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                  <span className="app-badge app-badge-amber">{resAgente.agenteAcionado}</span>
                  <span className="app-badge app-badge-muted">{resAgente.escopoRbac}</span>
                </div>

                {resAgente.diagnostico && (
                  <>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      {resAgente.diagnostico}
                    </p>
                    <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
                      {(resAgente.passosCampo || []).map((p: string, i: number) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{p}</li>
                      ))}
                    </ul>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>
                        ✓ Checklist NR-10 Obrigatório:
                      </strong>
                      <ul style={{ paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {(resAgente.checklistNr10 || []).map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {resAgente.concessionaria && (
                  <>
                    <div className="mobile-stack-row" style={{ marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Concessionária:</span>
                      <strong>{resAgente.concessionaria} ({resAgente.regiaoAnalisada})</strong>
                    </div>
                    <div className="mobile-stack-row" style={{ marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tensão Nominal:</span>
                      <strong style={{ color: 'var(--accent-primary)' }}>{resAgente.tensaoPadrao}</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--status-success)', fontWeight: 700, marginTop: '0.4rem' }}>
                      {resAgente.faixaJustaMaoDeObraM2}
                    </p>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {resAgente.notaRegional}
                    </p>
                  </>
                )}

                {resAgente.textoArgumentacaoCliente && (
                  <>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                      "{resAgente.textoArgumentacaoCliente}"
                    </p>
                    <button
                      type="button"
                      className="app-btn app-btn-secondary app-btn-sm"
                      style={{ width: '100%', marginTop: '0.65rem' }}
                      onClick={() => {
                        navigator.clipboard?.writeText(resAgente.textoArgumentacaoCliente);
                        alert('✓ Argumentação técnica copiada para enviar no WhatsApp do cliente!');
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '15px' }}>
                        content_copy
                      </span>
                      <span>Copiar Texto para WhatsApp do Cliente</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
