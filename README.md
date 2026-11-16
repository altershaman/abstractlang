# Abstract

Abstract records knowledge claims through judgments about relationships and their abstractions. Matching words coincide by default; contextual references, detachment and explicit identity let authors refine concept identity.

```abstract
engine.car::part.whole
motor.car::power_unit.mechanism
(engine:part.whole).(motor:power_unit.mechanism)::.
```

This repository provides the reusable language implementation and standard tools. Development is ongoing. The Knowledge structures extension is a specification draft; its ontology and domain syntax is not implemented by the parser.

## Components

| Directory | Responsibility |
|---|---|
| `core/` | Parser, expansion, interpretation, type declarations and tests |
| `core/docs/` | Original language specification and supporting articles |
| `service/` | Standard analysis, diagnostics, navigation, completion, semantic tokens, hints, detachment proposals and a separate Node file resolver |
| `lsp/` | Standard stdio language server, protocol documentation and tests |
| `cli/` | Read-only validation, expansion and inspection for terminals and agents |
| `ide/` | Reference VS Code and Zed clients for the standard LSP |
| `extensions/knowledge-structures/` | Proposed ontology and domain specifications |

Start with [why](core/docs/why.md), [core](core/docs/core.md) and [sugar](core/docs/sugar.md). See [Knowledge structures](extensions/knowledge-structures/README.md) for the extension. The original language documents live in `core/docs/`; there are no generated documentation copies.

Core has no filesystem, UI or editor dependency. Service builds on core. The LSP uses service; the CLI uses core and the service file resolver. Reference IDE clients live in `ide/` with optional build dependencies. Markdown integration, visualizations and storage belong to ecosystem applications.

## Setup and verification

Use Node.js 22+ for repository development and npm dependency installation. The individual runtime packages declare Node.js 20+ support.

```sh
npm ci
npm test
npm run test:types
```

The JavaScript sources run directly. No compilation or bundle build is required for the standard tools.

## Standard tools

```sh
node lsp/bin/abstract-lsp.js --stdio
node cli/bin/abstract.js validate --json /path/to/main.abstract
node cli/bin/abstract.js inspect --json /path/to/main.abstract
```

Configure an IDE's LSP client to launch `node` with the absolute path to `lsp/bin/abstract-lsp.js` and `--stdio`. Stdout is reserved for protocol messages. See the [LSP guide](lsp/README.md) and [CLI guide](cli/README.md).

## Reference IDE clients

See [ide/README.md](ide/README.md) for VS Code and Zed builds, installation and server configuration. Their build requirements are separate from the standard language tools.

## Use as a submodule

A consuming repository can pin this source tree as a Git submodule:

```sh
git submodule add https://github.com/altershaman/abstractlang.git vendor/abstractlang
npm --prefix vendor/abstractlang ci
```

For an existing checkout, initialize submodules with `git submodule update --init --recursive`, then install dependencies in the submodule. The consuming repository records the selected Abstract commit. Updating that commit and rebuilding any generated application artifacts are explicit host-project actions.

Applications may call the libraries directly. Browser consumers can bundle core and the browser-safe `@abstractlang/service/analysis` entry point or selected pure service modules. The Node file resolver is separate. CLI and LSP processes are optional application entry points, not prerequisites for direct library use.

This source repository is licensed under [MIT](LICENSE). Repository metadata points to the existing Abstractlang remote; these instructions do not imply that local changes have already been pushed there.
