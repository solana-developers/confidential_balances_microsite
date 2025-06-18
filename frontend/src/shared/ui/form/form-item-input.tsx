import { FC, InputHTMLAttributes, ReactNode } from 'react'
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@solana-foundation/ms-tools-ui/components/form'
import { Input } from '@/shared/ui/input'

interface FormItemProps extends InputHTMLAttributes<HTMLInputElement> {
  description?: ReactNode
  label?: string
  hint?: string
  icon?: React.ReactNode
}

export const FormItemInput: FC<FormItemProps & InputHTMLAttributes<HTMLInputElement>> = ({
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
        <Input {...inputProps} />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  )
}
