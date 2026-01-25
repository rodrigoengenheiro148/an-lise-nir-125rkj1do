import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COMPANIES, Company } from '@/types/dashboard'

interface CompanySelectorProps {
  selected: Company
  onSelect: (company: Company) => void
}

export const CompanySelector = ({
  selected,
  onSelect,
}: CompanySelectorProps) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Empresa:
      </span>
      <Select
        value={selected}
        onValueChange={(val) => onSelect(val as Company)}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Selecione uma empresa" />
        </SelectTrigger>
        <SelectContent>
          {COMPANIES.map((company) => (
            <SelectItem key={company} value={company}>
              {company}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
