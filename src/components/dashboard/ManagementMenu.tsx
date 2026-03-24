import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  Download,
} from 'lucide-react'
import { ImportDialog } from './ImportDialog'
import { ExportDialog } from './ExportDialog'
import {
  CompanyEntity,
  MATERIALS_OPTIONS,
  getMaterialDisplayName,
  METRICS,
} from '@/types/dashboard'
import { api } from '@/services/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import useDashboardStore from '@/stores/useDashboardStore'
import { PasswordProtectionDialog } from './PasswordProtectionDialog'

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
  const { isAdminUnlocked, materials } = useDashboardStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMode, setDeleteMode] = useState<
    'company' | 'all' | 'material' | 'metric'
  >('company')
  const [selectedMaterialToDelete, setSelectedMaterialToDelete] =
    useState<string>('')
  const [selectedMetricToDelete, setSelectedMetricToDelete] =
    useState<string>('')
  const [password, setPassword] = useState('')

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId)

  const handleAdminClick = (e: React.MouseEvent) => {
    if (!isAdminUnlocked) {
      e.preventDefault()
      setIsPasswordOpen(true)
    } else {
      // Logic handled by DropdownMenuTrigger normally
    }
  }

  const handleDeleteClick = (
    mode: 'company' | 'all' | 'material' | 'metric',
    material?: string,
    metricKey?: string,
  ) => {
    setDeleteMode(mode)
    setPassword('')
    if (mode === 'material') {
      setSelectedMaterialToDelete(
        material || defaultMaterial || materials[0] || MATERIALS_OPTIONS[0],
      )
      setSelectedMetricToDelete('')
    } else if (mode === 'metric') {
      setSelectedMetricToDelete(metricKey || '')
      setSelectedMaterialToDelete('')
    }
    setIsDeleteDialogOpen(true)
  }

  const handleVerifyAndClear = async () => {
    if (
      (deleteMode === 'company' ||
        deleteMode === 'material' ||
        deleteMode === 'metric') &&
      !selectedCompanyId
    ) {
      toast.error('Selecione uma empresa para limpar os dados.')
      return
    }

    if (deleteMode === 'material' && !selectedMaterialToDelete) {
      toast.error('Selecione um produto para excluir.')
      return
    }

    if (deleteMode === 'metric' && !selectedMetricToDelete) {
      toast.error('Selecione um parâmetro para excluir.')
      return
    }

    // Strict client-side password check
    if (password !== '16071997') {
      toast.error('Senha incorreta. A exclusão não foi realizada.')
      return
    }

    setIsDeleting(true)
    try {
      const companyToDelete = deleteMode === 'all' ? null : selectedCompanyId
      const materialToDelete =
        deleteMode === 'material' ? selectedMaterialToDelete : undefined
      const metricToDelete =
        deleteMode === 'metric' ? selectedMetricToDelete : undefined

      await api.clearDatabase(
        companyToDelete,
        password,
        materialToDelete,
        metricToDelete,
      )

      if (deleteMode === 'all') {
        toast.success('Todos os dados do sistema foram excluídos com sucesso!')
      } else if (deleteMode === 'material') {
        toast.success(
          `Dados de ${getMaterialDisplayName(selectedMaterialToDelete)} da empresa ${selectedCompany?.name} removidos com sucesso!`,
        )
      } else if (deleteMode === 'metric') {
        const metricName = METRICS.find(
          (m) => m.key === selectedMetricToDelete,
        )?.label
        toast.success(
          `Dados do parâmetro ${metricName} da empresa ${selectedCompany?.name} removidos com sucesso!`,
        )
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

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full md:w-auto gap-2 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-11 md:h-10"
            onClick={handleAdminClick}
          >
            <Settings className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Admin</span>
            <span className="sm:hidden">Opções</span>
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
            className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-100 gap-2 min-h-[44px]"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="h-4 w-4 text-emerald-500" />
            Importar Dados em Massa
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer focus:bg-zinc-900 focus:text-zinc-100 gap-2 min-h-[44px]"
            onClick={() => setIsExportOpen(true)}
          >
            <Download className="h-4 w-4 text-blue-500" />
            Exportar Dados (Excel)
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-zinc-800" />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-red-400 gap-2 min-h-[44px]"
              disabled={!selectedCompanyId || materials.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Limpar Dados (Por Produto/Matéria-Prima)
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-zinc-950 border-zinc-800 text-zinc-100 min-w-[200px] max-h-[300px] overflow-y-auto">
              {materials.map((m) => (
                <DropdownMenuItem
                  key={m}
                  className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-zinc-300 gap-2"
                  onClick={() => handleDeleteClick('material', m)}
                >
                  <Trash2 className="h-3 w-3 text-red-400/70" />
                  {getMaterialDisplayName(m)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-red-400 gap-2 min-h-[44px]"
              disabled={!selectedCompanyId}
            >
              <Trash2 className="h-4 w-4" />
              Limpar Dados (Por Parâmetro/Análise)
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-zinc-950 border-zinc-800 text-zinc-100 min-w-[200px] max-h-[300px] overflow-y-auto">
              {METRICS.map((m) => (
                <DropdownMenuItem
                  key={m.key}
                  className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-zinc-300 gap-2"
                  onClick={() => handleDeleteClick('metric', undefined, m.key)}
                >
                  <Trash2 className="h-3 w-3 text-red-400/70" />
                  {m.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-red-400 gap-2 min-h-[44px]"
            onClick={() => handleDeleteClick('company')}
            disabled={!selectedCompanyId}
          >
            <Trash2 className="h-4 w-4" />
            Limpar Dados (Empresa Inteira)
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer focus:bg-red-950 focus:text-red-400 text-red-400 gap-2 font-bold min-h-[44px]"
            onClick={() => handleDeleteClick('all')}
          >
            <AlertTriangle className="h-4 w-4" />
            Apagar Todos os Dados
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordProtectionDialog
        open={isPasswordOpen}
        onOpenChange={setIsPasswordOpen}
        onSuccess={() => setIsMenuOpen(true)}
        title="Acesso Administrativo"
        description="Esta área é restrita a administradores. Digite a senha para continuar."
      />

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={onDataChange}
        defaultMaterial={defaultMaterial}
      />

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        companies={companies}
        defaultCompanyId={selectedCompanyId}
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
                : deleteMode === 'material'
                  ? 'Apagar Produto Específico'
                  : deleteMode === 'metric'
                    ? 'Apagar Parâmetro Específico'
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
                  ) : deleteMode === 'material' ? (
                    <>
                      Todos os registros do produto{' '}
                      <span className="font-bold text-white">
                        {getMaterialDisplayName(selectedMaterialToDelete)}
                      </span>{' '}
                      da empresa{' '}
                      <span className="font-bold text-white">
                        {selectedCompany?.name}
                      </span>{' '}
                      serão excluídos permanentemente.
                    </>
                  ) : deleteMode === 'metric' ? (
                    <>
                      Todos os valores do parâmetro de análise{' '}
                      <span className="font-bold text-white">
                        {
                          METRICS.find((m) => m.key === selectedMetricToDelete)
                            ?.label
                        }
                      </span>{' '}
                      da empresa{' '}
                      <span className="font-bold text-white">
                        {selectedCompany?.name}
                      </span>{' '}
                      serão excluídos permanentemente.
                    </>
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
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {deleteMode === 'material' && (
              <div className="space-y-2 bg-zinc-900/40 p-3 rounded-md border border-zinc-800/50">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                  Produto a ser excluído
                </Label>
                <div className="text-base font-semibold text-white">
                  {getMaterialDisplayName(selectedMaterialToDelete)}
                </div>
              </div>
            )}

            {deleteMode === 'metric' && (
              <div className="space-y-2 bg-zinc-900/40 p-3 rounded-md border border-zinc-800/50">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">
                  Parâmetro a ser excluído
                </Label>
                <div className="text-base font-semibold text-white">
                  {METRICS.find((m) => m.key === selectedMetricToDelete)?.label}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password-confirm" className="text-zinc-300">
                Senha de Segurança para confirmar
              </Label>
              <Input
                id="password-confirm"
                type="password"
                placeholder="Digite a senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-offset-0 h-11',
                  password.length > 0 && password !== '16071997'
                    ? 'focus-visible:ring-red-500 border-red-500/50'
                    : 'focus-visible:ring-emerald-500',
                )}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              disabled={isDeleting}
              onClick={() => setIsDeleteDialogOpen(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 h-11 sm:h-10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerifyAndClear}
              disabled={
                isDeleting ||
                !password ||
                (deleteMode === 'material' && !selectedMaterialToDelete) ||
                (deleteMode === 'metric' && !selectedMetricToDelete)
              }
              className="bg-red-600 hover:bg-red-700 text-white gap-2 h-11 sm:h-10"
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
