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
import { Loader2, LockKeyhole, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { updatePassword, user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // If user is not logged in and not loading, it means the link is invalid or session not established
    if (!loading && !user) {
      const timer = setTimeout(() => {
        if (!user) {
          // Additional check to avoid race condition if user is being set
          console.warn('No user session found for password reset')
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [user, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await updatePassword(password)

      if (error) {
        console.error('Erro ao atualizar senha:', error)
        toast.error('Erro ao atualizar senha: ' + error.message)
      } else {
        setIsSuccess(true)
        toast.success('Senha atualizada com sucesso!')

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err: any) {
      console.error('Exceção:', err)
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-center text-red-400">
              Link Inválido ou Expirado
            </CardTitle>
            <CardDescription className="text-center text-zinc-400">
              Não foi possível validar sua sessão de recuperação. O link pode
              ter expirado ou já ter sido utilizado.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild variant="secondary">
              <Link to="/forgot-password">Solicitar novo link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 animate-fade-in-up">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <LockKeyhole className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Redefinir Senha
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-fade-in">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-white">Sucesso!</h3>
                <p className="text-zinc-400">
                  Sua senha foi redefinida. Você será redirecionado para o
                  login.
                </p>
              </div>
              <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Link to="/login">Ir para Login agora</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          )}
        </CardContent>
        {!isSuccess && (
          <CardFooter className="justify-center">
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Cancelar e voltar
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
