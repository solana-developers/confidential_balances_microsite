import { ComponentProps, FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@solana-foundation/ms-tools-ui'

type CardBalanceProps = {
  balance: string | number | undefined
  symbol?: string
  title: string
} & ComponentProps<'div'>

export const CardBalance: FC<CardBalanceProps> = ({ className, title, balance, symbol }) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {balance !== undefined ? (
        <span className="font-semibold">
          {balance} {symbol}
        </span>
      ) : (
        <span>{'—'}</span>
      )}
    </CardContent>
  </Card>
)
