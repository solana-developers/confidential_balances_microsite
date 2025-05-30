import { FC } from 'react'
import { useAtom } from 'jotai'
import { devModeOpenAtom } from '@/entities/dev-mode'
import { DevModeButton as DevModeButtonBase } from '@/shared/ui/button'

export const DevModeButton: FC = () => {
  const [devModeOpen, setDevModeOpen] = useAtom(devModeOpenAtom)
  return <DevModeButtonBase state={devModeOpen} onClick={() => setDevModeOpen((open) => !open)} />
}
