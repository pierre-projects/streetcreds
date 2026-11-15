/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, without a trailing slash. */
  readonly VITE_API_URL?: string
  /** "true" serves fixtures from src/app/mock/ instead of calling the API. */
  readonly VITE_USE_MOCKS?: string
  /** "true", with VITE_USE_MOCKS, serves the populated demo set in src/app/mock/demo.ts. */
  readonly VITE_MOCK_DEMO?: string
  /** The Google OAuth client id for sign-in. Public, not a secret. Empty hides every sign-in control. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
