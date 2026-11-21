const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envMeta = (import.meta as any).env || {};

export const environment = {
  production: !isLocalhost,
  apiAuthUrl:
    envMeta.VITE_API_AUTH_URL ||
    (isLocalhost ? 'http://localhost:8083' : 'https://www.comandosamoris.tech/svc/auth'),
  apiCalculadoraUrl:
    envMeta.VITE_API_CALCULADORA_URL ||
    (isLocalhost ? 'http://localhost:8081' : 'https://www.comandosamoris.tech/svc/calc'),
  apiMateriaisUrl:
    envMeta.VITE_API_MATERIAIS_URL ||
    (isLocalhost ? 'http://localhost:8082' : 'https://www.comandosamoris.tech/svc/materiais'),
  mercadoPagoPublicKey:
    envMeta.VITE_MP_PUBLIC_KEY || 'APP_USR-08772766-1d3a-4e72-8d52-30f223b799f7',
  // M2-04: Configuração padrão do Tenant para cotação na distribuidora (sem hardcode nos componentes visuais)
  distribuidoraPadraoNome: 'Capital Elétrica Distribuidora - Palmas/TO',
  distribuidoraPadraoWhatsApp: '556333222120'
};
