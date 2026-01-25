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

interface DataManagementTableProps {
  records: AnalysisRecord[]
  onDataChange?: () => void
}

export const DataManagementTable = ({
  records,
  onDataChange,
}: DataManagementTableProps) => {
  const [editingRecord, setEditingRecord] = useState<AnalysisRecord | null>(
    null,
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = async (id: string) => {
    if (
      confirm(
        'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.',
      )
    ) {
      try {
        await api.deleteRecord(id)
        toast.success('Registro excluído com sucesso!')
        if (onDataChange) onDataChange()
      } catch (e) {
        console.error(e)
        toast.error('Erro ao excluir registro.')
      }
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
              <TableHead className="w-[120px] min-w-[120px] text-zinc-400">
                Submaterial
              </TableHead>
              <TableHead className="w-[180px] min-w-[180px] text-zinc-400">
                Empresa
              </TableHead>
              <TableHead className="w-[100px] min-w-[100px] text-zinc-400">
                Data
              </TableHead>
              {METRICS.map((m) => (
                <TableHead
                  key={m.key}
                  className="text-zinc-400 text-center border-l border-zinc-800/50 min-w-[200px]"
                  colSpan={3}
                >
                  {m.label}
                </TableHead>
              ))}
              <TableHead className="text-right text-zinc-400 w-[100px] min-w-[100px] sticky right-0 bg-zinc-900/90 backdrop-blur-sm z-10 border-l border-zinc-800">
                Ações
              </TableHead>
            </TableRow>
            <TableRow className="border-zinc-800 hover:bg-transparent text-[10px] uppercase tracking-wider">
              <TableHead colSpan={3}></TableHead>
              {METRICS.map((m) => {
                if (m.key === 'acidity') {
                  return (
                    <Fragment key={m.key}>
                      <TableHead className="text-zinc-500 text-center border-l border-zinc-800/50">
                        LAB
                      </TableHead>
                      <TableHead className="text-zinc-500 text-center">
                        ANL
                      </TableHead>
                      <TableHead className="text-zinc-500 text-center">
                        RESÍDUOS
                      </TableHead>
                    </Fragment>
                  )
                }
                return (
                  <Fragment key={m.key}>
                    <TableHead className="text-zinc-500 text-center border-l border-zinc-800/50">
                      NIR
                    </TableHead>
                    <TableHead className="text-zinc-500 text-center">
                      LAB
                    </TableHead>
                    <TableHead className="text-zinc-500 text-center">
                      ANL
                    </TableHead>
                  </Fragment>
                )
              })}
              <TableHead className="sticky right-0 bg-zinc-900/90 backdrop-blur-sm z-10 border-l border-zinc-800"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell className="text-zinc-300 text-xs font-medium whitespace-nowrap">
                  {record.material || '-'}
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
                <TableCell className="text-zinc-400 text-xs font-mono whitespace-nowrap">
                  {record.date}
                </TableCell>
                {METRICS.map((m) => {
                  if (m.key === 'acidity') {
                    const lab = Number(record[`${m.key}_lab`] || 0)
                    const anl = Number(record[`${m.key}_anl`] || 0)
                    const residue = lab - anl
                    return (
                      <Fragment key={m.key}>
                        <TableCell className="text-zinc-200 text-xs text-center border-l border-zinc-800/50 font-mono font-medium">
                          {lab.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-blue-400 text-xs text-center font-mono">
                          {anl.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs text-center font-mono">
                          {residue.toFixed(2)}
                        </TableCell>
                      </Fragment>
                    )
                  }
                  return (
                    <Fragment key={m.key}>
                      <TableCell className="text-zinc-400 text-xs text-center border-l border-zinc-800/50 font-mono">
                        {Number(record[`${m.key}_nir`] || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-zinc-200 text-xs text-center font-mono font-medium">
                        {Number(record[`${m.key}_lab`] || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-blue-400 text-xs text-center font-mono">
                        {Number(record[`${m.key}_anl`] || 0).toFixed(2)}
                      </TableCell>
                    </Fragment>
                  )
                })}
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
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
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
    </>
  )
}
