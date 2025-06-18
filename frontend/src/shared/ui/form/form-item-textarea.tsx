import { FC, ReactNode, TextareaHTMLAttributes } from 'react'
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@solana-foundation/ms-tools-ui/components/form'
import { Textarea } from '@/shared/ui/input'

interface FormItemProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  description?: ReactNode
  label?: string
  hint?: string
  icon?: React.ReactNode
}

export const FormItemTextarea: FC<FormItemProps & TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  description,
  label,
  hint,
  ...inputProps
}) => {
  return (
    <FormItem>
      {(label || hint) && (
        <FormLabel className="flex flex-nowrap items-center gap-2 text-sm leading-5 font-normal text-white">
          {label && <span className="flex-1">{label}</span>}
          {hint && <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{hint}</span>}
        </FormLabel>
      )}
      <FormControl>
        <Textarea {...inputProps} />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  )
}
