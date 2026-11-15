import { httpClient } from '../httpClient';
import { environment } from '../../config/environment';

const URL_MATERIAIS = `${environment.apiMateriaisUrl}/api/materiais`;
const URL_ORCAMENTOS_BASE = `${environment.apiCalculadoraUrl}/v1/orcamentos`;

export interface ItemMaterialConsolidado {
  descricao: string;
  quantidade: number;
  unidade: string;
}

export const materialService = {
  async getOrcamentoPorId(orcamentoId: string): Promise<any> {
    const idLimpo = String(orcamentoId).trim();
    return httpClient.get<any>(`${URL_ORCAMENTOS_BASE}/${idLimpo}`);
  },

  async getOrcamentoPublico(orcamentoId: string): Promise<any> {
    const idLimpo = String(orcamentoId).trim();
    return httpClient.get<any>(`${URL_ORCAMENTOS_BASE}/publico/${idLimpo}`);
  },

  async responderPropostaPublica(orcamentoId: string, aceitar: boolean): Promise<any> {
    const idLimpo = String(orcamentoId).trim();
    return httpClient.post<any>(
      `${URL_ORCAMENTOS_BASE}/publico/${idLimpo}/aceitar?aceitar=${aceitar}`,
      {}
    );
  },

  async gerarLevantamento(dados: any): Promise<any> {
    return httpClient.post<any>(`${URL_MATERIAIS}/gerar`, dados);
  },

  async getDetalhesMaterial(orcamentoId: string): Promise<any> {
    const idLimpo = String(orcamentoId).trim();
    return httpClient.get<any>(`${URL_MATERIAIS}/detalhes/${idLimpo}`);
  },

  /**
   * M2-03: Consolida itens iguais somando quantidades e garantindo valores >= 0 sem duplicar linhas
   */
  consolidarMateriaisSemDuplicar(itens: any[]): ItemMaterialConsolidado[] {
    const mapa = new Map<string, ItemMaterialConsolidado>();

    (itens || []).forEach((item) => {
      const descOriginal = String(item?.descricao || '').trim();
      if (!descOriginal) return;

      const unidade = String(item?.unidade || 'UN').trim().toUpperCase();
      const chave = `${descOriginal.toLowerCase()}__${unidade.toLowerCase()}`;
      const qtd = Math.max(0, Number(item?.quantidade || 0));

      if (mapa.has(chave)) {
        const atual = mapa.get(chave)!;
        atual.quantidade = Math.max(0, atual.quantidade + qtd);
      } else {
        mapa.set(chave, {
          descricao: descOriginal,
          quantidade: qtd,
          unidade
        });
      }
    });

    return Array.from(mapa.values()).filter((i) => i.quantidade > 0);
  },

  /**
   * M2-04: Registra o log de cotação no banco antes de abrir o WhatsApp da distribuidora do Tenant
   */
  async registrarLogCotacaoEAbrirWhatsApp(params: {
    orcamentoId?: string | null;
    clienteNome: string;
    itens: any[];
    mensagemCustomizada?: string;
  }): Promise<void> {
    const itensConsolidados = this.consolidarMateriaisSemDuplicar(params.itens || []);
    const nomeProfissional =
      localStorage.getItem('userName') ||
      localStorage.getItem('nome_eletricista') ||
      'Eletricista Parceiro';
    const profissionalId = localStorage.getItem('userEmail') || 'profissional-local';
    const tenantId =
      localStorage.getItem('userTenantId') ||
      localStorage.getItem('tenant_eletricista') ||
      profissionalId;
    const cidade = localStorage.getItem('regiao_eletricista') || 'Palmas/TO';

    const telefoneDistribuidora =
      localStorage.getItem('tenant_distribuidora_whatsapp') ||
      environment.distribuidoraPadraoWhatsApp;
    const nomeDistribuidora =
      localStorage.getItem('tenant_distribuidora_nome') || environment.distribuidoraPadraoNome;

    // 1. Grava o log de intenção de cotação no banco (API Materiais 8082)
    try {
      await httpClient.post(`${URL_MATERIAIS}/cotacao-log`, {
        profissionalId,
        nomeProfissional,
        tenantId,
        cidade,
        orcamentoId: params.orcamentoId || null,
        clienteNome: params.clienteNome || 'Cliente',
        distribuidoraDestino: nomeDistribuidora,
        itensJson: JSON.stringify(itensConsolidados)
      });
    } catch {
      // Fallback em localStorage para auditoria caso offline
      const logsLocais = JSON.parse(localStorage.getItem('mygo_cotacao_logs_offline') || '[]');
      logsLocais.unshift({
        profissionalId,
        nomeProfissional,
        tenantId,
        cidade,
        orcamentoId: params.orcamentoId || null,
        clienteNome: params.clienteNome,
        distribuidoraDestino: nomeDistribuidora,
        itens: itensConsolidados,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('mygo_cotacao_logs_offline', JSON.stringify(logsLocais.slice(0, 50)));
    }

    // 2. Monta mensagem limpa e consolidada sem itens duplicados
    let msg = params.mensagemCustomizada;
    if (!msg) {
      msg = `⚡ *SOLICITAÇÃO DE COTAÇÃO — ${nomeDistribuidora.toUpperCase()}*\n`;
      msg += `Profissional: *${nomeProfissional}*\n`;
      msg += `Obra / Cliente: *${params.clienteNome || 'Cliente'}* (${cidade})\n`;
      msg += `-------------------------------------------\n`;
      msg += `*LISTA CONSOLIDADA DE MATERIAIS (NBR 5410):*\n`;

      if (itensConsolidados.length > 0) {
        itensConsolidados.forEach((item) => {
          msg += `• *${item.quantidade} ${item.unidade}* — ${item.descricao}\n`;
        });
      } else {
        msg += `• Cabos Flexíveis antichama 2.5mm² e 6.0mm²\n`;
        msg += `• Disjuntores DIN Curva C e Disjuntor Geral\n`;
        msg += `• Dispositivo DPS 20kA + IDR 40A 30mA\n`;
        msg += `• Eletrodutos corrugados e caixas 4x2\n`;
      }

      msg += `-------------------------------------------\n`;
      msg += `Solicito cotação e condições de entrega/retirada para este projeto.`;
    }

    const numeroLimpo = String(telefoneDistribuidora).replace(/\D/g, '');
    window.open(`https://wa.me/${numeroLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};
