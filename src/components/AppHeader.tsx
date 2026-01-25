import { useLocation } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Cloud, CloudOff } from 'lucide-react'
import useDashboardStore from '@/stores/useDashboardStore'
import { Separator } from '@/components/ui/separator'

export function AppHeader() {
  const { companies, selectedCompanyId, setSelectedCompanyId, isLoading } =
    useDashboardStore()
  const location = useLocation()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Analítico'
      case '/import':
        return 'Importação de Dados'
      case '/reports':
        return 'Relatórios'
      default:
        return 'Lab Analytics'
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-all">
      <SidebarTrigger className="-ml-2 mr-2" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="font-semibold text-lg hidden md:block">
        {getPageTitle()}
      </h1>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            Status:
          </span>
          {isLoading ? (
            <Cloud className="h-4 w-4 text-yellow-500 animate-pulse" />
          ) : (
            <Cloud className="h-4 w-4 text-green-500" />
          )}
        </div>

        <Separator orientation="vertical" className="h-4 mx-2" />

        <div className="flex items-center gap-2">
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs md:text-sm">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="h-8 hidden md:flex">
          <CalendarIcon className="mr-2 h-3 w-3" />
          <span>Este Mês</span>
        </Button>
      </div>
    </header>
  )
}
