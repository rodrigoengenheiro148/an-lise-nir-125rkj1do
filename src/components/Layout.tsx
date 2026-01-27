import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Outlet, Navigate } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/components/AuthProvider'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 text-zinc-400 hover:text-white" />
            <Separator
              orientation="vertical"
              className="mr-2 h-6 bg-zinc-800"
            />

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-white/10 p-1 flex items-center justify-center overflow-hidden border border-zinc-700">
                <img
                  src="https://img.usecurling.com/i?q=agriculture&shape=outline&color=blue"
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-sm font-bold text-zinc-100 leading-none">
                  Análise NIR
                </h1>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Plataforma de Gestão Laboratorial
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-xs text-zinc-300 font-medium">
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="text-zinc-500 hover:text-red-400 hover:bg-zinc-900"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-zinc-950 relative">
          <Outlet />
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
