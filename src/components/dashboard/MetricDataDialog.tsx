import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Loader2, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import { toast } from 'sonner'
import {
  MetricKey,
  CompanyEntity,
  MATERIALS_OPTIONS,
  STATIC_SUBMATERIALS,
  METRICS,
} from '@/types/dashboard'
import { calculateResidue, formatResidue } from '@/lib/calculations'

const numberRefinement = (val?: string) => {
  if (!val) return true
  return !isNaN(parseFloat(val.replace(',', '.')))
}

const formSchema = z.object({
  companyId: z.string().min(1, 'Empresa é obrigatória'),
  material: z.string().min(1, 'Material é obrigatório'),
  submaterial: z.string().optional(),
  date: z.date({ required_error: 'Data é obrigatória' }),
  labValue: z
    .string()
    .optional()
    .refine(numberRefinement, 'Deve ser um número válido'),
  anlValue: z
    .string()
    .optional()
    .refine(numberRefinement, 'Deve ser um número válido'),
})

interface MetricDataDialogProps {
  metricKey: MetricKey
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MetricDataDialog({
  metricKey,
  open,
  onOpenChange,
  onSuccess,
}: MetricDataDialogProps) {
  const [companies, setCompanies] = useState<CompanyEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const metricInfo = METRICS.find((m) => m.key === metricKey)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: '',
      material: '',
      submaterial: '',
      labValue: '',
      anlValue: '',
    },
  })

  // Watch values for live residue calculation
  const labVal = form.watch('labValue')
  const anlVal = form.watch('anlValue')

  const currentResidue = calculateResidue(labVal, anlVal)

  useEffect(() => {
    if (open) {
      api.getCompanies().then(setCompanies).catch(console.error)
      form.reset({
        companyId: '',
        material: '',
        submaterial: '',
        date: new Date(),
        labValue: '',
        anlValue: '',
      })
    }
  }, [open, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const parseNumber = (val?: string) => {
        if (!val) return undefined
        const num = parseFloat(val.replace(',', '.'))
        return isNaN(num) ? undefined : num
      }

      const record: any = {
        company_id: values.companyId,
        material: values.material,
        submaterial: values.submaterial,
        date: values.date ? format(values.date, 'yyyy-MM-dd') : null,
      }

      // Set metric specific values
      record[`${metricKey}_lab`] = parseNumber(values.labValue)
      record[`${metricKey}_anl`] = parseNumber(values.anlValue)

      await api.createRecord(record)
      toast.success(`Dados de ${metricInfo?.label} adicionados com sucesso!`)
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar dados.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    const companyId = form.getValues('companyId')

    setIsExporting(true)
    try {
      const blob = await api.exportMetricData(metricKey, companyId || undefined)

      // Ensure we have a Blob before proceeding
      if (!blob) {
        throw new Error('Erro ao obter arquivo de exportação.')
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const companyName = companyId
        ? companies.find((c) => c.id === companyId)?.name || 'Empresa'
        : 'Geral'

      a.download = `Analise_${metricInfo?.label}_${companyName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      document.body.appendChild(a)
      a.click()

      document.body.removeChild(a)
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 100)

      toast.success('Exportação concluída com sucesso!')
    } catch (error) {
      console.error(error)
      const message =
        error instanceof Error
          ? error.message
          : 'Não há dados para exportar ou ocorreu um erro.'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: metricInfo?.color }}
            />
            Adicionar Dados - {metricInfo?.label}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Insira os valores de análise para {metricInfo?.label}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Análise</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700">
                          <SelectValue placeholder="Material..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {MATERIALS_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="submaterial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submaterial (Opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700">
                          <SelectValue placeholder="Submaterial..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {STATIC_SUBMATERIALS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 items-end">
              <FormField
                control={form.control}
                name="labValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">
                      LAB ({metricInfo?.unit})
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        className="bg-zinc-900 border-zinc-700 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="anlValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400">
                      ANL ({metricInfo?.unit})
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        className="bg-zinc-900 border-zinc-700 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2 pb-2">
                <span className="text-sm font-medium text-zinc-400">
                  Resíduo
                </span>
                <div className="h-10 flex items-center justify-center bg-zinc-900/50 border border-zinc-800 rounded-md font-mono text-sm text-zinc-300">
                  {formatResidue(currentResidue)}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Exportar Excel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Dados
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
