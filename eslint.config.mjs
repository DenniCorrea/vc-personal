import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Argumento prefixado com "_" e assinatura imposta de fora que o corpo
      // nao usa — o caso tipico aqui e `useActionState`, que sempre chama a
      // acao com (estadoAnterior, formData) mesmo quando a acao so precisa do
      // id ja ligado por `.bind`. Apagar o parametro quebraria o tipo; o "_"
      // e justamente como se declara "existe de proposito, nao uso".
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
