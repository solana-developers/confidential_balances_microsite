import { type ReactNode, useEffect } from "react";
import "./layout.scss";

const LAYOUT_CLASS = "holy-grail";
const DEFAULT_ROOT = "body";

type HolyGrailLayoutProps = {
  children: ReactNode;
  layoutRoot?: string;
};

const HolyGrailLayout = ({
  children,
  layoutRoot = DEFAULT_ROOT
}: HolyGrailLayoutProps) => {
  useEffect(() => {
    const element = document.querySelector(layoutRoot);
    if (!element) {
      console.warn(`Element with selector "${layoutRoot}" not found`);
      return;
    }

    element.classList.add(LAYOUT_CLASS);

    return () => {
      element.classList.remove(LAYOUT_CLASS);
    };
  }, [layoutRoot]);

  return <>{children}</>;
};

export default HolyGrailLayout;
