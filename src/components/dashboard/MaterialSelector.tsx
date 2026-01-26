import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MATERIALS_OPTIONS } from '@/types/dashboard'

interface MaterialSelectorProps {
  selected: string
  onSelect: (material: string) => void
  disabled?: boolean
}

export const MaterialSelector = ({
  selected,
  onSelect,
  disabled = false,
}: MaterialSelectorProps) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-sm font-medium text-muted-foreground hidden md:inline whitespace-nowrap">
        Material:
      </span>
      <Select value={selected} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="w-full bg-background border-input">
          <SelectValue placeholder="Selecione o material" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todos</SelectItem>
          {MATERIALS_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
