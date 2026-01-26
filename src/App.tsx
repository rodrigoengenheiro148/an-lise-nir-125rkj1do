import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from '@/pages/Index'
import AnalysisPage from '@/pages/AnalysisPage'
import NotFound from '@/pages/NotFound'
import { DashboardProvider } from '@/stores/useDashboardStore'

const App = () => (
  <TooltipProvider>
    <Toaster />
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  </TooltipProvider>
)

export default App
