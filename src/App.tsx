import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from '@/pages/Index'
import DataManagementPage from '@/pages/DataManagementPage'
import AnalysisPage from '@/pages/AnalysisPage'
import NotFound from '@/pages/NotFound'

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/management" element={<DataManagementPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
)

export default App
