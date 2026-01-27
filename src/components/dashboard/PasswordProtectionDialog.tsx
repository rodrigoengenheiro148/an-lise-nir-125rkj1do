import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LockKeyhole } from 'lucide-react'
import useDashboardStore from '@/stores/useDashboardStore'
import { cn } from '@/lib/utils'

interface PasswordProtectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  title?: string
  description?: string
}

const ADMIN_PASSWORD = '16071997'

export function PasswordProtectionDialog({
  open,
  onOpenChange,
  onSuccess,
  title = 'Acesso Restrito',
  description = 'Digite a senha de administrador para continuar.',
}: PasswordProtectionDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const { unlockAdmin } = useDashboardStore()

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      unlockAdmin()
      setError(false)
      setPassword('')
      onSuccess()
      onOpenChange(false)
    } else {
      setError(true)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword('')
      setError(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <LockKeyhole className="h-5 w-5 text-blue-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleConfirm} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha de Acesso</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(false)
              }}
              className={cn(
                'bg-zinc-900 border-zinc-700 focus-visible:ring-blue-500',
                error && 'border-red-500 focus-visible:ring-red-500',
              )}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                Senha incorreta. Tente novamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
