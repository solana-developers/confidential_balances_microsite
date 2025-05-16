import React from "react";
import "../atoms/app-button.scss";
import "./styles.scss";

type ButtonStyle =
  | "primary"
  | "secondary"
  | "light"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "ghost";
type ButtonSize = "small" | "medium" | "large" | "jumbo";
type ButtonState = "default" | "disabled";

type AppButtonProps = {
  children: string | JSX.Element;
  style?: ButtonStyle;
  size?: ButtonSize;
  state?: ButtonState;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export const AppButton = ({
  children,
  style = "primary",
  size = "medium",
  state = "default",
  onClick,
  className = "",
  type = "button",
}: AppButtonProps) => {
  const baseClass = "app-btn";
  const styleClass = `${baseClass}--${style}`;
  const sizeClass = `${baseClass}--${size}`;
  const stateClass = state === "disabled" ? "disabled" : "";

  const buttonClasses = [
    baseClass,
    styleClass,
    sizeClass,
    stateClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={state === "disabled"}
    >
      {children}
    </button>
  );
};
