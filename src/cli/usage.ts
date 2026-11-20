const USAGE = `Usage:
  argot [sourceFile.css] [destFile.css] Process CSS
  argot semantics [path] [--extended]    Write semantic CSS template (default: ./semantics.css)
  argot palette <definition.json> [output.css] [--force] [--dry-run]
                                        Write primitive CSS (default: ./primitives.css)
  argot help                            Show this help

Options:
  --extended   Include extended-tier tokens (default: core only)

Examples:
  npx argot-css semantics
  npx argot-css semantics --extended
  npx argot-css semantics ./styles/tokens.css --extended
`;

export { USAGE };
