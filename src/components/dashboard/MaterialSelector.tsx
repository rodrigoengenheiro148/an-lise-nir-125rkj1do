import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MaterialSelectorProps {
  selected: string
  onSelect: (material: string) => void
  materials: string[]
  disabled?: boolean
}

export const MaterialSelector = ({
  selected,
  onSelect,
  materials,
  disabled = false,
}: MaterialSelectorProps) => {
  const isDisabled = disabled || materials.length === 0

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-sm font-medium text-muted-foreground hidden md:inline whitespace-nowrap">
        Material:
      </span>
      <Select value={selected} onValueChange={onSelect} disabled={isDisabled}>
        <SelectTrigger className="w-full bg-background border-input">
          <SelectValue
            placeholder={
              materials.length === 0 ? 'Nenhum material' : 'Selecione...'
            }
          />
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
