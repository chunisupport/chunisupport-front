/// <reference types="@rsbuild/core/types" />

interface ImportMetaEnv {
    readonly PUBLIC_BACKEND_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
