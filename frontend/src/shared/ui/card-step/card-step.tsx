import { FC } from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@solana-foundation/ms-tools-ui/components/card'
import { StepNumber } from './step-number'

type CardStepProps = {
  className?: string
  title: string
  description: string
  step: number
}

export const CardStep: FC<CardStepProps> = ({ className, title, description, step }) => (
  <Card className={className} aside={<StepNumber>{step}</StepNumber>}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
)
