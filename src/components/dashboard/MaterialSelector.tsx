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
    <div className="flex items-center gap-2 w-full">
      <div className="flex items-center space-x-2 w-full">
        <span className="text-sm font-medium text-muted-foreground hidden md:inline whitespace-nowrap">
          Material:
        </span>
        <Select
          value={selectedMaterial}
          onValueChange={onSelect}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-full bg-background border-input min-w-[180px]">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Carregando...</span>
              </div>
            ) : (
              <SelectValue
                placeholder={
                  materials.length === 0 ? 'Sem materiais' : 'Selecione...'
                }
              />
            )}
          </SelectTrigger>
          <SelectContent>
            {materials.map((material) => (
              <SelectItem key={material} value={material}>
                {material}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
