import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '../../core/httpClient';
import { useDebounce } from '../../core/hooks/useDebounce';
import { SkeletonList } from '../../components/Skeleton';
import './ParceirosPage.css';

export interface ParceiroEletricista {
  id: string;
  nome: string;
  tenantId: string;
  regiao: string;
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
  const [filtroRegiao, setFiltroRegiao] = useState<string>('TODAS');
  const [buscaNome, setBuscaNome] = useState<string>('');
  const buscaDebounced = useDebounce(buscaNome, 400);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [listaParceiros, setListaParceiros] = useState<ParceiroEletricista[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    carregarParceirosApi();
  }, []);

  const carregarParceirosApi = async () => {
    setCarregando(true);
    try {
      const apiUrl = 'https://api.comandosamoris.tech/auth/parceiros-destaque';
      const dados = await httpClient.get<ParceiroEletricista[]>(apiUrl);
      setListaParceiros(dados && dados.length > 0 ? dados : []);
    } catch {
      setListaParceiros([]);
    } finally {
      setCarregando(false);
    }
  };

  const parceirosFiltrados = React.useMemo(() => {
    let lista = listaParceiros;
    if (filtroRegiao !== 'TODAS') {
      lista = lista.filter((p) => p.regiao === filtroRegiao);
    }
    if (buscaDebounced.trim()) {
      const termo = buscaDebounced.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          (p.especialidades || []).some((e) => e.toLowerCase().includes(termo))
      );
    }
    return [...lista].sort((a, b) => {
      if (a.inicianteDestaque && !b.inicianteDestaque) return -1;
      if (!a.inicianteDestaque && b.inicianteDestaque) return 1;
      return (b.avaliacao || 0) - (a.avaliacao || 0);
    });
  }, [listaParceiros, filtroRegiao, buscaDebounced]);

  const selecionarEletricista = (eletricista: ParceiroEletricista) => {
    localStorage.setItem('tenant_eletricista', eletricista.tenantId);
    localStorage.setItem('nome_eletricista', eletricista.nome);
    localStorage.setItem('regiao_eletricista', eletricista.regiao);
    navigate('/quiz');
  };

  return (
    <div className="parceiros-container">
      <header className="parceiros-header">
        <div className="header-top">
          <button
            type="button"
            className="app-btn app-btn-secondary"
            onClick={() => navigate('/onboarding')}
          >
            <span className="material-icons">arrow_back</span>
            <span>Voltar</span>
          </button>
          <div className="badge-app">⚡ MYGO • REDE DE PROFISSIONAIS PARCEIROS</div>
        </div>

        <h1 className="titulo-principal">Escolha o Eletricista Ideal para sua Obra</h1>
        <p className="subtitulo">
          Selecione um profissional certificado para dimensionar seu projeto pela{' '}
          <strong>Norma ABNT NBR 5410</strong>. Rotacionamos novos parceiros qualificados de
          Palmas/TO para garantir atendimento rápido e sem filas.
        </p>

        {/* Busca com debounce de 400ms */}
        <div style={{ maxWidth: '460px', margin: '0 auto 1.25rem auto' }}>
          <input
            type="search"
            className="app-input"
            placeholder="Buscar profissional ou especialidade..."
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
          />
        </div>

        <div className="filtro-container">
          <span className="filtro-label">
            <span className="material-icons">location_on</span> Região em Palmas:
          </span>
          <div className="filtro-botoes">
            {REGIOES_DISPONIVEIS.map((regiao) => (
              <button
                key={regiao}
                type="button"
                className={`btn-filtro ${filtroRegiao === regiao ? 'ativo' : ''}`}
                onClick={() => setFiltroRegiao(regiao)}
              >
                {regiao}
              </button>
            ))}
          </div>
        </div>
      </header>

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
