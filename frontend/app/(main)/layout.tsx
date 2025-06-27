import '../globals.css'

import { FC, PropsWithChildren } from 'react'
import { App } from '@/app'
import { BaseLayout } from '@/app/base-layout'
import { navigation } from '@/shared/navigation'

const MainLayout: FC<PropsWithChildren> = ({ children }) => (
  <App>
    <BaseLayout links={navigation}>{children}</BaseLayout>
  </App>
)

export default MainLayout
