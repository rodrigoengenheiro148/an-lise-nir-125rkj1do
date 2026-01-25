import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password)
        if (error) {
          setErrorMsg(error.message || 'Erro ao criar conta.')
          toast.error('Não foi possível criar a conta.')
        } else if (data.session) {
          toast.success('Conta criada com sucesso!')
          navigate('/')
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar.')
          setIsSignUp(false)
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          if (
            error.status === 400 ||
            error.message.includes('Invalid login credentials')
          ) {
            setErrorMsg('Email ou senha incorretos.')
            toast.error('Credenciais inválidas.')
          } else {
            setErrorMsg(error.message)
            toast.error('Ocorreu um erro ao entrar.')
          }
        } else {
          toast.success('Login realizado com sucesso!')
          navigate('/')
        }
      }
    } catch (error: any) {
      console.error(error)
      setErrorMsg('Ocorreu um erro inesperado.')
      toast.error('Erro inesperado de conexão.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1920/1080?q=agriculture%20technology&color=black')] bg-cover bg-center opacity-10"></div>

      <Card className="w-full max-w-md bg-zinc-900/90 backdrop-blur border-zinc-800 text-zinc-100 z-10 shadow-2xl animate-fade-in-up duration-500">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Criar Nova Conta' : 'Acesso Restrito'}
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            {isSignUp
              ? 'Preencha seus dados para acessar a plataforma'
              : 'Entre com suas credenciais para continuar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {errorMsg && (
              <Alert
                variant="destructive"
                className="bg-red-900/20 border-red-900/50 text-red-200 animate-fade-in"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-zinc-950/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-zinc-950/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Cadastrar' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-zinc-800/50 pt-6">
          <div className="text-center text-sm text-zinc-400 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>
              {isSignUp ? 'Já possui uma conta?' : 'Não possui uma conta?'}
            </span>
            <Button
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setErrorMsg(null)
                setEmail('')
                setPassword('')
              }}
              className="text-blue-400 hover:text-blue-300 p-0 h-auto font-normal underline-offset-4"
            >
              {isSignUp ? 'Fazer Login' : 'Criar Conta'}
            </Button>
          </div>

          {!isSignUp && (
            <div className="text-center text-xs text-zinc-600 bg-zinc-950/50 py-2 rounded border border-zinc-800/50 w-full">
              <p className="font-mono">Demo: user@example.com / password123</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
