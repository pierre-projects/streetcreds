/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, without a trailing slash. */
  readonly VITE_API_URL?: string
  /** "true" serves fixtures from src/app/mock/ instead of calling the API. */
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
