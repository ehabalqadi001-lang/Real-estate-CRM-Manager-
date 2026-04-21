declare module 'tailwindcss-rtl' {
  import type { PluginAPI } from 'tailwindcss/types/config'

  const plugin: (api: PluginAPI) => void
  export default plugin
}
