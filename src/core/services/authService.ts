import { httpClient } from '../httpClient';
import { environment } from '../../config/environment';

const API_URL = environment.apiAuthUrl;

function saveSession(res: any): void {
  if (!res) return;
  if (res.token) localStorage.setItem('token', res.token);
  if (res.role) localStorage.setItem('userRole', String(res.role).toUpperCase());

  const nomeUsuario = res.nome || res.name || 'Usuário';
  localStorage.setItem('userName', nomeUsuario);

  if (res.email) localStorage.setItem('userEmail', res.email);
  if (res.planType) localStorage.setItem('userPlanType', res.planType);

  if (res.tipoPerfil) localStorage.setItem('userTipoPerfil', res.tipoPerfil);
  if (res.tenantId) localStorage.setItem('userTenantId', res.tenantId);
}

export const authService = {
  async verificarCodigo(email: string, codigo: string): Promise<any> {
    const res = await httpClient.post(`${API_URL}/auth/verificar-codigo`, { email, codigo });
    saveSession(res);
    return res;
  },

  async reenviarCodigo(email: string): Promise<any> {
    return httpClient.post(`${API_URL}/auth/reenviar-codigo`, { email });
  },

  async register(userData: any): Promise<any> {
    const res = await httpClient.post<any>(`${API_URL}/auth/register`, userData);
    if (res && res.token) {
      saveSession(res);
    }
    return res;
  },

  async login(credentials: { email: string; password: string }): Promise<any> {
    const res = await httpClient.post(`${API_URL}/auth/login`, credentials);
    saveSession(res);
    return res;
  },

  async getMe(): Promise<any> {
    const user = await httpClient.get<any>(`${API_URL}/auth/me`);
    if (user) {
      if (user.nome) localStorage.setItem('userName', user.nome);
      if (user.role) localStorage.setItem('userRole', String(user.role).toUpperCase());
      if (user.email) localStorage.setItem('userEmail', user.email);
      if (user.planType) localStorage.setItem('userPlanType', user.planType);
    }
    return user;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  getUserRole(): string {
    return localStorage.getItem('userRole') || 'VISITANTE';
  },

  getUserName(): string {
    return localStorage.getItem('userName') || 'Eletricista Mygo';
  },

  getTenantId(): string {
    const email = localStorage.getItem('userEmail');
    return email && email !== 'undefined' ? email : 'admin@teste.com';
  },

  getPlanType(): string {
    const savedPlan = localStorage.getItem('userPlanType');
    if (savedPlan) return savedPlan;
    const token = localStorage.getItem('token');
    if (!token) return 'FREE';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.planType || 'FREE';
    } catch {
      return 'FREE';
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPlanType');
    localStorage.removeItem('userTipoPerfil');
    localStorage.removeItem('userTenantId');
  },

  async getVagasVitalicias(): Promise<number> {
    return httpClient.get<number>(`${API_URL}/auth/vagas-vitalicias`);
  },

  async processarPagamento(formData: any): Promise<any> {
    return httpClient.post<any>(`${API_URL}/auth/pagamento`, formData);
  },

  async refreshSession(): Promise<any> {
    return this.getMe();
  },

  async avaliarProfissional(payload: {
    profissionalId?: string;
    tenantId?: string;
    orcamentoId?: string;
    estrelas: number;
    tag: string;
  }): Promise<any> {
    return httpClient.post<any>(`${API_URL}/auth/avaliar-profissional`, payload);
  }
};
