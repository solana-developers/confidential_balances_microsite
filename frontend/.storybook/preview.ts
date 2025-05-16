import type { Preview } from "@storybook/react";
import "../src/app/globals.css"; // Import Tailwind CSS
import "../src/components/ui/themes/dark/color-schema.scss";

const customViewports = {
  mobile: {
    name: "Mobile (iPhone)",
    styles: {
      width: "390px",
      height: "724px",
    },
  },
  tablet: {
    name: "Tablet",
    styles: {
      width: "840px",
      height: "100%",
    },
  },
  desktop: {
    name: "Desktop",
    styles: {
      width: "1200px",
      height: "100%",
    },
  },
  largeDesktop: {
    name: "Large Desktop",
    styles: {
      width: "1440px",
      height: "100%",
    },
  },
};

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: customViewports,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

// Add global styles
const style = document.createElement("style");
style.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

  body {
    /*
    font-family: 'Inter', 'Open Sans', 'Helvetica Neue', sans-serif;
    font-family: 'Rubik', 'Open Sans', 'Helvetica Neue', sans-serif;
    */
    font-family: monospace;
  }
`;
document.head.appendChild(style);

export default preview;
