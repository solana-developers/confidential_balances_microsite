import { ComponentProps, MouseEvent, ReactNode, useId } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@solana-foundation/ms-tools-ui/components/table'
import { cva, VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

type Action = {
  action: string
  title: string
  onClick?: (_a: Action['action'], _b: MouseEvent<HTMLButtonElement>) => void
  icon?: ReactNode
}

type Props = {
  actions?: Action[]
  actionProps?: {}
  emptyComp?: ReactNode
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
  emptyComp,
  headers,
  rows,
  labels = LABELS,
  title,
}: Props) {
  const ActionsComp = asChild ? Slot : 'span'

  return (
    <div className={cn(dataTableVariants(), className)}>
      {title ? (
        <div className="flex flex-col justify-between gap-2 px-6 py-4 sm:flex-row">
          {title}
          {actions ? (
            <ActionsComp
              data-slot="data-table-actions"
              className="flex flex-row flex-wrap items-center gap-1 overflow-hidden"
              {...actionProps}
            >
              {actions.map(({ icon, ...action }) => (
                <Button
                  aria-label={`${action.action}`}
                  key={action.action}
                  size="sm"
                  variant="outline"
                  onClick={action?.onClick?.bind(null, action.action)}
                >
                  {icon ?? undefined}
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
          ) : emptyComp ? (
            <TableCaption className="text-muted mt-0 px-6 text-left">{emptyComp}</TableCaption>
          ) : (
            <TableCaption className="text-muted mt-0 px-6 text-left">{labels.empty}</TableCaption>
          )}
        </Table>
      </div>
    </div>
  )
}

function Row({ row }: { row: ReactNode[] }) {
  const id = useId()

  return (
    <TableRow key={id}>
      {row.map((rowEl, i) => (
        <TableCell key={`table-row-cell-${i}`}>{rowEl}</TableCell>
      ))}
    </TableRow>
  )
}
