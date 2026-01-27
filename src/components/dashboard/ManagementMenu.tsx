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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Settings, Upload, Trash2, Loader2, Database } from 'lucide-react'
import { ImportDialog } from './ImportDialog'
import { CompanyEntity } from '@/types/dashboard'
import { api } from '@/services/api'
import { toast } from 'sonner'

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

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  const handleClearDatabase = async () => {
    if (!selectedCompanyId) {
      toast.error('Selecione uma empresa para limpar os dados.')
      return
    }

    setIsDeleting(true)
    try {
      await api.deleteCompanyRecords(selectedCompanyId)
      toast.success('Base de dados limpa com sucesso!')
      onDataChange()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao limpar base de dados.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 border-zinc-700 text-zinc-300"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Gerenciamento</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-zinc-950 border-zinc-800 text-zinc-100 min-w-[200px]"
        >
          <DropdownMenuLabel>Opções</DropdownMenuLabel>
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
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={!selectedCompanyId}
          >
            <Trash2 className="h-4 w-4" />
            Limpar Base de Dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={onDataChange}
        defaultMaterial={defaultMaterial}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <Database className="h-5 w-5" />
              Limpar Base de Dados?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação é <strong>irreversível</strong>.
              {selectedCompany && (
                <span className="block mt-2 text-zinc-300">
                  Todos os registros da empresa{' '}
                  <span className="font-semibold text-white">
                    {selectedCompany.name}
                  </span>{' '}
                  serão excluídos permanentemente.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleClearDatabase()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir Tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
