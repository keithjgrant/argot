const USAGE = `Usage:
  argot [sourceFile.css] [destFile.css] Process CSS
  argot semantics [path] [--extended]    Write semantic CSS template (default: ./semantics.css)
  argot palette <definition.json> [output.css] [--force] [--dry-run]
                                        Write primitive CSS (default: ./primitives.css)
  argot help                            Show this help

Options:
  --extended   Include extended-tier tokens (default: core only)

Examples:
  npx @keithjgrant/argot semantics
  npx @keithjgrant/argot semantics --extended
  npx @keithjgrant/argot semantics ./styles/tokens.css --extended
`;

export { USAGE };
