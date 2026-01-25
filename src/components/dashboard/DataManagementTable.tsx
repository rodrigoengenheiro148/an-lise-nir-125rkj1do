import { useState } from 'react'
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
}

export const DataManagementTable = ({ records }: DataManagementTableProps) => {
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
      <div className="rounded-md border border-zinc-800 bg-zinc-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[150px] text-zinc-400">Empresa</TableHead>
              <TableHead className="w-[120px] text-zinc-400">Data</TableHead>
              {METRICS.slice(0, 3).map((m) => (
                <TableHead
                  key={m.key}
                  className="text-zinc-400 text-center"
                  colSpan={2}
                >
                  {m.label}
                </TableHead>
              ))}
              <TableHead className="text-right text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow
                key={record.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell className="font-medium text-zinc-200">
                  {record.company}
                </TableCell>
                <TableCell className="text-zinc-400 text-xs font-mono">
                  {record.date}
                </TableCell>
                {METRICS.slice(0, 3).map((m) => (
                  <>
                    <TableCell
                      key={`${m.key}-l`}
                      className="text-zinc-500 text-xs border-l border-zinc-800/50 text-right"
                    >
                      {Number(record[`${m.key}_lab`]).toFixed(2)}
                    </TableCell>
                    <TableCell
                      key={`${m.key}-n`}
                      className="text-blue-400 text-xs text-right"
                    >
                      {Number(record[`${m.key}_nir`]).toFixed(2)}
                    </TableCell>
                  </>
                ))}
                <TableCell className="text-right">
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
                  colSpan={10}
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
        record={editingRecord}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {}}
      />
    </>
  )
}
