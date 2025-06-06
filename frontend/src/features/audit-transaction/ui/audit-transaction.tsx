import { FC, useState } from 'react'
import { Button, Form, FormField } from '@solana-foundation/ms-tools-ui'
import * as Icons from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Content } from '@/shared/ui/content'
import { FormItemInput } from '@/shared/ui/form'

type FormValues = {
  transaction: string
}

export const AuditTransaction: FC = () => {
  // TODO: fill transactions from the backend
  const [transactions, setTransactions] = useState<number[]>([])

  const form = useForm<FormValues>({
    defaultValues: { transaction: '' },
    mode: 'onChange',
  })

  const {
    formState: { isSubmitting, isValid },
  } = form

  const handleSubmit = async (values: FormValues) => {
    console.log(values)
  }

  return (
    <Form {...form}>
      <Content>
        <p>Decrypt transfer amounts of transactions with the confidential transfer auditor key</p>

        <FormField
          control={form.control}
          name="transaction"
          rules={{
            required: 'Transaction is required',
          }}
          render={({ field }) => (
            <FormItemInput label="Transaction hash" disabled={isSubmitting} {...field} />
          )}
        />

        {transactions.length === 0 && (
          <FormItemInput
            label="Transaction hash"
            disabled={true}
            placeholder="$$$$$"
            icon={<Icons.Lock />}
          />
        )}

        {transactions.map((transfer, index) => (
          <FormItemInput
            key={index}
            label={`Transfer ${index + 1}`}
            readOnly={true}
            icon={<Icons.Unlock />}
            value={transfer}
          />
        ))}

        {transactions.length === 0 && (
          <Button onClick={() => setTransactions([1, 2, 3])}>
            <Icons.Wallet />
            Connect auditor wallet
          </Button>
        )}

        {transactions.length > 0 && (
          <Button>
            <Icons.Unlock />
            Decrypt balance
          </Button>
        )}

        {/* <Button variant="outline">Clear</Button> */}
      </Content>
    </Form>
  )
}
