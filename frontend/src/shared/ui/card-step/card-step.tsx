import { FC } from 'react'
import {
  Card,
  CardAsideCounter,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@hoodieshq/ms-tools-ui'

type CardStepProps = {
  title: string
  description: string
  step: number
}

export const CardStep: FC<CardStepProps> = ({ title, description, step }) => (
  <Card aside={<CardAsideCounter>{step}</CardAsideCounter>}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
)
