import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const buttonVariants: (props?: ({
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare function Button({ className, variant, size, asChild, ...props }: ButtonProps): react_jsx_runtime.JSX.Element;

export { Button, type ButtonProps, buttonVariants };
