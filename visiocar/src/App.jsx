import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

console.log('📦 App.jsx loaded')

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;
const LoginPage = Pages['Login'];

// Extract page components
const PricingPage = Pages['Pricing'];
const PrivacyPage = Pages['Privacy'];
const TermsPage = Pages['Terms'];
const LegalPage = Pages['Legal'];
const DashboardPage = Pages['Dashboard'];
const ClaimsPage = Pages['Claims'];
const ClaimDetailPage = Pages['ClaimDetail'];
const ClaimWizardPage = Pages['ClaimWizard'];
const TeamPage = Pages['Team'];
const GarageSettingsPage = Pages['GarageSettings'];
const SettingsPage = Pages['Settings'];
const BillingPage = Pages['Billing'];
const QAChecklistPage = Pages['QAChecklist'];
const NativeTestPage = Pages['NativeTest'];
const StripeTestPage = Pages['StripeTest'];

const LayoutWrapper = ({ children }) => Layout ?
  <Layout>{children}</Layout>
  : <>{children}</>;

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0E14]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0B0E14]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/Dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            {/* Public routes - accessible without auth */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <MainPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/Landing" 
              element={
                <PublicRoute>
                  <MainPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/Login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route path="/Pricing" element={<PricingPage />} />
            <Route path="/Privacy" element={<PrivacyPage />} />
            <Route path="/Terms" element={<TermsPage />} />
            <Route path="/Legal" element={<LegalPage />} />

            {/* Protected routes - require authentication */}
            <Route 
              path="/Dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Claims" 
              element={
                <ProtectedRoute>
                  <ClaimsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ClaimDetail" 
              element={
                <ProtectedRoute>
                  <ClaimDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ClaimWizard" 
              element={
                <ProtectedRoute>
                  <ClaimWizardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Team" 
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/GarageSettings" 
              element={
                <ProtectedRoute>
                  <GarageSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Billing" 
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/QAChecklist" 
              element={
                <ProtectedRoute>
                  <QAChecklistPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/NativeTest" 
              element={
                <ProtectedRoute>
                  <NativeTestPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/StripeTest" 
              element={
                <ProtectedRoute>
                  <StripeTestPage />
                </ProtectedRoute>
              } 
            />

            {/* 404 */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
