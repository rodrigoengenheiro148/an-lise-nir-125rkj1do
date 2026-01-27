import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 p-4 text-zinc-100">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-red-900/20 p-4">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold">Algo deu errado</h1>
            <p className="text-zinc-400">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página
              para restabelecer a conexão.
            </p>
            {this.state.error && (
              <div className="w-full rounded bg-zinc-900 p-3 text-xs font-mono text-red-300 overflow-auto max-h-32 text-left border border-zinc-800">
                {this.state.error.message}
              </div>
            )}
            <Button
              onClick={() => window.location.reload()}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Recarregar Aplicação
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
