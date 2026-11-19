import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { httpClient } from '../../core/httpClient';
import { authService } from '../../core/services/authService';
import { environment } from '../../config/environment';
import { useDebounce } from '../../core/hooks/useDebounce';
import { SkeletonList } from '../../components/Skeleton';
import './ParceirosPage.css';

export interface ParceiroEletricista {
  id: string;
  nome: string;
  tenantId: string;
  regiao: string;
  estado?: string;
  cidade?: string;
  bairro?: string;
  avaliacao: number;
  totalAvaliacoes: number;
  especialidades: string[];
  inicianteDestaque: boolean;
  tempoResposta: string;
  fotoUrl?: string;
  seloNbr: boolean;
}

const REGIOES_DISPONIVEIS = [
  'TODAS',
  'Plano Diretor Sul',
  'Plano Diretor Norte',
  'Taquaralto e Região Sul',
  'Jardim Aureny e Região'
];

export const ParceirosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filtroRegiao, setFiltroRegiao] = useState<string>('TODAS');
  const [buscaNome, setBuscaNome] = useState<string>('');
  const buscaDebounced = useDebounce(buscaNome, 400);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [listaParceiros, setListaParceiros] = useState<ParceiroEletricista[]>([]);
  const [refVinculado, setRefVinculado] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const refUrl = searchParams.get('ref');
    const refSalvo = localStorage.getItem('ref_eletricista_vinculado');
    const ativo = refUrl || refSalvo;
    if (ativo) {
      setRefVinculado(ativo);
      localStorage.setItem('ref_eletricista_vinculado', ativo);
      localStorage.setItem('tenant_eletricista', ativo);
    }
    carregarParceirosApi();
  }, [searchParams]);

  const carregarParceirosApi = async () => {
    setCarregando(true);
    try {
      const apiUrl = `${environment.apiAuthUrl}/auth/parceiros-destaque`;
      const dados = await httpClient.get<ParceiroEletricista[]>(apiUrl);
      setListaParceiros(dados && dados.length > 0 ? dados : []);
    } catch {
      setListaParceiros([]);
    } finally {
      setCarregando(false);
    }
  };

  // M3-04: Fórmula auditável de Recomendação Anti-Panelinha (Proximidade + Nota Média + Bônus de Novato)
  const calcularScoreAntiPanelinha = (p: ParceiroEletricista): number => {
    const clienteCidade = (localStorage.getItem('cliente_cidade') || 'Palmas').toLowerCase();
    const clienteBairro = (localStorage.getItem('cliente_bairro') || '').toLowerCase();
    const clienteUf = (localStorage.getItem('cliente_uf') || 'TO').toLowerCase();

    let scoreProximidade = 0;
    if (clienteBairro && (p.bairro || '').toLowerCase().includes(clienteBairro)) {
      scoreProximidade += 40;
    }
    if (clienteCidade && (p.cidade || '').toLowerCase().includes(clienteCidade)) {
      scoreProximidade += 25;
    }
    if (clienteUf && (p.estado || '').toLowerCase() === clienteUf) {
      scoreProximidade += 10;
    }

    const scoreAvaliacao = (p.avaliacao || 5.0) * 10;
    const qtdServicos = p.totalAvaliacoes || 0;
    const bonusNovato = p.inicianteDestaque || qtdServicos < 5 ? 25 : qtdServicos <= 10 ? 12 : 0;

    return scoreProximidade + scoreAvaliacao + bonusNovato;
  };

  const parceirosFiltrados = React.useMemo(() => {
    let lista = listaParceiros;

    // M3-03: Regra de Ouro do Vínculo — se veio por ?ref=, jamais exibe concorrentes
    if (refVinculado) {
      const vinculados = lista.filter(
        (p) =>
          p.id === refVinculado ||
          p.tenantId.toLowerCase() === refVinculado.toLowerCase() ||
          p.nome.toLowerCase().includes(refVinculado.toLowerCase())
      );
      if (vinculados.length > 0) {
        return vinculados;
      }
    }

    if (filtroRegiao !== 'TODAS') {
      const regTerm = filtroRegiao.toLowerCase();
      lista = lista.filter(
        (p) =>
          (p.regiao || '').toLowerCase().includes(regTerm) ||
          (p.bairro || '').toLowerCase().includes(regTerm) ||
          (p.cidade || '').toLowerCase().includes(regTerm)
      );
    }
    if (buscaDebounced.trim()) {
      const termo = buscaDebounced.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          (p.regiao || '').toLowerCase().includes(termo) ||
          (p.bairro || '').toLowerCase().includes(termo) ||
          (p.cidade || '').toLowerCase().includes(termo) ||
          (p.estado || '').toLowerCase().includes(termo) ||
          (p.especialidades || []).some((e) => e.toLowerCase().includes(termo))
      );
    }
    return [...lista].sort((a, b) => calcularScoreAntiPanelinha(b) - calcularScoreAntiPanelinha(a));
  }, [listaParceiros, filtroRegiao, buscaDebounced, refVinculado]);

  const selecionarEletricista = (eletricista: ParceiroEletricista) => {
    localStorage.setItem('tenant_eletricista', eletricista.tenantId);
    localStorage.setItem('nome_eletricista', eletricista.nome);
    localStorage.setItem('regiao_eletricista', eletricista.regiao);
    navigate('/quiz');
  };

  const handleVoltar = () => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard-main');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="parceiros-container">
      <header className="parceiros-appbar">
        <button
          type="button"
          className="parceiros-back-btn"
          onClick={handleVoltar}
          aria-label="Voltar ao painel"
        >
          <span className="material-icons">arrow_back_ios_new</span>
          <span>Voltar</span>
        </button>
        <div className="parceiros-appbar-title">
          <span className="parceiros-appbar-main">Eletricistas por Perto</span>
          <span className="parceiros-appbar-sub">Palmas/TO • NBR 5410</span>
        </div>
        <div className="parceiros-appbar-badge">⚡ MYGO</div>
      </header>

      <section className="parceiros-Controls">
        <div className="parceiros-search-box">
          <span className="material-icons parceiros-search-icon">search</span>
          <input
            type="search"
            className="app-input parceiros-search-input"
            placeholder="Buscar eletricista, bairro ou serviço..."
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
          />
        </div>

        <div className="filtro-scroll-row" role="tablist" aria-label="Filtro por região">
          {REGIOES_DISPONIVEIS.map((regiao) => (
            <button
              key={regiao}
              type="button"
              className={`btn-filtro ${filtroRegiao === regiao ? 'ativo' : ''}`}
              onClick={() => setFiltroRegiao(regiao)}
            >
              {regiao === 'TODAS' ? '📍 Todas as Regiões' : regiao}
            </button>
          ))}
        </div>
      </section>

      <main className="parceiros-grid">
        {carregando && (
          <div style={{ gridColumn: '1 / -1' }}>
            <SkeletonList rows={3} height="160px" />
          </div>
        )}

        {!carregando && parceirosFiltrados.length === 0 && (
          <div className="estado-vazio">
            <span className="material-icons estado-icon">engineering</span>
            <h3>Nenhum eletricista cadastrado ainda</h3>
            <p>Assim que profissionais se cadastrarem na plataforma, eles aparecerão aqui.</p>
          </div>
        )}

        {!carregando &&
          parceirosFiltrados.map((prof) => (
            <div key={prof.id || prof.tenantId} className="card-parceiro break-words">
              <div className="card-badges">
                {prof.inicianteDestaque && (
                  <span className="badge-novo">✨ NOVO PARCEIRO DESTAQUE</span>
                )}
                {prof.seloNbr && <span className="badge-nbr">✓ SELO NBR 5410</span>}
              </div>

              <div className="perfil-topo">
                <div className="avatar-box">
                  <span className="material-icons avatar-icon">engineering</span>
                </div>
                <div className="info-nome">
                  <h3 className="nome-prof break-words">{prof.nome}</h3>
                  <span className="regiao-prof">
                    <span className="material-icons pin-icon">place</span> {prof.regiao}
                  </span>
                </div>
              </div>

              <div className="metricas-box">
                <div className="metrica-item">
                  <span className="nota-estrelas">⭐ {(prof.avaliacao || 5).toFixed(1)}</span>
                  <span className="metrica-desc">({prof.totalAvaliacoes || 0} avaliações)</span>
                </div>
                <div className="metrica-divider" />
                <div className="metrica-item">
                  <span className="tempo-resp">{prof.tempoResposta || 'Rápido'}</span>
                  <span className="metrica-desc">tempo de resposta</span>
                </div>
              </div>

              <div className="especialidades-box">
                {(prof.especialidades || []).map((esp, i) => (
                  <span key={i} className="tag-esp">
                    {esp}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="btn-selecionar"
                onClick={() => selecionarEletricista(prof)}
              >
                <span>Solicitar Orçamento com {(prof.nome || 'Parceiro').split(' ')[0]}</span>
                <span className="material-icons">arrow_forward</span>
              </button>
            </div>
          ))}
      </main>

      <footer className="parceiros-footer">
        <div className="footer-card">
          <span className="material-icons footer-icon">storefront</span>
          <div>
            <h4>Parceria de Fornecimento com a Capital Elétrica de Palmas</h4>
            <p>
              Todos os materiais orçados pelos nossos parceiros contam com condições especiais e
              cotação direta no balcão da Capital Elétrica.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
