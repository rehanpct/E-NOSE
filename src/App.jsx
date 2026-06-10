import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { DroneDataProvider } from './context/DroneDataContext';

const SplashScreen = lazy(() => import('./pages/SplashScreen'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CalibrationPage = lazy(() => import('./pages/CalibrationPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const DatasetPage = lazy(() => import('./pages/DatasetPage'));
const DatasetCollectionPage = lazy(() => import('./pages/DatasetCollectionPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const DeploymentPage = lazy(() => import('./pages/DeploymentPage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const RnDPage = lazy(() => import('./pages/RnDPage'));
const DeploymentReadinessPage = lazy(() => import('./pages/DeploymentReadinessPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading E-NOSE...</p>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <DroneDataProvider>
                  <DashboardPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/calibration"
              element={
                <DroneDataProvider>
                  <CalibrationPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/reports"
              element={
                <DroneDataProvider>
                  <ReportsPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/dataset"
              element={
                <DroneDataProvider>
                  <DatasetPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/dataset-collection"
              element={
                <DroneDataProvider>
                  <DatasetCollectionPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/training"
              element={
                <DroneDataProvider>
                  <TrainingPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/rnd"
              element={
                <DroneDataProvider>
                  <RnDPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/deployment"
              element={
                <DroneDataProvider>
                  <DeploymentPage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/architecture"
              element={
                <DroneDataProvider>
                  <ArchitecturePage />
                </DroneDataProvider>
              }
            />
            <Route
              path="/settings"
              element={
                <DroneDataProvider>
                  <SettingsPage />
                </DroneDataProvider>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </ThemeProvider>
  );
}
