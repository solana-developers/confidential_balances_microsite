'use client'

import { FC, PropsWithChildren, ReactNode } from 'react'
import { Button } from '@solana-foundation/ms-tools-ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@solana-foundation/ms-tools-ui/components/dialog'

type ModalProps = PropsWithChildren<{
  title: string
  icon?: ReactNode
  hide: () => void
  show: boolean
  footerAdditional?: ReactNode
  submit?: () => void
  submitDisabled?: boolean
  submitLabel?: string
  ariaDescribedBy?: string
  description?: string
}>

export const Modal: FC<ModalProps> = ({
  children,
  title,
  icon,
  hide,
  show,
  footerAdditional,
  submit,
  submitDisabled,
  submitLabel,
  ariaDescribedBy = 'modal-description',
  description,
}) => {
  return (
    <Dialog open={show} onOpenChange={hide}>
      <DialogContent aria-describedby={description ? ariaDescribedBy : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-xl font-medium">
            {icon}
            {title}
          </DialogTitle>
          {description && <DialogDescription id={ariaDescribedBy}>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          {footerAdditional && (
            <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {footerAdditional}
            </div>
          )}
          <div className="flex flex-1 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button onClick={hide} variant="ghost">
                Close
              </Button>
            </DialogClose>
            {submit ? (
              <Button type="submit" onClick={submit} disabled={submitDisabled}>
                {submitLabel || 'Save changes'}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
