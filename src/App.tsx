import React from 'react';
import { IonApp } from '@ionic/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OnboardingPage } from './pages/Onboarding/OnboardingPage';
import { ParceirosPage } from './pages/Parceiros/ParceirosPage';
import { LoginPage } from './pages/Login/LoginPage';
import { RegisterPage } from './pages/Register/RegisterPage';
import { AssinaturaPage } from './pages/Assinatura/AssinaturaPage';
import { DashboardLayout } from './pages/Dashboard/DashboardLayout';
import { MainViewPage } from './pages/Dashboard/MainViewPage';
import { QuizPage } from './pages/Quiz/QuizPage';
import { HistoricoPage } from './pages/Historico/HistoricoPage';
import { LevantamentoPage } from './pages/Levantamento/LevantamentoPage';
import { ConfigPrecosPage } from './pages/ConfigPrecos/ConfigPrecosPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { PropostaClientePage } from './pages/Proposta/PropostaClientePage';

export const App: React.FC = () => {
  return (
    <IonApp>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
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
      </BrowserRouter>
    </IonApp>
  );
};
