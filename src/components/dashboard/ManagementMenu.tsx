import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Settings,
  Upload,
  Trash2,
  Loader2,
  Database,
  AlertTriangle,
  LayoutDashboard,
} from 'lucide-react'
import { ImportDialog } from './ImportDialog'
import { CompanyEntity } from '@/types/dashboard'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ManagementMenuProps {
  selectedCompanyId?: string
  companies: CompanyEntity[]
  onDataChange: () => void
  defaultMaterial?: string
}

export const ManagementMenu = ({
  selectedCompanyId,
  companies,
  onDataChange,
  defaultMaterial,
}: ManagementMenuProps) => {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single')
  const [password, setPassword] = useState('')

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  const handleVerifyAndClear = async () => {
    if (deleteMode === 'single' && !selectedCompanyId) {
      toast.error('Selecione uma empresa para limpar os dados.')
      return
    }

    // Strict client-side password check
    if (password !== '16071997') {
      toast.error('Senha incorreta. A exclusão não foi realizada.')
      return
    }

    setIsDeleting(true)
    try {
      // Pass null to delete ALL, or selectedCompanyId for specific company
      const companyToDelete = deleteMode === 'all' ? null : selectedCompanyId
      await api.clearDatabase(companyToDelete, password)

      if (deleteMode === 'all') {
        toast.success('Todas os dados do sistema foram excluídos com sucesso!')
      } else {
        toast.success(
          `Base de dados da empresa ${selectedCompany?.name} limpa com sucesso!`,
        )
      }

      onDataChange()
      setIsDeleteDialogOpen(false)
      setPassword('')
    } catch (error: any) {
      console.error(error)
      const errorMsg = error.message || 'Erro ao limpar base de dados.'
      toast.error(errorMsg)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteClick = (mode: 'single' | 'all') => {
    setDeleteMode(mode)
    setPassword('')
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full md:w-auto gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-zinc-950 border-zinc-800 text-zinc-100 min-w-[220px]"
        >
          <DropdownMenuLabel className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Painel de Controle
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />

          <DropdownMenuItem
            className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-100 gap-2"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="h-4 w-4 text-emerald-500" />
            Importar Dados em Massa
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-zinc-800" />

          <DropdownMenuItem
            className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-red-400 gap-2"
            onClick={() => handleDeleteClick('single')}
            disabled={!selectedCompanyId}
          >
            <Trash2 className="h-4 w-4" />
            Limpar Dados (Empresa)
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-red-400 gap-2 font-bold"
            onClick={() => handleDeleteClick('all')}
          >
            <AlertTriangle className="h-4 w-4" />
            Apagar Todos os Dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={onDataChange}
        defaultMaterial={defaultMaterial}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setIsDeleteDialogOpen(open)
        }}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Database className="h-5 w-5" />
              {deleteMode === 'all'
                ? 'Apagar Todos os Dados'
                : 'Confirmar Exclusão (Empresa)'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 space-y-2">
              <span className="flex items-start gap-2 bg-red-950/30 p-3 rounded-md border border-red-900/50 mt-2">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm">
                  Esta ação é <strong>irreversível</strong>.{' '}
                  {deleteMode === 'all' ? (
                    <span className="uppercase font-bold text-red-400">
                      TODOS OS REGISTROS DE TODAS AS EMPRESAS SERÃO EXCLUÍDOS.
                    </span>
                  ) : (
                    <>
                      Todos os registros da empresa{' '}
                      <span className="font-bold text-white">
                        {selectedCompany?.name}
                      </span>{' '}
                      serão excluídos permanentemente.
                    </>
                  )}
                </span>
              </span>
              <span className="block mt-4 text-zinc-300">
                Digite a senha de segurança para confirmar a operação:
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="password-confirm" className="sr-only">
              Senha de Segurança
            </Label>
            <Input
              id="password-confirm"
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-offset-0',
                password.length > 0 && password !== '16071997'
                  ? 'focus-visible:ring-red-500 border-red-500/50'
                  : 'focus-visible:ring-emerald-500',
              )}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              disabled={isDeleting}
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerifyAndClear}
              disabled={isDeleting || !password}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
