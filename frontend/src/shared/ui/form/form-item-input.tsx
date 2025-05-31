import { FC, InputHTMLAttributes } from 'react'
import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage,
  FormItem as UIFormItem,
} from '@hoodieshq/ms-tools-ui'
import { Input } from '../input/input'

interface FormItemProps extends InputHTMLAttributes<HTMLInputElement> {
  description?: string
  label?: string
}

export const FormItemInput: FC<FormItemProps & InputHTMLAttributes<HTMLInputElement>> = ({
  description,
  label,
  name,
  value,
  ...inputProps
}) => {
  return (
    <UIFormItem>
      {label && <FormLabel className="text-sm leading-5 font-normal text-white">{label}</FormLabel>}
      <FormControl>
        <Input {...inputProps} />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </UIFormItem>
  )
}
