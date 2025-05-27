// /** @type {import('postcss-load-config').Config} */
// const config = {
//   plugins: {
//     tailwindcss: {},
//   },
// };

// TODO: Start implementing UI with new UI-kit
import uikitConfig from '@hoodieshq/ms-tools-config/postcss.config.mjs'

const config = {
  ...uikitConfig,
}

export default config
