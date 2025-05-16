import React from "react";
import "../atoms/app-button.scss";

type LinkStyle =
  | "primary"
  | "secondary"
  | "light"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "ghost";
type LinkSize = "small" | "medium" | "large" | "jumbo";
type LinkState = "default" | "disabled";

type AppLinkProps = {
  children: string | JSX.Element;
  href: string;
  style?: LinkStyle;
  size?: LinkSize;
  state?: LinkState;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
};

export const AppLink = ({
  children,
  href,
  style = "primary",
  size = "medium",
  state = "default",
  onClick,
  className = "",
  target = "_self",
  rel,
}: AppLinkProps) => {
  const baseClass = "app-btn";
  const styleClass = `${baseClass}--${style}`;
  const sizeClass = `${baseClass}--${size}`;
  const stateClass = state === "disabled" ? "disabled" : "";

  const linkClasses = [baseClass, styleClass, sizeClass, stateClass, className]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (state === "disabled") {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <a
      href={href}
      className={linkClasses}
      onClick={handleClick}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : rel}
      aria-disabled={state === "disabled"}
    >
      {children}
    </a>
  );
};
