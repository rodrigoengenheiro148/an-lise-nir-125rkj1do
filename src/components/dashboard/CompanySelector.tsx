import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/services/api'
import { CompanyEntity } from '@/types/dashboard'
import { toast } from 'sonner'

interface CompanySelectorProps {
  selectedCompanyId: string
  companies: CompanyEntity[]
  onSelect: (companyId: string) => void
  onCompanyAdded: (company: CompanyEntity) => void
  placeholder?: string
  isLoading?: boolean
}

export const CompanySelector = ({
  selectedCompanyId,
  companies,
  onSelect,
  onCompanyAdded,
  placeholder = 'Selecione...',
  isLoading = false,
}: CompanySelectorProps) => {
  const [newCompanyName, setNewCompanyName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddCompany = async () => {
    if (newCompanyName.trim()) {
      setIsAdding(true)
      try {
        const added = await api.addCompany(newCompanyName.trim())
        onCompanyAdded(added)
        setNewCompanyName('')
        setIsDialogOpen(false)
        toast.success('Empresa adicionada com sucesso!')
      } catch (e) {
        console.error(e)
        toast.error('Erro ao adicionar empresa.')
      } finally {
        setIsAdding(false)
      }
    }
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center space-x-2 w-full">
        <span className="text-sm font-medium text-muted-foreground hidden md:inline whitespace-nowrap">
          Empresa:
        </span>
        <Select
          value={selectedCompanyId}
          onValueChange={onSelect}
          disabled={isLoading || companies.length === 0}
        >
          <SelectTrigger className="w-full bg-background border-input">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Carregando...</span>
              </div>
            ) : (
              <SelectValue placeholder={placeholder} />
            )}
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            title="Adicionar Empresa"
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Ex: Fazenda Nova Esperança"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCompany} disabled={isAdding}>
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
