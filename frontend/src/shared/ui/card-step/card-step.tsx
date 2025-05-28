import { FC } from 'react'
import {
  Card,
  CardAsideCounter,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hoodieshq/ms-tools-ui'

type CardStepProps = {
  className?: string
  title: string
  description: string
  step: number
}

export const CardStep: FC<CardStepProps> = ({ className, title, description, step }) => (
  <Card aside={<CardAsideCounter>{step}</CardAsideCounter>} className={className}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
)
