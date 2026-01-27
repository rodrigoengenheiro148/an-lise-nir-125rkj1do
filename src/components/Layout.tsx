import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Outlet, Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/components/AuthProvider'
import { LogOut, LogIn } from 'lucide-react'
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 md:h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-3 md:px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger className="-ml-1 md:-ml-2 text-zinc-400 hover:text-white h-10 w-10 md:h-8 md:w-8" />
            <Separator
              orientation="vertical"
              className="mr-1 md:mr-2 h-6 bg-zinc-800 hidden sm:block"
            />

            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded bg-white/10 p-1 flex items-center justify-center overflow-hidden border border-zinc-700">
                <img
                  src="https://img.usecurling.com/i?q=agriculture&shape=outline&color=blue"
                  alt="Company Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xs md:text-sm font-bold text-zinc-100 leading-none">
                  Análise NIR
                </h1>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5 hidden sm:block">
                  Plataforma de Gestão Laboratorial
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <>
                <span className="hidden lg:inline-block text-xs text-zinc-300 font-medium">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className="text-zinc-500 hover:text-red-400 hover:bg-zinc-900 h-10 w-10 md:h-9 md:w-9"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-zinc-400 hover:text-white hover:bg-zinc-900 gap-2 h-10 px-4 md:h-9"
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  <span className="inline">Entrar</span>
                </Link>
              </Button>
            )}
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
