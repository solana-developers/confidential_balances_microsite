import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@hoodieshq/ms-tools-ui";
import { FC } from "react";

type CardBalanceProps = {
  title: string;
  balance: string;
};

export const CardBalance: FC<CardBalanceProps> = ({ title, balance }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <span className="font-semibold">{balance}</span>
    </CardContent>
  </Card>
);
