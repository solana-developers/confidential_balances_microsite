'use client'

import { FC, PropsWithChildren } from 'react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@solana-foundation/ms-tools-ui'

type ModalProps = PropsWithChildren<{
  title: string
  hide: () => void
  show: boolean
  submit?: () => void
  submitDisabled?: boolean
  submitLabel?: string
  ariaDescribedBy?: string
  description?: string
}>

export const Modal: FC<ModalProps> = ({
  children,
  title,
  hide,
  show,
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
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription id={ariaDescribedBy}>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
