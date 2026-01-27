import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Loader2, KeyRound, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!email) {
      toast.error('Por favor, digite seu e-mail.')
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await resetPassword(email)

      if (error) {
        console.error('Erro ao solicitar redefinição:', error)
        toast.error('Erro ao enviar e-mail: ' + error.message)
      } else {
        setIsSuccess(true)
        toast.success('Link de recuperação enviado com sucesso!')
      }
    } catch (err: any) {
      console.error('Exceção:', err)
      toast.error('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative">
      <Link
        to="/login"
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para Login</span>
      </Link>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 animate-fade-in-up">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <KeyRound className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            {isSuccess
              ? 'Verifique sua caixa de entrada'
              : 'Digite seu e-mail para receber um link de redefinição'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center space-y-2 animate-fade-in">
              <p className="text-green-400 font-medium">E-mail enviado!</p>
              <p className="text-sm text-green-300/80">
                Enviamos um link de recuperação para <strong>{email}</strong>.
                Por favor, verifique sua caixa de entrada e spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500 pl-9"
                    required
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            to="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Lembrou sua senha? Faça login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
