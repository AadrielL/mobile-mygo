import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { authService } from '../../core/services/authService';
import { dashboardService } from '../../core/services/dashboardService';
import './DashboardLayout.css';

export const DashboardLayout: React.FC = () => {
  const [userName, setUserName] = useState<string>('Eletricista Mygo');
  const [stats, setStats] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('mygo-theme') || 'dark';
    setIsDarkMode(savedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);

    setUserName(authService.getUserName() || 'Eletricista Mygo');

    authService
      .getMe()
      .then((user) => {
        if (user?.nome) setUserName(user.nome);
      })
      .catch(() => {});

    dashboardService
      .getStats()
      .then((res) => setStats(res))
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    const theme = nextDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mygo-theme', theme);
  };

  const handleLogout = () => {
    dashboardService.limparCache();
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <header className="global-topbar">
          <div className="topbar-left">
            <span className="app-badge app-badge-muted">
              <span
                className="material-icons"
                style={{ fontSize: '14px', color: 'var(--accent-primary)' }}
              >
                flash_on
              </span>
              <span className="topbar-title-text">Painel de Engenharia</span>
            </span>
          </div>

          <div className="topbar-right">
            {stats && (
              <div
                className="app-badge app-badge-amber credits-badge"
                title="Limite de orçamentos diários do seu plano"
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>
                  bolt
                </span>
                <span>
                  {stats.budgetsToday || 0}/{stats.dailyLimit || 15}{' '}
                  <span className="hide-mobile">({stats.planType || 'FREE'})</span>
                </span>
              </div>
            )}

            {(!stats?.planType || stats?.planType === 'FREE') && (
              <button
                type="button"
                className="app-btn app-btn-primary app-btn-sm hide-mobile"
                onClick={() => navigate('/assinatura')}
              >
                <span className="material-icons" style={{ fontSize: '15px' }}>
                  stars
                </span>
                <span>Assinatura PRO</span>
              </button>
            )}

            <button
              type="button"
              className="app-btn app-btn-secondary app-btn-sm theme-btn"
              onClick={toggleTheme}
              title={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              <span
                className="material-icons"
                style={{ fontSize: '16px', color: 'var(--accent-primary)' }}
              >
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hide-mobile">{isDarkMode ? 'Claro' : 'Escuro'}</span>
            </button>

            <button
              type="button"
              className="app-btn app-btn-secondary app-btn-sm"
              onClick={() => navigate('/config-precos')}
              title="Ajustes e Tabela de Preços"
              aria-label="Abrir Ajustes e Tabela de Preços"
            >
              <span
                className="material-icons"
                style={{ fontSize: '17px', color: 'var(--accent-primary)' }}
              >
                settings
              </span>
            </button>

            <div className="topbar-divider hide-mobile" />

            <div className="user-chip" title="Usuário conectado">
              <div className="user-avatar">
                <span className="material-icons" style={{ fontSize: '18px' }}>
                  person
                </span>
              </div>
              <span className="user-name hide-mobile">{userName}</span>
            </div>

            <button
              type="button"
              className="app-btn app-btn-danger app-btn-sm hide-mobile"
              onClick={handleLogout}
              title="Encerrar sessão"
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>
                logout
              </span>
              <span>Sair</span>
            </button>
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
