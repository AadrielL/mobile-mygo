import React, { Suspense, lazy } from 'react';
import { IonApp } from '@ionic/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './pages/Dashboard/DashboardLayout';
import { SkeletonList } from './components/Skeleton';

// Code-Splitting: Cada aba do aplicativo mobile é carregada individualmente sob demanda
const ParceirosPage = lazy(() =>
  import('./pages/Parceiros/ParceirosPage').then((m) => ({ default: m.ParceirosPage }))
);
const LoginPage = lazy(() =>
  import('./pages/Login/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/Register/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const AssinaturaPage = lazy(() =>
  import('./pages/Assinatura/AssinaturaPage').then((m) => ({ default: m.AssinaturaPage }))
);
const MainViewPage = lazy(() =>
  import('./pages/Dashboard/MainViewPage').then((m) => ({ default: m.MainViewPage }))
);
const QuizPage = lazy(() =>
  import('./pages/Quiz/QuizPage').then((m) => ({ default: m.QuizPage }))
);
const HistoricoPage = lazy(() =>
  import('./pages/Historico/HistoricoPage').then((m) => ({ default: m.HistoricoPage }))
);
const LevantamentoPage = lazy(() =>
  import('./pages/Levantamento/LevantamentoPage').then((m) => ({ default: m.LevantamentoPage }))
);
const ConfigPrecosPage = lazy(() =>
  import('./pages/ConfigPrecos/ConfigPrecosPage').then((m) => ({ default: m.ConfigPrecosPage }))
);
const ReportsPage = lazy(() =>
  import('./pages/Reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const PropostaClientePage = lazy(() =>
  import('./pages/Proposta/PropostaClientePage').then((m) => ({ default: m.PropostaClientePage }))
);
const FerramentasCampoPage = lazy(() =>
  import('./pages/FerramentasCampo/FerramentasCampoPage').then((m) => ({
    default: m.FerramentasCampoPage
  }))
);

const AbaFallback: React.FC = () => (
  <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>
    <SkeletonList rows={3} height="110px" />
  </div>
);

export const App: React.FC = () => {
  return (
    <IonApp>
      <BrowserRouter>
        <Suspense fallback={<AbaFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard-main" replace />} />
            <Route path="/onboarding" element={<Navigate to="/dashboard-main" replace />} />
            <Route path="/parceiros" element={<ParceirosPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/proposta/:id" element={<PropostaClientePage />} />

            <Route
              path="/assinatura"
              element={
                <ProtectedRoute>
                  <AssinaturaPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard-main" element={<MainViewPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="historico" element={<HistoricoPage />} />
              <Route path="levantamento" element={<LevantamentoPage />} />
              <Route path="ferramentas-campo" element={<FerramentasCampoPage />} />
              <Route
                path="reports"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="config-precos" element={<ConfigPrecosPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard-main" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </IonApp>
  );
};
