import { httpClient } from '../httpClient';
import { environment } from '../../config/environment';

const URL_DASHBOARD = `${environment.apiCalculadoraUrl}/api/v1/dashboard`;
const URL_HISTORICO = `${environment.apiCalculadoraUrl}/v1/historico`;

let cacheStats: any = null;
let cacheHistorico: any[] | null = null;

export const dashboardService = {
  async getStats(forceRefresh = false): Promise<any> {
    if (cacheStats && !forceRefresh) return cacheStats;
    const res = await httpClient.get<any>(`${URL_DASHBOARD}/stats`);
    cacheStats = res;
    return res;
  },

  async getHistorico(forceRefresh = false): Promise<any[]> {
    if (cacheHistorico && !forceRefresh) return cacheHistorico;
    const res = await httpClient.get<any[]>(URL_HISTORICO);
    cacheHistorico = res || [];
    return cacheHistorico;
  },

  async alterarStatus(id: string, status: string): Promise<any> {
    const cleanId = String(id).trim();
    const res = await httpClient.patch(
      `${URL_HISTORICO}/${cleanId}/status?novoStatus=${status}`,
      {}
    );
    this.limparCache();
    return res;
  },

  async excluirOrcamento(id: string): Promise<any> {
    const res = await httpClient.delete(`${URL_HISTORICO}/${String(id).trim()}`);
    this.limparCache();
    return res;
  },

  async recusarOrcamento(id: string): Promise<any> {
    const res = await httpClient.delete(`${URL_HISTORICO}/${String(id).trim()}`);
    this.limparCache();
    return res;
  },

  async restaurarOrcamento(id: string): Promise<any> {
    const res = await httpClient.post(`${URL_HISTORICO}/${String(id).trim()}/restaurar`, {});
    this.limparCache();
    return res;
  },

  async getLixeira(): Promise<any[]> {
    return httpClient.get<any[]>(`${URL_HISTORICO}/lixeira`);
  },

  limparCache(): void {
    cacheStats = null;
    cacheHistorico = null;
  }
};
