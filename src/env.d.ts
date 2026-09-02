/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SITE_URL: string;
  readonly DATABASE_PATH: string;
  readonly SESSION_SECRET: string;
  readonly SESSION_TTL_HOURS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
