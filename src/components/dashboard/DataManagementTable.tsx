import { useState, Fragment } from 'react'
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

  return (
    <>
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[120px] min-w-[120px] text-zinc-400 sticky left-0 bg-zinc-900/95 backdrop-blur z-20">
                Material
              </TableHead>
              <TableHead className="w-[120px] min-w-[120px] text-zinc-400">
                Submaterial
              </TableHead>
              <TableHead className="w-[180px] min-w-[180px] text-zinc-400">
                Empresa
              </TableHead>
              {/* Date Column Removed */}
              {METRICS.map((m) => (
                <TableHead
                  key={m.key}
                  className="text-zinc-400 text-center border-l border-zinc-800/50"
                  colSpan={3}
                  style={{ minWidth: '240px' }}
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
                <TableHead className="text-right text-zinc-400 w-[100px] min-w-[100px] sticky right-0 bg-zinc-900/90 backdrop-blur-sm z-10 border-l border-zinc-800">
                  Ações
                </TableHead>
              )}
            </TableRow>
            <TableRow className="border-zinc-800 hover:bg-transparent text-[10px] uppercase tracking-wider">
              <TableHead
                className="sticky left-0 bg-zinc-900/95 backdrop-blur z-20"
                colSpan={1}
              ></TableHead>
              <TableHead colSpan={2}></TableHead>
              {METRICS.map((m) => (
                <Fragment key={m.key}>
                  <TableHead className="text-zinc-300 text-center bg-zinc-900/30 font-bold border-l border-zinc-800/50">
                    LAB
                  </TableHead>
                  <TableHead className="text-blue-400/70 text-center bg-zinc-900/30">
                    ANL
                  </TableHead>
                  <TableHead
                    className="text-zinc-500 text-center bg-zinc-900/20"
                    title="Resíduo: LAB - ANL"
                  >
                    Resíduo
                  </TableHead>
                </Fragment>
              ))}
              {!readOnly && (
                <TableHead className="sticky right-0 bg-zinc-900/90 backdrop-blur-sm z-10 border-l border-zinc-800"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell className="text-zinc-300 text-xs font-medium whitespace-nowrap sticky left-0 bg-zinc-900/95 backdrop-blur z-10 border-r border-zinc-800/50">
                  {record.material || '-'}
                </TableCell>
                <TableCell className="text-zinc-400 text-xs whitespace-nowrap">
                  {record.submaterial || '-'}
                </TableCell>
                <TableCell className="text-zinc-200 text-sm whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {record.company_logo ? (
                      <img
                        src={record.company_logo}
                        alt={record.company}
                        className="h-6 w-6 rounded-sm object-contain bg-white/5 p-0.5"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-sm bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                        {record.company.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate max-w-[120px]">
                      {record.company}
                    </span>
                  </div>
                </TableCell>
                {METRICS.map((m) => {
                  const lab = record[`${m.key}_lab`]
                  const anl = record[`${m.key}_anl`]

                  const residue = calculateResidue(lab, anl)

                  return (
                    <Fragment key={m.key}>
                      <TableCell className="text-zinc-200 text-xs text-center font-mono font-medium bg-zinc-900/20 border-l border-zinc-800/50">
                        {lab !== undefined && lab !== null
                          ? Number(lab).toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-blue-400 text-xs text-center font-mono">
                        {anl !== undefined && anl !== null
                          ? Number(anl).toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-xs text-center font-mono',
                          getResidueColor(residue),
                        )}
                      >
                        {formatResidue(residue)}
                      </TableCell>
                    </Fragment>
                  )
                })}
                {!readOnly && (
                  <TableCell className="text-right sticky right-0 bg-zinc-950/90 backdrop-blur-sm z-10 border-l border-zinc-800 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.5)]">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white"
                        onClick={() => handleEdit(record)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-500"
                        onClick={() => confirmDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {records.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3 + METRICS.length * 3 + 1}
                  className="h-24 text-center text-zinc-500"
                >
                  Nenhum registro encontrado.
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
