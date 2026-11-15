import { httpClient } from '../httpClient';
import { environment } from '../../config/environment';
import { materialService } from './materialService';

const URL_ORCAMENTOS = `${environment.apiCalculadoraUrl}/v1/orcamentos`;
const URL_ADMIN = `${environment.apiCalculadoraUrl}/v1/admin`;
const URL_DASHBOARD = `${environment.apiCalculadoraUrl}/api/v1/dashboard`;

export const apiService = {
  async gerarOrcamento(quiz: any): Promise<any> {
    const payload = { ...quiz, dataProcessamento: new Date().toLocaleDateString('pt-BR') };
    return httpClient.post(`${URL_ORCAMENTOS}/gerar-quiz`, payload);
  },

  async getConfig(): Promise<any> {
    const cfg = await httpClient.get<any>(`${URL_ADMIN}/config`);
    if (cfg?.telefoneDistribuidora) {
      localStorage.setItem('tenant_distribuidora_whatsapp', cfg.telefoneDistribuidora);
    }
    if (cfg?.nomeDistribuidora) {
      localStorage.setItem('tenant_distribuidora_nome', cfg.nomeDistribuidora);
    }
    return cfg;
  },

  async updatePrecos(config: any): Promise<any> {
    if (config?.telefoneDistribuidora) {
      localStorage.setItem('tenant_distribuidora_whatsapp', config.telefoneDistribuidora);
    }
    if (config?.nomeDistribuidora) {
      localStorage.setItem('tenant_distribuidora_nome', config.nomeDistribuidora);
    }
    return httpClient.put(`${URL_ADMIN}/config`, config);
  },

  async listarServicosExtras(): Promise<any[]> {
    return httpClient.get<any[]>(`${URL_ADMIN}/servicos-extras`);
  },

  async getServicosExtras(): Promise<any[]> {
    return this.listarServicosExtras();
  },

  async adicionarServicoExtra(servico: any): Promise<any> {
    return httpClient.post(`${URL_ADMIN}/servicos-extras`, servico);
  },

  async deletarServicoExtra(id: number): Promise<any> {
    return httpClient.delete(`${URL_ADMIN}/servicos-extras/${id}`);
  },

  async getDadosDashboard(): Promise<any> {
    return httpClient.get(`${URL_DASHBOARD}/stats`);
  },

  gerarMensagemCapitalEletrica(nomeCliente: string, itensMateriais: any[]): string {
    const itensConsolidados = materialService.consolidarMateriaisSemDuplicar(itensMateriais || []);
    const nomeProfissional =
      localStorage.getItem('userName') ||
      localStorage.getItem('userNome') ||
      localStorage.getItem('nome_eletricista') ||
      'Eletricista Parceiro';
    const regiao = localStorage.getItem('regiao_eletricista') || 'Palmas/TO';
    const nomeDistribuidora =
      localStorage.getItem('tenant_distribuidora_nome') || environment.distribuidoraPadraoNome;

    let msg = `⚡ *SOLICITAÇÃO DE COTAÇÃO — ${nomeDistribuidora.toUpperCase()}*\n`;
    msg += `Profissional: *${nomeProfissional}*\n`;
    msg += `Obra / Cliente: *${nomeCliente}* (${regiao})\n`;
    msg += `-------------------------------------------\n`;
    msg += `*LISTA CONSOLIDADA DE MATERIAIS (NBR 5410):*\n`;

    if (itensConsolidados.length > 0) {
      itensConsolidados.forEach((item) => {
        msg += `• *${item.quantidade} ${item.unidade}* - ${item.descricao}\n`;
      });
    } else {
      msg += '• Cabos Flexíveis antichama 2.5mm² e 6.0mm²\n';
      msg += '• Disjuntores DIN Curva C e Disjuntor Geral\n';
      msg += '• Dispositivo DPS 20kA + IDR 40A 30mA\n';
      msg += '• Eletrodutos corrugados e caixas 4x2\n';
    }

    msg += '-------------------------------------------\n';
    msg += 'Solicito cotação e condições de entrega/retirada.';
    return msg;
  }
};
