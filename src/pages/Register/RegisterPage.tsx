import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../core/services/authService';
import { SubmitButton } from '../../components/SubmitButton';

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

const ESTADOS_UF = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const RegisterPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipoPerfil, setTipoPerfil] = useState<'ELETRICISTA' | 'CLIENTE'>('ELETRICISTA');

  // Geolocalização Regional
  const [cep, setCep] = useState('');
  const [estado, setEstado] = useState('TO');
  const [cidade, setCidade] = useState('Palmas');
  const [bairro, setBairro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Verificação E-mail + SMS
  const [etapaVerificacao, setEtapaVerificacao] = useState(false);
  const [canalVerificacao, setCanalVerificacao] = useState<'EMAIL' | 'SMS'>('SMS');
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sucessoMensagem, setSucessoMensagem] = useState('');

  const [searchParams] = useSearchParams();
  const [eletricistaVinculadoId, setEletricistaVinculadoId] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const refUrl = searchParams.get('ref');
    const refSalvo = localStorage.getItem('ref_eletricista_vinculado') || localStorage.getItem('tenant_eletricista');
    const vinculo = refUrl || refSalvo || '';
    if (vinculo) {
      setEletricistaVinculadoId(vinculo);
      localStorage.setItem('ref_eletricista_vinculado', vinculo);
      localStorage.setItem('tenant_eletricista', vinculo);
      setTipoPerfil('CLIENTE');
    }
  }, [searchParams]);

  const handleCepChange = async (rawVal: string) => {
    const formatted = formatCep(rawVal);
    setCep(formatted);
    const digits = rawVal.replace(/\D/g, '');
    if (digits.length === 8) {
      // M3-01 / Performance VPS: Verifica primeiro o cache local de CEP para não repetir chamadas externas
      const cacheKey = `mygo_cep_cache_${digits}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.uf) setEstado(parsed.uf);
          if (parsed.localidade) setCidade(parsed.localidade);
          if (parsed.bairro) setBairro(parsed.bairro);
          return;
        } catch {
          // segue para busca
        }
      }

      setBuscandoCep(true);
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await resp.json();
        if (data && !data.erro) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          if (data.uf) setEstado(data.uf);
          if (data.localidade) setCidade(data.localidade);
          if (data.bairro) setBairro(data.bairro);
        }
      } catch {
        // Permite preenchimento manual caso sem internet ou erro na busca de CEP
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage('');
    setSucessoMensagem('');

    const cpfDigits = cpf.replace(/\D/g, '');
    const telDigits = telefone.replace(/\D/g, '');

    if (!nome || !email || !password || !cpfDigits || !telDigits || !estado || !cidade || !bairro) {
      setErrorMessage('Por favor, preencha toda a ficha cadastral (CPF, Telefone e Região).');
      return;
    }

    if (cpfDigits.length !== 11) {
      setErrorMessage('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (telDigits.length < 10) {
      setErrorMessage('Informe um número de celular válido com DDD.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        'A senha deve ter no mínimo 8 caracteres (com maiúscula, minúscula e número).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({
        nome,
        cpf: cpfDigits,
        telefone: telDigits,
        email,
        password,
        tipoPerfil,
        eletricistaVinculadoId: eletricistaVinculadoId || undefined,
        cep: cep.replace(/\D/g, ''),
        estado,
        cidade,
        bairro
      });
      localStorage.setItem('cliente_uf', estado);
      localStorage.setItem('cliente_cidade', cidade);
      localStorage.setItem('cliente_bairro', bairro);
      setEtapaVerificacao(true);
      setSucessoMensagem(
        'Ficha cadastral registrada! Enviamos um código de 6 dígitos por SMS para seu número e para seu e-mail.'
      );
    } catch (err: any) {
      if (err?.error && typeof err.error === 'string') {
        setErrorMessage(err.error);
      } else if (err?.status === 400) {
        setErrorMessage('Dados inválidos ou usuário já cadastrado.');
      } else if (err?.status === 0) {
        setErrorMessage('Não foi possível conectar ao servidor.');
      } else {
        setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!codigoVerificacao || codigoVerificacao.trim().length !== 6) {
      setErrorMessage('Por favor, digite o código de 6 dígitos enviado para seu número/e-mail.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await authService.verificarCodigo(email, codigoVerificacao.trim());
      alert('⚡ Ficha cadastral e número autenticados com sucesso! Bem-vindo ao ecossistema MyGo.');
      navigate('/dashboard-main');
    } catch (err: any) {
      if (err?.error && typeof err.error === 'string') {
        setErrorMessage(err.error);
      } else {
        setErrorMessage('Código incorreto ou expirado. Solicite um novo código.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onReenviarCodigo = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    setSucessoMensagem('');

    try {
      await authService.reenviarCodigo(email);
      setSucessoMensagem('Novo código enviado por SMS e E-mail!');
    } catch {
      setErrorMessage('Não foi possível reenviar o código agora. Tente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-main)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem 0.75rem'
      }}
    >
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'var(--accent-muted)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              margin: '0 auto 0.75rem auto'
            }}
          >
            <span className="material-icons" style={{ fontSize: '26px' }}>
              bolt
            </span>
          </div>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '0.25rem'
            }}
          >
            {etapaVerificacao ? 'Autenticar Número e Conta' : 'Ficha Cadastral MyGo'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            {etapaVerificacao
              ? 'Confirme o código de 6 dígitos enviado por SMS ou E-mail para validar sua identidade.'
              : 'Cadastro completo com geolocalização para conectar clientes e eletricistas da mesma região.'}
          </p>
        </div>

        {!etapaVerificacao ? (
          <div className="app-card">
            <form onSubmit={onRegister}>
              {/* 1. TIPO DE PERFIL */}
              <div className="app-form-group" style={{ marginBottom: '1.1rem' }}>
                <label className="app-label">Tipo de Perfil</label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginTop: '0.25rem'
                  }}
                >
                  <button
                    type="button"
                    className={`app-btn ${
                      tipoPerfil === 'ELETRICISTA' ? 'app-btn-primary' : 'app-btn-secondary'
                    }`}
                    onClick={() => setTipoPerfil('ELETRICISTA')}
                  >
                    <span className="material-icons" style={{ fontSize: '16px' }}>
                      handyman
                    </span>
                    <span>Eletricista</span>
                  </button>

                  <button
                    type="button"
                    className={`app-btn ${
                      tipoPerfil === 'CLIENTE' ? 'app-btn-primary' : 'app-btn-secondary'
                    }`}
                    onClick={() => setTipoPerfil('CLIENTE')}
                  >
                    <span className="material-icons" style={{ fontSize: '16px' }}>
                      person
                    </span>
                    <span>Cliente</span>
                  </button>
                </div>
              </div>

              {/* 2. DADOS PESSOAIS & CONTATO (CPF + TELEFONE + E-MAIL) */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span className="material-icons" style={{ fontSize: '15px' }}>
                  badge
                </span>
                <span>1. Identificação e Contato</span>
              </div>

              <div className="app-form-group">
                <label className="app-label">Nome Completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                  className="app-input"
                />
              </div>

              <div className="app-grid-2" style={{ gap: '0.75rem', marginBottom: '0.25rem' }}>
                <div className="app-form-group">
                  <label className="app-label">CPF</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                    className="app-input"
                  />
                </div>

                <div className="app-form-group">
                  <label className="app-label">Celular / WhatsApp (com SMS)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={telefone}
                    onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                    placeholder="(63) 99999-0000"
                    required
                    className="app-input"
                  />
                </div>
              </div>

              <div className="app-form-group">
                <label className="app-label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="app-input"
                />
              </div>

              {/* 3. REGIÃO & GEOLOCALIZAÇÃO */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '1rem 0 0.65rem 0',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span className="material-icons" style={{ fontSize: '15px' }}>
                  place
                </span>
                <span>2. Geolocalização e Região (Match Eletricista/Cliente)</span>
              </div>

              <div className="app-grid-2" style={{ gap: '0.75rem', marginBottom: '0.25rem' }}>
                <div className="app-form-group">
                  <label className="app-label">
                    CEP {buscandoCep && <span style={{ color: 'var(--accent-primary)' }}>(Buscando...)</span>}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="77000-000"
                    className="app-input"
                  />
                </div>

                <div className="app-form-group">
                  <label className="app-label">Estado (UF)</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    required
                    className="app-select"
                  >
                    {ESTADOS_UF.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="app-grid-2" style={{ gap: '0.75rem', marginBottom: '0.25rem' }}>
                <div className="app-form-group">
                  <label className="app-label">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: Palmas"
                    required
                    className="app-input"
                  />
                </div>

                <div className="app-form-group">
                  <label className="app-label">Bairro / Quadra</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Ex: Plano Diretor Sul / ARSE"
                    required
                    className="app-input"
                  />
                </div>
              </div>

              {/* 4. SENHA DE ACESSO */}
              <div className="app-form-group" style={{ marginTop: '0.35rem' }}>
                <label className="app-label">Senha de Acesso (mínimo 8 caracteres)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex: SenhaForte@2026"
                  required
                  className="app-input"
                />
                <small
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    marginTop: '3px',
                    display: 'block'
                  }}
                >
                  Deve conter letras maiúsculas, minúsculas e números.
                </small>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  background: 'var(--accent-muted)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}
              >
                <span
                  className="material-icons"
                  style={{
                    color: 'var(--accent-primary)',
                    fontSize: '20px',
                    marginTop: '1px'
                  }}
                >
                  phonelink_lock
                </span>
                <div>
                  <span className="app-badge app-badge-amber" style={{ marginBottom: '0.35rem' }}>
                    VERIFICAÇÃO DUPLA (SMS + E-MAIL)
                  </span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Enviaremos um código de 6 dígitos para o seu celular e e-mail para autenticar
                    seu número e ativar o radar de geolocalização da sua região.
                  </p>
                </div>
              </div>

              <SubmitButton
                type="submit"
                isSubmitting={isSubmitting}
                loadingText="Validando Ficha e Enviando SMS..."
                icon="sms"
                style={{ width: '100%' }}
              >
                <span>Salvar Ficha e Receber Código SMS</span>
              </SubmitButton>
            </form>

            {errorMessage && (
              <p
                className="break-words"
                style={{
                  color: 'var(--status-danger)',
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  error_outline
                </span>
                <span>{errorMessage}</span>
              </p>
            )}

            <div
              style={{
                marginTop: '1.25rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}
            >
              Já tem conta?
              <Link
                to="/login"
                style={{
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  marginLeft: '0.25rem'
                }}
              >
                Fazer Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="app-card">
            <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
              <span
                className="material-icons"
                style={{
                  fontSize: '46px',
                  color: 'var(--accent-primary)',
                  marginBottom: '0.35rem'
                }}
              >
                {canalVerificacao === 'SMS' ? 'sms' : 'mark_email_read'}
              </span>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  margin: '0.65rem 0 0.85rem 0'
                }}
              >
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${
                    canalVerificacao === 'SMS' ? 'app-btn-primary' : 'app-btn-secondary'
                  }`}
                  onClick={() => setCanalVerificacao('SMS')}
                >
                  <span className="material-icons" style={{ fontSize: '15px' }}>
                    smartphone
                  </span>
                  <span>Código via SMS</span>
                </button>
                <button
                  type="button"
                  className={`app-btn app-btn-sm ${
                    canalVerificacao === 'EMAIL' ? 'app-btn-primary' : 'app-btn-secondary'
                  }`}
                  onClick={() => setCanalVerificacao('EMAIL')}
                >
                  <span className="material-icons" style={{ fontSize: '15px' }}>
                    mail
                  </span>
                  <span>Código via E-mail</span>
                </button>
              </div>

              <p className="break-words" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                {canalVerificacao === 'SMS' ? (
                  <>
                    Código SMS enviado para:{' '}
                    <strong style={{ color: 'var(--text-main)' }}>{telefone}</strong>
                  </>
                ) : (
                  <>
                    Código enviado para:{' '}
                    <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
                  </>
                )}
              </p>
              <span className="app-badge app-badge-muted" style={{ marginTop: '0.35rem' }}>
                📍 Região: {bairro} — {cidade}/{estado}
              </span>
            </div>

            {sucessoMensagem && (
              <p
                style={{
                  color: 'var(--status-success)',
                  background: 'var(--status-success-bg)',
                  border: '1px solid var(--status-success-border)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '1.15rem',
                  textAlign: 'center'
                }}
              >
                {sucessoMensagem}
              </p>
            )}

            <form onSubmit={onVerificarCodigo}>
              <div className="app-form-group" style={{ textAlign: 'center' }}>
                <label className="app-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Digite o código de 6 dígitos ({canalVerificacao})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={codigoVerificacao}
                  onChange={(e) => setCodigoVerificacao(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="app-input"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.35em',
                    textAlign: 'center',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                />
              </div>

              <SubmitButton
                type="submit"
                isSubmitting={isSubmitting}
                loadingText="Autenticando..."
                icon="verified"
                disabled={codigoVerificacao.length < 6}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                <span>Validar Número e Ativar Conta</span>
              </SubmitButton>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '1.25rem'
                }}
              >
                <button
                  type="button"
                  className="app-btn app-btn-ghost app-btn-sm"
                  onClick={() => setEtapaVerificacao(false)}
                >
                  <span className="material-icons" style={{ fontSize: '15px' }}>
                    arrow_back
                  </span>
                  <span>Editar Ficha</span>
                </button>

                <button
                  type="button"
                  className="app-btn app-btn-secondary app-btn-sm"
                  onClick={onReenviarCodigo}
                  disabled={isSubmitting}
                >
                  <span className="material-icons" style={{ fontSize: '15px' }}>
                    refresh
                  </span>
                  <span>Reenviar SMS / E-mail</span>
                </button>
              </div>
            </form>

            {errorMessage && (
              <p
                className="break-words"
                style={{
                  color: 'var(--status-danger)',
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  justifyContent: 'center'
                }}
              >
                <span className="material-icons" style={{ fontSize: '16px' }}>
                  error_outline
                </span>
                <span>{errorMessage}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
