import { type ReactNode } from "react";
import "./layout.scss";
import HolyGrailLayout from "./HolyGrailLayout";
import Header from "./components/Header";
import MainColumns from "./components/MainColumns";
import AsideLeft from "./components/AsideLeft";
import MainContent from "./components/MainContent";
import AsideRight from "./components/AsideRight";
import Footer from "./components/Footer";

type HolyGrailLayoutWithParamsProps = {
  header?: ReactNode;
  leftSidebar?: ReactNode;
  content: ReactNode;
  rightSidebar?: ReactNode;
  footer?: ReactNode;
  layoutRoot?: string;
};

const HolyGrailLayoutWithParams = ({
  header,
  leftSidebar,
  content,
  rightSidebar,
  footer,
  layoutRoot,
}: HolyGrailLayoutWithParamsProps) => (
  <HolyGrailLayout layoutRoot={layoutRoot}>
    {header && <Header>{header}</Header>}

    <MainColumns>
      {leftSidebar && <AsideLeft>{leftSidebar}</AsideLeft>}
      <MainContent>{content}</MainContent>
      {rightSidebar && <AsideRight>{rightSidebar}</AsideRight>}
    </MainColumns>

    {footer && <Footer>{footer}</Footer>}
  </HolyGrailLayout>
);

export default HolyGrailLayoutWithParams;
