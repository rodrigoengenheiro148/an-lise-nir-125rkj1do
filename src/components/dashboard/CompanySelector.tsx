import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
import { storageService } from '@/services/storage'
import { Company } from '@/types/dashboard'

interface CompanySelectorProps {
  selected: Company
  onSelect: (company: Company) => void
}

export const CompanySelector = ({
  selected,
  onSelect,
}: CompanySelectorProps) => {
  const [companies, setCompanies] = useState<string[]>([])
  const [newCompanyName, setNewCompanyName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setCompanies(storageService.getCompanies())
  }, [])

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      const updated = storageService.addCompany(newCompanyName.trim())
      setCompanies(updated)
      onSelect(newCompanyName.trim())
      setNewCompanyName('')
      setIsDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-muted-foreground hidden md:inline">
          Empresa:
        </span>
        <Select value={selected} onValueChange={(val) => onSelect(val)}>
          <SelectTrigger className="w-[180px] md:w-[240px] bg-background border-input">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="Adicionar Empresa">
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
            <Button onClick={handleAddCompany}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
