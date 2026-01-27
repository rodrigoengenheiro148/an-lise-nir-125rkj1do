import { useState } from 'react'
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
import { Loader2, UserPlus, ArrowLeft, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

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

    if (!companyName.trim()) {
      toast.error('O nome da empresa é obrigatório.')
      return
    }

    setIsSubmitting(true)
    try {
      // We pass the company name in the user metadata so the database trigger can pick it up
      // and create the company automatically linked to this user.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName,
          },
        },
      })

      if (error) {
        toast.error('Erro ao criar conta: ' + error.message)
        console.error(error)
      } else {
        if (data.session) {
          toast.success('Conta criada com sucesso! Empresa registrada.')
          navigate('/')
        } else if (data.user) {
          toast.success('Conta criada! Verifique seu email para confirmar.')
          navigate('/login')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocorreu um erro inesperado.')
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
              <UserPlus className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Preencha os dados abaixo para se cadastrar
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-500" />
                Nome da Empresa
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Ex: Minha Agroindústria Ltda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                required
              />
            </div>

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                required
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
                  Criando conta...
                </>
              ) : (
                'Cadastrar'
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-zinc-400">Já tem uma conta? </span>
              <Link
                to="/login"
                className="text-blue-500 hover:text-blue-400 hover:underline"
              >
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
