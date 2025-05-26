import {
  Card,
  CardAsideCounter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@hoodieshq/ms-tools-ui";
import { FC } from "react";

type CardStepProps = {
  title: string;
  description: string;
  step: number;
};

export const CardStep: FC<CardStepProps> = ({ title, description, step }) => (
  <Card aside={<CardAsideCounter>{step}</CardAsideCounter>}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
);
