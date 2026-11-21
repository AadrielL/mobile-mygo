import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonRippleEffect
} from '@ionic/react';
import {
  gridOutline,
  calculatorOutline,
  timeOutline,
  constructOutline,
  cubeOutline,
  optionsOutline,
  peopleOutline,
  starOutline,
  barChartOutline,
  logOutOutline,
  closeOutline,
  flashOutline,
  desktopOutline
} from 'ionicons/icons';
import { authService } from '../core/services/authService';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('USER');
  const [planType, setPlanType] = useState<string>('FREE');
  const [isMobile] = useState<boolean>(true);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setUserRole((authService.getUserRole() || 'USER').toUpperCase());
    setPlanType(authService.getPlanType());
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    setShowMobileMenu(false);
    navigate('/login');
  };

  const navigateFromModal = (path: string) => {
    setShowMobileMenu(false);
    navigate(path);
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

        <div className="sidebar-footer" style={{ flexDirection: 'column', gap: '8px' }}>
          <a
            href="http://localhost:4200"
            className="app-btn app-btn-secondary app-btn-sm"
            style={{ width: '100%', fontSize: '0.72rem' }}
            title="Abrir versão Desktop (Angular)"
          >
            <IonIcon icon={desktopOutline} style={{ fontSize: '15px' }} />
            <span>Versão PC (Angular)</span>
          </a>
          <span className="footer-badge">Ionic Mobile + NBR 5410</span>
        </div>
      </nav>
    );
  }

  // MOBILE (< 768px): Barra de navegação inferior nativa Ionic + Sheet Modal Nativo (iOS/Android)
  return (
    <>
      <nav className="bottom-nav ionic-bottom-tab-bar" aria-label="Navegação Inferior Mobile Ionic">
        <NavLink
          to="/dashboard-main"
          className={({ isActive }) => `bottom-nav-item ion-activatable ${isActive ? 'active' : ''}`}
        >
          <IonIcon icon={gridOutline} className="ionic-tab-icon" />
          <span className="bottom-nav-label">Início</span>
          <IonRippleEffect />
        </NavLink>

        <NavLink
          to="/quiz"
          className={({ isActive }) => `bottom-nav-item ion-activatable ${isActive ? 'active' : ''}`}
        >
          <IonIcon icon={calculatorOutline} className="ionic-tab-icon" />
          <span className="bottom-nav-label">Orçar</span>
          <IonRippleEffect />
        </NavLink>

        <NavLink
          to="/historico"
          className={({ isActive }) => `bottom-nav-item ion-activatable ${isActive ? 'active' : ''}`}
        >
          <IonIcon icon={timeOutline} className="ionic-tab-icon" />
          <span className="bottom-nav-label">Histórico</span>
          <IonRippleEffect />
        </NavLink>

        <button
          type="button"
          className={`bottom-nav-item bottom-nav-more ion-activatable ${showMobileMenu ? 'active' : ''}`}
          onClick={() => setShowMobileMenu(true)}
        >
          <IonIcon icon={constructOutline} className="ionic-tab-icon" />
          <span className="bottom-nav-label">Ferramentas</span>
          <IonRippleEffect />
        </button>
      </nav>

      <IonModal
        isOpen={showMobileMenu}
        onDidDismiss={() => setShowMobileMenu(false)}
        initialBreakpoint={0.65}
        breakpoints={[0, 0.65, 0.92]}
        handleBehavior="cycle"
        className="mygo-ionic-sheet-modal"
      >
        <IonHeader className="ion-no-border">
          <IonToolbar className="mygo-ionic-toolbar">
            <IonTitle className="mygo-ionic-sheet-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonIcon icon={flashOutline} style={{ color: 'var(--accent-primary)' }} />
                <span>Ferramentas & Perfil MyGo</span>
              </div>
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowMobileMenu(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding mygo-ionic-sheet-content">
          <IonList lines="none" className="mygo-ionic-list">
            <IonItem
              button
              detail
              onClick={() => navigateFromModal('/ferramentas-campo')}
              className="mygo-ionic-item"
            >
              <IonIcon icon={flashOutline} slot="start" className="mygo-ionic-item-icon" />
              <IonLabel>
                <h3>Kit Eletrotécnico de Campo</h3>
                <p>Queda de tensão (ΔV), eletrodutos, BTU/CV e QDC</p>
              </IonLabel>
            </IonItem>

            <IonItem
              button
              detail
              onClick={() => navigateFromModal('/levantamento')}
              className="mygo-ionic-item"
            >
              <IonIcon icon={cubeOutline} slot="start" className="mygo-ionic-item-icon" />
              <IonLabel>
                <h3>Levantamento de Materiais</h3>
                <p>Cálculo rápido padrão NBR 5410</p>
              </IonLabel>
            </IonItem>

            <IonItem
              button
              detail
              onClick={() => navigateFromModal('/config-precos')}
              className="mygo-ionic-item"
            >
              <IonIcon icon={optionsOutline} slot="start" className="mygo-ionic-item-icon" />
              <IonLabel>
                <h3>Tabela de Preços & Serviços</h3>
                <p>Ajuste seu valor de ponto e mão de obra</p>
              </IonLabel>
            </IonItem>

            <IonItem
              button
              detail
              onClick={() => navigateFromModal('/parceiros')}
              className="mygo-ionic-item"
            >
              <IonIcon icon={peopleOutline} slot="start" className="mygo-ionic-item-icon" />
              <IonLabel>
                <h3>Rede de Parceiros Palmas</h3>
                <p>Lojas elétricas e fornecedores locais</p>
              </IonLabel>
            </IonItem>

            {planType === 'FREE' && (
              <IonItem
                button
                detail
                onClick={() => navigateFromModal('/assinatura')}
                className="mygo-ionic-item mygo-ionic-item-pro"
              >
                <IonIcon icon={starOutline} slot="start" style={{ color: 'var(--accent-primary)' }} />
                <IonLabel>
                  <h3 style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                    Upgrade para Plano PRO
                  </h3>
                  <p>Orçamentos ilimitados e PDF personalizado</p>
                </IonLabel>
                <IonBadge color="warning" slot="end">
                  PRO
                </IonBadge>
              </IonItem>
            )}

            {userRole === 'ADMIN' && (
              <IonItem
                button
                detail
                onClick={() => navigateFromModal('/reports')}
                className="mygo-ionic-item"
              >
                <IonIcon icon={barChartOutline} slot="start" className="mygo-ionic-item-icon" />
                <IonLabel>
                  <h3>Relatórios de Gestão</h3>
                  <p>Métricas administrativas do ecossistema</p>
                </IonLabel>
              </IonItem>
            )}

            <IonItem
              button
              detail={false}
              onClick={handleLogout}
              className="mygo-ionic-item mygo-ionic-item-logout"
            >
              <IonIcon icon={logOutOutline} slot="start" style={{ color: 'var(--status-danger)' }} />
              <IonLabel>
                <h3 style={{ color: 'var(--status-danger)', fontWeight: 700 }}>Sair da Conta</h3>
                <p>Encerrar sessão com segurança no aparelho</p>
              </IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
};
