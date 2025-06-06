import { FC, InputHTMLAttributes } from 'react'
import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage,
  FormItem as UIFormItem,
} from '@solana-foundation/ms-tools-ui'
import { Input } from '../input/input'

interface FormItemProps extends InputHTMLAttributes<HTMLInputElement> {
  description?: string
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
    <UIFormItem>
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
    </UIFormItem>
  )
}
