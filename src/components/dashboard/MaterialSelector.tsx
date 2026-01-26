import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface MaterialSelectorProps {
  selected: string
  onSelect: (material: string) => void
  materials: string[]
  isLoading?: boolean
  disabled?: boolean
}

export const MaterialSelector = ({
  selected,
  onSelect,
  materials,
  isLoading = false,
  disabled = false,
}: MaterialSelectorProps) => {
  const isDisabled = disabled || isLoading || materials.length === 0

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-sm font-medium text-muted-foreground hidden md:inline whitespace-nowrap">
        Material:
      </span>
      <Select value={selected} onValueChange={onSelect} disabled={isDisabled}>
        <SelectTrigger className="w-full bg-background border-input">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Carregando...</span>
            </div>
          ) : (
            <SelectValue
              placeholder={
                materials.length === 0 ? 'Nenhum material' : 'Selecione...'
              }
            />
          )}
        </SelectTrigger>
        <SelectContent>
          {materials.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
