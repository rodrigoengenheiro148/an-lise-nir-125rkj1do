import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface MaterialSelectorProps {
  selectedMaterial: string
  materials: string[]
  onSelect: (material: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export const MaterialSelector = ({
  selectedMaterial,
  materials,
  onSelect,
  isLoading = false,
  disabled = false,
}: MaterialSelectorProps) => {
  return (
    <div className="flex items-center space-x-2 w-full sm:w-[250px]">
      <span className="text-sm font-medium text-muted-foreground hidden md:inline whitespace-nowrap">
        Material:
      </span>
      <Select
        value={selectedMaterial || 'all'}
        onValueChange={(value) => onSelect(value === 'all' ? '' : value)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full bg-background border-input">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Carregando...</span>
            </div>
          ) : (
            <SelectValue placeholder="Todos os materiais" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os materiais</SelectItem>
          {materials.map((material) => (
            <SelectItem key={material} value={material}>
              {material}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
