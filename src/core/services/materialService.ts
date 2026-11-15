import { httpClient } from '../httpClient';
import { environment } from '../../config/environment';

const URL_MATERIAIS = `${environment.apiMateriaisUrl}/api/materiais`;
const URL_ORCAMENTOS_BASE = `${environment.apiCalculadoraUrl}/v1/orcamentos`;

export const materialService = {
  async getOrcamentoPorId(orcamentoId: string): Promise<any> {
    const idLimpo = String(orcamentoId).trim();
    return httpClient.get<any>(`${URL_ORCAMENTOS_BASE}/${idLimpo}`);
  },

  async gerarLevantamento(dados: any): Promise<any> {
    return httpClient.post<any>(`${URL_MATERIAIS}/gerar`, dados);
  },

  async getDetalhesMaterial(orcamentoId: string): Promise<any> {
    const idLimpo = String(orcamentoId).trim();
    return httpClient.get<any>(`${URL_MATERIAIS}/detalhes/${idLimpo}`);
  }
};
