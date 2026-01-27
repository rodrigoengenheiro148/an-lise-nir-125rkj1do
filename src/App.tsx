import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/components/AuthProvider'
import { DashboardProvider } from '@/stores/useDashboardStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import AnalysisPage from '@/pages/AnalysisPage'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import NotFound from '@/pages/NotFound'

const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <DashboardProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />

              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/analysis" element={<AnalysisPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DashboardProvider>
      </AuthProvider>
    </TooltipProvider>
  </ErrorBoundary>
)

export default App
