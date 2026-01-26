import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MATERIALS_OPTIONS } from '@/types/dashboard'
import { Loader2 } from 'lucide-react'

interface MaterialSelectorProps {
  selectedMaterial: string
  onSelect: (material: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export const MaterialSelector = ({
  selectedMaterial,
  onSelect,
  disabled = false,
  isLoading = false,
}: MaterialSelectorProps) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center space-x-2 w-full">
        <span className="text-sm font-medium text-muted-foreground hidden md:inline whitespace-nowrap">
          Material:
        </span>
        <Select
          value={selectedMaterial || 'all'}
          onValueChange={onSelect}
          disabled={disabled}
        >
          <SelectTrigger className="w-full bg-background border-input">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Carregando...</span>
              </div>
            ) : (
              <SelectValue placeholder="Selecione..." />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {MATERIALS_OPTIONS.map((material) => (
              <SelectItem key={material} value={material}>
                <span className="capitalize">{material}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
