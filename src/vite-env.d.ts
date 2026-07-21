/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY?: "aquarius" | "esplanada";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
