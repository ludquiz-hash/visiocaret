import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;
const LoginPage = Pages['Login'];

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
            <Route path="/Pricing" element={<Pages['Pricing'] />} />
            <Route path="/Privacy" element={<Pages['Privacy'] />} />
            <Route path="/Terms" element={<Pages['Terms'] />} />
            <Route path="/Legal" element={<Pages['Legal']} />} />

            {/* Protected routes - require authentication */}
            <Route 
              path="/Dashboard" 
              element={
                <ProtectedRoute>
                  <Pages['Dashboard'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Claims" 
              element={
                <ProtectedRoute>
                  <Pages['Claims'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ClaimDetail" 
              element={
                <ProtectedRoute>
                  <Pages['ClaimDetail'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ClaimWizard" 
              element={
                <ProtectedRoute>
                  <Pages['ClaimWizard'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Team" 
              element={
                <ProtectedRoute>
                  <Pages['Team'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/GarageSettings" 
              element={
                <ProtectedRoute>
                  <Pages['GarageSettings'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Settings" 
              element={
                <ProtectedRoute>
                  <Pages['Settings'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/Billing" 
              element={
                <ProtectedRoute>
                  <Pages['Billing'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/QAChecklist" 
              element={
                <ProtectedRoute>
                  <Pages['QAChecklist'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/NativeTest" 
              element={
                <ProtectedRoute>
                  <Pages['NativeTest'] />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/StripeTest" 
              element={
                <ProtectedRoute>
                  <Pages['StripeTest'] />
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
