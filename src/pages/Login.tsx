import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos.')
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error('Erro de login:', error)

        if (
          error.message === 'Invalid login credentials' ||
          error.status === 400
        ) {
          toast.error(
            'Credenciais inválidas. Verifique seu e-mail e senha e tente novamente.',
          )
        } else if (error.message.includes('Email not confirmed')) {
          toast.error(
            'Email não confirmado. Por favor, verifique sua caixa de entrada.',
          )
        } else {
          toast.error(`Erro ao fazer login: ${error.message}`)
        }
      } else {
        toast.success('Login realizado com sucesso!')
        navigate('/')
      }
    } catch (err: any) {
      console.error('Exceção durante login:', err)
      toast.error(
        'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 animate-fade-in-up">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Acesso Restrito
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Entre com suas credenciais para acessar o dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-zinc-400">Não tem uma conta? </span>
              <Link
                to="/signup"
                className="text-blue-500 hover:text-blue-400 hover:underline"
              >
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
