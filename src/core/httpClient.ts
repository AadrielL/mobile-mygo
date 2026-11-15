/**
 * Cliente HTTP centralizado que replica exatamente o AuthInterceptor do Angular:
 * - Rotas públicas (/auth/login, /auth/register, /auth/parceiros-destaque) seguem sem headers extras de tenant.
 * - Demais requisições (8081, 8082, 8083) recebem Authorization Bearer, X-User-Role e X-Tenant-ID.
 * - Em caso de 401 com token ativo, limpa a sessão e redireciona para /login.
 */

export class HttpError extends Error {
  status: number;
  error: any;
  constructor(status: number, message: string, error?: any) {
    super(message);
    this.status = status;
    this.error = error;
  }
}

export async function httpRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isPublicAuthRoute =
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/parceiros-destaque');

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  const email = localStorage.getItem('userEmail');
  const tenantPublico = localStorage.getItem('tenant_eletricista');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (!isPublicAuthRoute) {
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    headers['X-User-Role'] = role || 'VISITANTE';

    if (email && email !== 'undefined') {
      headers['X-Tenant-ID'] = email;
    } else if (tenantPublico) {
      headers['X-Tenant-ID'] = tenantPublico;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkErr: any) {
    throw new HttpError(0, 'Não foi possível conectar ao servidor.', networkErr);
  }

  const contentType = response.headers.get('content-type') || '';
  let body: any = null;
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && !url.includes('/auth/login')) {
      console.warn('Token expirado ou não autorizado. Redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      window.location.href = '/login';
    }
    const errMsg =
      (typeof body === 'string' && body) ||
      body?.message ||
      body?.error ||
      `Erro HTTP ${response.status}`;
    throw new HttpError(response.status, errMsg, body);
  }

  return body as T;
}

export const httpClient = {
  get: <T = any>(url: string) => httpRequest<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, data?: any) =>
    httpRequest<T>(url, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined
    }),
  put: <T = any>(url: string, data?: any) =>
    httpRequest<T>(url, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined
    }),
  patch: <T = any>(url: string, data?: any) =>
    httpRequest<T>(url, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined
    }),
  delete: <T = any>(url: string) => httpRequest<T>(url, { method: 'DELETE' })
};
