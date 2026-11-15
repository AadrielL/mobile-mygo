import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../core/services/authService';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('USER');
  const [planType, setPlanType] = useState<string>('FREE');
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setUserRole((authService.getUserRole() || 'USER').toUpperCase());
    setPlanType(authService.getPlanType());
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setShowMobileMenu(false);
    navigate('/login');
  };

  if (!isMobile) {
    return (
      <nav className="sidebar" aria-label="Menu Lateral Principal">
        <div className="logo-area">
          <div className="logo-icon">
            <span className="material-icons">bolt</span>
          </div>
          <span className="logo-text">
            MYGO <strong>ELÉTRICA</strong>
          </span>
        </div>

        <ul className="nav-links">
          <li className="nav-category">PAINEL PRINCIPAL</li>

          <li>
            <NavLink to="/dashboard-main" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="material-icons">space_dashboard</span>
              <span className="nav-text">Início</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/quiz" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="material-icons">calculate</span>
              <span className="nav-text">Novo Orçamento</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/historico" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="material-icons">history</span>
              <span className="nav-text">Histórico</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/levantamento" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="material-icons">inventory_2</span>
              <span className="nav-text">Levantamento</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/parceiros" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="material-icons">handshake</span>
              <span className="nav-text">Parceiros Palmas</span>
            </NavLink>
          </li>

          {planType === 'FREE' && (
            <li>
              <NavLink
                to="/assinatura"
                className={({ isActive }) => `link-pro ${isActive ? 'active' : ''}`}
              >
                <span className="material-icons">stars</span>
                <span className="nav-text">Seja PRO</span>
              </NavLink>
            </li>
          )}

          <li className="nav-category">CONFIGURAÇÕES</li>

          <li>
            <NavLink
              to="/config-precos"
              end
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="material-icons">tune</span>
              <span className="nav-text">Tabela de Preços</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/config-precos?tab=servicos"
              className={() =>
                location.pathname === '/config-precos' && location.search.includes('tab=servicos')
                  ? 'active'
                  : ''
              }
            >
              <span className="material-icons">list_alt</span>
              <span className="nav-text">Serviços do Quiz</span>
            </NavLink>
          </li>

          {userRole === 'ADMIN' && (
            <>
              <li className="nav-category">GESTÃO</li>
              <li>
                <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
                  <span className="material-icons">analytics</span>
                  <span className="nav-text">Relatórios de Gestão</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>

        <div className="sidebar-footer">
          <span className="footer-badge">NBR 5410 Compliant</span>
        </div>
      </nav>
    );
  }

  // MOBILE (< 768px): Barra de navegação inferior fixa com as 4 áreas principais (Prompt 02)
  return (
    <nav className="bottom-nav" aria-label="Navegação Inferior Mobile">
      <NavLink
        to="/dashboard-main"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="material-icons">space_dashboard</span>
        <span className="bottom-nav-label">Início</span>
      </NavLink>

      <NavLink
        to="/quiz"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="material-icons">calculate</span>
        <span className="bottom-nav-label">Novo Orçamento</span>
      </NavLink>

      <NavLink
        to="/historico"
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="material-icons">history</span>
        <span className="bottom-nav-label">Histórico</span>
      </NavLink>

      <button
        type="button"
        className={`bottom-nav-item bottom-nav-more ${showMobileMenu ? 'active' : ''}`}
        onClick={() => setShowMobileMenu((prev) => !prev)}
      >
        <span className="material-icons">{showMobileMenu ? 'close' : 'handyman'}</span>
        <span className="bottom-nav-label">Perfil / Ferramentas</span>
      </button>

      {showMobileMenu && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-menu-panel" role="dialog" aria-label="Perfil e Ferramentas">
            <div className="mobile-menu-header">
              <div className="mobile-menu-brand">
                <span className="material-icons">bolt</span>
                <strong>PERFIL & FERRAMENTAS MYGO</strong>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setShowMobileMenu(false)}
                aria-label="Fechar menu"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="mobile-menu-links">
              <NavLink
                to="/levantamento"
                className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="material-icons">inventory_2</span>
                <span>Levantamento de Materiais (NBR 5410)</span>
              </NavLink>

              <NavLink
                to="/config-precos"
                className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="material-icons">tune</span>
                <span>Tabela de Preços & Serviços Extras</span>
              </NavLink>

              <NavLink
                to="/parceiros"
                className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="material-icons">handshake</span>
                <span>Rede de Parceiros Palmas</span>
              </NavLink>

              {planType === 'FREE' && (
                <NavLink
                  to="/assinatura"
                  className={({ isActive }) =>
                    `mobile-menu-item mobile-menu-pro ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="material-icons">stars</span>
                  <span>Upgrade para PRO ⚡</span>
                </NavLink>
              )}

              {userRole === 'ADMIN' && (
                <NavLink
                  to="/reports"
                  className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="material-icons">analytics</span>
                  <span>Relatórios de Gestão</span>
                </NavLink>
              )}

              <div className="mobile-menu-divider" />

              <button
                type="button"
                className="mobile-menu-item mobile-menu-logout"
                onClick={handleLogout}
              >
                <span className="material-icons">logout</span>
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
