import { useState, useEffect, Fragment } from 'react'
import { AnalysisRecord, METRICS } from '@/types/dashboard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Trash2 } from 'lucide-react'
import { EditRecordDialog } from './EditRecordDialog'
import { api } from '@/services/api'
import { toast } from 'sonner'
import {
  calculateResidue,
  getResidueColor,
  formatResidue,
} from '@/lib/calculations'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DataManagementTableProps {
  records: AnalysisRecord[]
  onDataChange?: () => void
  readOnly?: boolean
  targetMetric?: string // Kept for compatibility but ignored in new layout
}

const EditableCell = ({
  value,
  onSave,
  readOnly,
  type = 'number',
}: {
  value: string | number | undefined | null
  onSave: (val: string | number | null) => void
  readOnly?: boolean
  type?: string
}) => {
  const [localValue, setLocalValue] = useState<string>('')

  useEffect(() => {
    setLocalValue(value !== undefined && value !== null ? String(value) : '')
  }, [value])

  const handleBlur = () => {
    if (readOnly) return
    const currentNum =
      value !== undefined && value !== null ? parseFloat(String(value)) : null
    const newNum = localValue === '' ? null : parseFloat(localValue)

    // Only save if changed
    if (currentNum !== newNum) {
      onSave(newNum)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  if (readOnly) {
    return (
      <span className="text-xs font-mono">
        {value !== undefined && value !== null ? Number(value).toFixed(2) : '-'}
      </span>
    )
  }

  return (
    <Input
      type={type}
      step="0.01"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-7 w-full min-w-[60px] bg-transparent border-transparent hover:border-zinc-700 focus:border-blue-500 px-1 text-center text-xs font-mono"
    />
  )
}

export const DataManagementTable = ({
  records,
  onDataChange,
  readOnly = false,
}: DataManagementTableProps) => {
  const [editingRecord, setEditingRecord] = useState<AnalysisRecord | null>(
    null,
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Alert Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setIsDeleteAlertOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await api.deleteRecord(deleteId)
      toast.success('Registro excluído com sucesso!')
      if (onDataChange) onDataChange()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir registro.')
    } finally {
      setDeleteId(null)
      setIsDeleteAlertOpen(false)
    }
  }

  const handleEdit = (record: AnalysisRecord) => {
    setEditingRecord(record)
    setIsDialogOpen(true)
  }

  const handleCellUpdate = async (
    recordId: string,
    field: string,
    newValue: string | number | null,
  ) => {
    try {
      await api.updateRecord(recordId, { [field]: newValue })
      if (onDataChange) onDataChange()
      toast.success('Valor atualizado', { duration: 1000 })
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar alteração')
    }
  }

  return (
    <>
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
        <Table className="border-collapse border-spacing-0">
          <TableHeader>
            {/* Group Header Row */}
            <TableRow className="border-zinc-800 hover:bg-transparent">
              {/* Sticky Columns Group */}
              <TableHead
                rowSpan={2}
                className="w-[150px] min-w-[150px] bg-zinc-900/95 backdrop-blur z-30 sticky left-0 border-r border-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]"
              >
                Material
              </TableHead>
              <TableHead
                rowSpan={2}
                className="w-[150px] min-w-[150px] bg-zinc-900/95 backdrop-blur z-30 sticky left-[150px] border-r border-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]"
              >
                Submaterial
              </TableHead>
              <TableHead
                rowSpan={2}
                className="w-[200px] min-w-[200px] bg-zinc-900/95 backdrop-blur z-30 sticky left-[300px] border-r border-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]"
              >
                Empresa
              </TableHead>

              {/* Metric Groups */}
              {METRICS.map((m) => (
                <TableHead
                  key={m.key}
                  colSpan={3}
                  className="text-center border-l border-r border-zinc-800 bg-zinc-800/80 text-zinc-100 font-bold tracking-wider py-2"
                  style={{ color: m.color }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    {m.label} ({m.unit})
                  </div>
                </TableHead>
              ))}

              {!readOnly && (
                <TableHead
                  rowSpan={2}
                  className="w-[100px] min-w-[100px] bg-zinc-900/95 backdrop-blur z-20 sticky right-0 border-l border-zinc-800 text-center"
                >
                  Ações
                </TableHead>
              )}
            </TableRow>

            {/* Sub-column Header Row */}
            <TableRow className="border-zinc-800 hover:bg-transparent">
              {METRICS.map((m) => (
                <Fragment key={m.key}>
                  <TableHead className="text-center bg-zinc-900/40 text-[10px] font-bold text-zinc-400 border-l border-zinc-800/50 h-8 p-1 w-[80px]">
                    LAB
                  </TableHead>
                  <TableHead className="text-center bg-zinc-900/40 text-[10px] font-bold text-blue-400 border-zinc-800/50 h-8 p-1 w-[80px]">
                    ANL
                  </TableHead>
                  <TableHead className="text-center bg-zinc-900/40 text-[10px] font-bold text-zinc-500 border-r border-zinc-800/50 h-8 p-1 w-[80px]">
                    RESÍDUO
                  </TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                className="border-zinc-800 hover:bg-zinc-800/30 transition-colors"
              >
                {/* Sticky Identifiers */}
                <TableCell className="text-zinc-300 text-xs font-medium whitespace-nowrap bg-zinc-900/95 backdrop-blur z-20 sticky left-0 border-r border-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  {record.material || '-'}
                </TableCell>
                <TableCell className="text-zinc-400 text-xs whitespace-nowrap bg-zinc-900/95 backdrop-blur z-20 sticky left-[150px] border-r border-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  {record.submaterial || '-'}
                </TableCell>
                <TableCell className="text-zinc-200 text-sm whitespace-nowrap bg-zinc-900/95 backdrop-blur z-20 sticky left-[300px] border-r border-zinc-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-2">
                    {record.company_logo ? (
                      <img
                        src={record.company_logo}
                        alt={record.company}
                        className="h-5 w-5 rounded-sm object-contain bg-white/5 p-0.5"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-sm bg-zinc-800 flex items-center justify-center text-[9px] text-zinc-500 font-bold">
                        {record.company?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span
                      className="truncate max-w-[150px]"
                      title={record.company}
                    >
                      {record.company}
                    </span>
                  </div>
                </TableCell>

                {/* Metric Columns */}
                {METRICS.map((m) => {
                  const labKey = `${m.key}_lab`
                  const anlKey = `${m.key}_anl`
                  const labVal = record[labKey]
                  const anlVal = record[anlKey]
                  const residue = calculateResidue(labVal, anlVal)

                  return (
                    <Fragment key={m.key}>
                      <TableCell className="p-1 border-l border-zinc-800/30 text-center">
                        <EditableCell
                          value={labVal}
                          onSave={(val) =>
                            handleCellUpdate(record.id, labKey, val)
                          }
                          readOnly={readOnly}
                        />
                      </TableCell>

                      <TableCell className="p-1 border-zinc-800/30 text-center">
                        <div className="text-blue-400">
                          <EditableCell
                            value={anlVal}
                            onSave={(val) =>
                              handleCellUpdate(record.id, anlKey, val)
                            }
                            readOnly={readOnly}
                          />
                        </div>
                      </TableCell>

                      <TableCell
                        className={cn(
                          'p-1 border-r border-zinc-800/30 text-center text-xs font-mono font-medium',
                          getResidueColor(residue),
                        )}
                      >
                        {formatResidue(residue)}
                      </TableCell>
                    </Fragment>
                  )
                })}

                {!readOnly && (
                  <TableCell className="text-right p-2 bg-zinc-900/95 backdrop-blur z-20 sticky right-0 border-l border-zinc-800">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-white"
                        onClick={() => handleEdit(record)}
                        title="Editar Detalhes"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-red-500"
                        onClick={() => confirmDelete(record.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3 + METRICS.length * 3 + (readOnly ? 0 : 1)}
                  className="h-32 text-center text-zinc-500"
                >
                  Nenhum registro encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditRecordDialog
        mode="edit"
        record={editingRecord}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          if (onDataChange) onDataChange()
        }}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              registro de análise do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
