import { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@hoodieshq/ms-tools-ui'

type CardBalanceProps = {
  title: string
  balance: string
}

export const CardBalance: FC<CardBalanceProps> = ({ title, balance }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <span className="font-semibold">{balance}</span>
    </CardContent>
  </Card>
)
