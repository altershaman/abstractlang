# Abstract LSP protocol

IDE extensions and the Abstract language service communicate using the [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/), based on [JSON-RPC 2.0](https://www.jsonrpc.org/specification). LSP defines editor methods and lifecycle; JSON-RPC defines request, notification and response envelopes. Neither is Abstract language syntax.

This document describes the implemented subset and Abstract-specific requests. It supplements the upstream specifications rather than redefining them. The implementation is [src/server.js](../src/server.js).

## Standard host

The `abstract-lsp` executable is Abstract-only. Its diagnostics, hover, references, completion and tokens describe supplied Abstract documents and their explicit sources. It does not discover Markdown or derive attributes; attribution records are empty. It never writes source files. Ecosystem integrations can supply a scenario-specific service factory through the library API, but are outside this repository.

## Transport and positions

Start `abstract-lsp --stdio`, or `node lsp/bin/abstract-lsp.js --stdio` from a checkout. The connection uses stdin/stdout with LSP `Content-Length` framing and UTF-8 JSON bodies. Stdout is reserved for protocol frames. No TCP, HTTP or WebSocket transport is supplied by the executable.

Document URIs identify documents. Positions are zero-based UTF-16 line/character coordinates, advertised through `positionEncoding: "utf-16"`. Internal graph records can also carry offsets; standard LSP ranges omit offsets. The standard host handles `abstract`.

## Lifecycle and synchronization

Clients initialize the connection with `initialize`, then send `initialized`. The response advertises the actual supported capabilities and server version. End the session with a `shutdown` request followed by an `exit` notification.

The server supports incremental text synchronization through `textDocument/didOpen`, `textDocument/didChange`, `textDocument/didSave` and `textDocument/didClose`. Unsaved snapshots override disk contents. Closing a document removes its snapshot; saved contents remain discoverable. `workspace/didChangeWatchedFiles` refreshes the document index, and the server also watches relevant directories itself.

## Standard language methods

| Method | Direction | Result or effect |
|---|---|---|
| `textDocument/documentHighlight` | Client → server | Identity-aware term ranges, or relation-expression ranges when the cursor is on a relation dot; comments and plain text excluded |
| `textDocument/codeAction` | Client → server | Contextual unary-detachment edits under `refactor.rewrite` |
| `textDocument/hover` | Client → server | Plain-text contextual information, or `null` |
| `textDocument/definition` | Client → server | Definition locations, or an empty array |
| `textDocument/references` | Client → server | Matching locations; respects `context.includeDeclaration` |
| `textDocument/completion` | Client → server | Word or contextual-reference completions; trigger characters `:` and `(` |
| `textDocument/semanticTokens/full` | Client → server | Full semantic-token data; legend `term`, `dot`, `doubleColon`, `bang`, `colon`, `comment`; role modifiers `concretization`, `abstraction`, `reference`, `rootAbstraction` |
| `textDocument/publishDiagnostics` | Server → client | Syntax and unresolved-reference diagnostics, with open document version when available |
| `workspace/semanticTokens/refresh` | Server → client | Refresh request, sent only if the client advertises support |

The server exposes collisions in graph records and publishes contradiction, entanglement and identity-collision warnings. Rename, formatting, semantic-token deltas and Markdown preview DOM interactions are not advertised.

## Abstract-specific requests

These are read-only extension methods, not standard LSP methods. Both take a JSON object with a `uri` string. Open the document through normal synchronization before requesting a view; explicitly included Abstract documents may also be available.

`abstract/graph` returns the current interpretation for an indexed Abstract document, or `null` if unavailable. It includes `uri`, `valid`, registrations, judgments, identities, contexts, terms, occurrences, collisions, diagnostics, detachments, distinctions and an empty attribution list. Runtime document objects and the `resolveReference` function are omitted. Core record types are documented by `core/src/index.d.ts`; this response currently follows those records rather than a separately versioned wire schema.

`abstract/preview` returns a source snapshot for an available Abstract document, or `null`. Its fields are `uri`, `source`, `languageId`, optional `abstractUri`, `mentions`, `attributions`, `diagnostics`, `documents` and `version`. Mentions carry ranges and contextual term IDs; `documents` lists available URIs and language IDs. `version` is a content hash for change detection, not an LSP document version. In the standard host, `mentions` and `attributions` are empty and `abstractUri` is absent.

Example request body, before LSP framing:

```json
{"jsonrpc":"2.0","id":2,"method":"abstract/graph","params":{"uri":"file:///project/main.abstract"}}
```

The LSP library handles protocol envelopes and method errors. Custom methods currently assume valid parameters; clients must provide the documented object shape. No document mutation or filesystem writing is exposed by these custom requests.

## Client boundaries

IDE extensions are external clients. They can launch this standard server directly or distribute a bundled copy. Client packaging and rendered-preview integration are outside this repository; LSP does not attach hover handlers to HTML automatically.

The service-factory interface allows external integrations to add document-specific records. These are not standard language features. Unary detachment removes default coincidence; explicit identity remains a separate operation.

## Neighborhood query

`abstract/hierarchy` accepts `{uri, position}` and returns the complete identity-aware neighborhood of the term or relation dot, or `null`. The result includes direct parents/children, ancestors with distances, siblings grouped by parent, separately reported negated claims and source locations. See [navigation and completion](navigation.md). Standard hover renders a compact linked summary when clients accept Markdown-formatted hover and plain text otherwise. Completion supplies precise text edits and provenance for endpoint, abstraction-relation and contextual-reference proposals.

## Contextual detachment action

`textDocument/codeAction` offers complete unary detachment statements under `refactor.rewrite`. For `a` in `a.b::c.d`, the proposed statement is `(a:c.d)!.`. Edits target the requested open document and preserve its version when supported. Requesting an action has no side effect; the client applies the chosen edit. Pair-level lenses and the level-display execute command are no longer provided. See [code actions](code-actions.md).

## same as CodeLens

`textDocument/codeLens` returns resolved lowercase `same as …` labels for explicit cross-word identities. `abstract.openSameAs` is advertised through `executeCommandProvider` and requests the recorded target through `window/showDocument` when supported. Other clients receive a source-location message. The service sends `workspace/codeLens/refresh` only when the client advertises support. See [same as lenses](same-as.md).

## Inline identity hints

`textDocument/inlayHint` returns resolved, word-anchored compact `(term)` labels with source locations in their label parts. They carry no text edits or type/parameter kind. Viewport ranges are respected. `workspace/inlayHint/refresh` is sent only when supported. See [inline hints](inlay-hints.md).
