'use client'

import { FC, useCallback } from 'react'
import { Form, FormField } from '@solana-foundation/ms-tools-ui/components/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@solana-foundation/ms-tools-ui/components/select'
import { Connection } from '@solana/web3.js'
import { useForm } from 'react-hook-form'
import { ClusterNetwork, useCluster } from '@/shared/solana'
import { FormItemInput } from '@/shared/ui/form'
import { Modal } from '@/shared/ui/modal'
import { useToast } from '@/shared/ui/toast'

type ModalClusterProps = {
  hide: () => void
  show: boolean
}

type FormData = {
  name: string
  endpoint: string
  network: ClusterNetwork | undefined
}

export const ModalCluster: FC<ModalClusterProps> = ({ hide, show }) => {
  const { addCluster } = useCluster()
  const toast = useToast()

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      endpoint: '',
      network: undefined,
    },
    mode: 'onChange',
  })

  const {
    formState: { isValid },
  } = form

  const validateName = (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Cluster name is required'
    }
    return true
  }

  const validateEndpoint = (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Endpoint is required'
    }

    try {
      new URL(value)
      return true
    } catch (error) {
      return 'Invalid endpoint URL format'
    }
  }

  const validateNetwork = (value: ClusterNetwork | undefined) => {
    if (!value) {
      return 'Network selection is required'
    }
    return true
  }

  const handleSubmit = useCallback(() => {
    const formValues = form.getValues()

    if (!isValid) {
      toast.error('Please fill all required fields correctly')
      return
    }

    try {
      new Connection(formValues.endpoint)
      addCluster({
        name: formValues.name,
        network: formValues.network,
        endpoint: formValues.endpoint,
      })
      hide()
      form.reset()
      toast.success('Cluster added successfully')
    } catch (error) {
      console.error('Invalid cluster endpoint:', error)
      toast.error('Invalid cluster endpoint')
    }
  }, [addCluster, hide, form, isValid, toast])

  return (
    <Modal
      hide={hide}
      show={show}
      title="Add Cluster"
      submitDisabled={!isValid}
      submitLabel="Save"
      submit={handleSubmit}
    >
      <Form {...form}>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="name"
            rules={{
              validate: validateName,
            }}
            render={({ field }: { field: any }) => (
              <FormItemInput label="Name" placeholder="Enter cluster name" {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="endpoint"
            rules={{
              validate: validateEndpoint,
            }}
            render={({ field }: { field: any }) => (
              <FormItemInput label="Endpoint" placeholder="Enter endpoint URL" {...field} />
            )}
          />
          <FormField
            control={form.control}
            name="network"
            rules={{
              validate: validateNetwork,
            }}
            render={({ field }: { field: any }) => (
              <div className="flex flex-col gap-2">
                <span className="text-sm">Network</span>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full p-3 text-[2.25rem]">
                    <SelectValue placeholder="Select a network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClusterNetwork.Custom}>Custom</SelectItem>
                    <SelectItem value={ClusterNetwork.Devnet}>Devnet</SelectItem>
                    <SelectItem value={ClusterNetwork.Testnet}>Testnet</SelectItem>
                    <SelectItem value={ClusterNetwork.Mainnet}>Mainnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </form>
      </Form>
    </Modal>
  )
}
