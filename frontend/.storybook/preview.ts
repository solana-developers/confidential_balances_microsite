import React from 'react'

import './storybook-fonts.css'
import '../app/globals.css'

import type { Decorator, Preview } from '@storybook/react'

const withDarkClass: Decorator = (Story) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark')
  }
  return Story()
}

const preview: Preview = {
  decorators: [withDarkClass],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
