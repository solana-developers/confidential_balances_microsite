import solanaConfig from "@solana/prettier-config-solana" with { type: "json" };

const config = {
  ...solanaConfig,
  plugins: [solanaConfig.plugins ?? []].concat(["prettier-plugin-tailwindcss"]),
  endOfLine: "lf",
};
