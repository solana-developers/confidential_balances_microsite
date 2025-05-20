import { resolve } from 'path'
import type { StorybookConfig } from '@storybook/react-webpack5'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-essentials',
    '@storybook/addon-themes',
    '@storybook/experimental-addon-test',
    {
      name: '@storybook/addon-styling-webpack',
      options: {
        rules: [
          {
            test: /\.css$/,
            sideEffects: true,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                  modules: false,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  implementation: require('postcss'),
                },
              },
            ],
          },
        ],
      },
    },
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  webpackFinal: async (config) => {
    if (config && config.resolve) {
      config.resolve.symlinks = true // Enable symlink resolution
      console.log('Resolved Paths:', JSON.stringify(config.resolve.modules, null, 2))
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': resolve(__dirname, '../src'),
      }
    }

    return config
  },
}

export default config
