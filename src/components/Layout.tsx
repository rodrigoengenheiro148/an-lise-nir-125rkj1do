import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Outlet } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* We can have a global minimal header or let pages handle it */}
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-zinc-800 bg-zinc-950 px-4">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-2 text-zinc-400 hover:text-white" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 bg-zinc-800"
            />
            <span className="font-medium text-sm text-zinc-200">
              Plataforma de Gestão Laboratorial
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-zinc-950">
          <Outlet />
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
