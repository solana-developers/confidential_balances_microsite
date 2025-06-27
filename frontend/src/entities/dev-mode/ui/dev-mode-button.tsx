import { FC, useCallback } from 'react'
import { useAtom } from 'jotai'
import { devModeOpenAtom } from '@/entities/dev-mode'
import { useWalletDisconnected } from '@/shared/solana'
import { DevModeButton as DevModeButtonBase } from '@/shared/ui/button'
import { devModeItemsAtom } from '../model/dev-mode-items'

export const DevModeButton: FC = () => {
  const [devModeOpen, setDevModeOpen] = useAtom(devModeOpenAtom)

  const [, setDevModeItems] = useAtom(devModeItemsAtom)
  useWalletDisconnected(
    useCallback(() => {
      setDevModeItems(new Map())
    }, [setDevModeItems])
  )

  return <DevModeButtonBase state={devModeOpen} onClick={() => setDevModeOpen((open) => !open)} />
}
