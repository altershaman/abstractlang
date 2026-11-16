# Abstract language server 1.0.0

`@abstractlang/lsp` exposes the standard Abstract language service through stdio LSP. It depends on `core` and `service`, without workspace, Markdown discovery, Origami or editor dependencies.

```sh
abstract-lsp --stdio
abstract-lsp --version
```

From a checkout, `node lsp/bin/abstract-lsp.js --stdio` is equivalent after `npm ci`. The standard server supports incremental Abstract document synchronization, syntax and unresolved-reference diagnostics, contextual hover, definitions, references, completion and semantic tokens. Explicit source registrations are resolved through local files and open snapshots. It does not discover neighboring Markdown or derive attributes from it.

`abstract/graph` returns JSON interpretation records. `abstract/preview` returns a read-only Abstract source snapshot, diagnostics and available Abstract documents. Standard graph responses have empty attribution records. The supported transport is stdio; stdout contains protocol frames only.

## Scenario integrations

Import `startLanguageServer()` with custom input/output streams or a `createService(snapshots, options)` factory and optional `watchPattern`. The standard factory is `createLanguageService` from `@abstractlang/service`. The transport handles synchronization and protocol requests; the service supplies analysis and navigation. See the [service contract](../service/README.md).

Scenario-specific document handling and Markdown workflows belong to external integrations. Their clients may supply a compatible service factory; none is required to run this standard server.

The [protocol specification](docs/protocol.md) describes the standard methods and Abstract-specific requests.

See the [navigation and completion guide](docs/navigation.md) for hierarchy queries, linked hover and completion behavior.


The [contextual detachment code action](docs/code-actions.md) inserts unary detachment for a selected contextual term.

[Same as lenses](docs/same-as.md) show explicit cross-word identity and navigate to its source.
