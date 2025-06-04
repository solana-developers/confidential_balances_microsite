import { ComponentProps, MouseEvent, ReactNode, useId } from 'react'
import {
  Button,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@hoodieshq/ms-tools-ui'
import { Slot } from '@radix-ui/react-slot'
import { cva, VariantProps } from 'class-variance-authority'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils'

type Action = {
  action: string
  title: string
  onClick?: (a: Action['action'], b: MouseEvent<HTMLButtonElement>) => void
  icon?: LucideIcon | ReactNode
}

type Props = {
  actions?: Action[]
  actionProps?: {}
  headers?: ReactNode[]
  labels?: { empty: Required<ReactNode> } & {
    [key: string]: ReactNode
  }
  rows?: ReactNode[][]
  title?: string
  asChild?: boolean
} & ComponentProps<'table'> &
  VariantProps<typeof dataTableVariants>

const LABELS = {
  empty: 'No data to display',
}

const dataTableVariants = cva(
  'border bg-(color:--table-background) border-(color:--table-stroke) flex flex-col rounded'
)

const tableInnerVariants = cva('', {
  variants: {
    headless: {
      default: 'py-4',
      noTitle: 'pb-4',
    },
  },
  defaultVariants: {
    headless: 'default',
  },
})

export function DataTable({
  actions,
  actionProps = {},
  asChild = false,
  className,
  headers,
  rows,
  labels = LABELS,
  title,
}: Props) {
  const ActionsComp = asChild ? Slot : 'span'

  return (
    <div className={cn(dataTableVariants(), className)}>
      {title ? (
        <div className="flex flex-row justify-between px-6 py-4">
          {title}
          {actions ? (
            <ActionsComp
              data-slot="data-table-actions"
              className="flex flex-row items-center gap-1"
              {...actionProps}
            >
              {actions.map(({ icon: Icon, ...action }) => (
                <Button
                  aria-label={`${action.action}`}
                  key={action.action}
                  size="sm"
                  variant="secondary"
                  onClick={action?.onClick?.bind(null, action.action)}
                >
                  {Icon ? <Icon /> : undefined}
                  {action.title}
                </Button>
              ))}
            </ActionsComp>
          ) : undefined}
        </div>
      ) : undefined}
      <div className={tableInnerVariants({ headless: title ? 'default' : 'noTitle' })}>
        <Table>
          {rows?.length ? (
            <>
              {headers ? (
                <TableHeader>
                  <TableRow>
                    {headers.map((header, i) => (
                      <TableHead key={`table-head-${i}`}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
              ) : undefined}
              <TableBody>
                {rows.map((row, i) => {
                  return <Row key={`table-row-${i}`} row={row} />
                })}
              </TableBody>
            </>
          ) : (
            <TableCaption className="text-muted mt-0 px-6 text-left">{labels.empty}</TableCaption>
          )}
        </Table>
      </div>
    </div>
  )
}

function Row({ row }: { row: (string | JSX.Element)[] }) {
  const id = useId()

  return (
    <TableRow key={id}>
      {row.map((rowEl, i) => (
        <TableCell key={`table-row-cell-${i}`}>{rowEl}</TableCell>
      ))}
    </TableRow>
  )
}
