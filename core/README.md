# Abstract language library 1.0.0

`@abstractlang/core` implements [the core language](docs/core.md) and [documented sugar](docs/sugar.md). It is ESM JavaScript with TypeScript declarations, supports Node.js 20+, and can be bundled for browsers. It has no Node built-in, filesystem, editor, DOM or UI dependency. Matching words coincide across contexts by default. GLOBAL root terms have one address; unary detachment and explicit identity equality or distinction refine the defaults.

```js
import {parse, parseReference, expand, interpret, print} from '@abstractlang/core';
const document = parse('a.b::c.d');
const graph = interpret(document);
const term = graph.resolveReference('a:c.d');
```

`parse(source, options?)` returns the original source, authored syntax with UTF-16 ranges, expanded core statements and syntax diagnostics. Default `syntax: 'sugar'` accepts the sugar document; `syntax: 'core'` accepts only the core grammar. Parsing recovers from malformed editor text without discarding source. `print(document)` returns the original text verbatim.

`parseReference(text, options?)` parses a reference fragment, returning `{reference, diagnostics}`. A fragment is not a document statement. Core names are case-sensitive Unicode identifiers, with no normalization.

`expand(sourceOrDocument, options?)` returns `{document, statements, judgments, identities, distinctions, detachments, diagnostics, complete, text}`. Referenced concrete endpoints in positive judgments expand to identity assertions plus a plain judgment. Layout and repeated-abstraction shorthand expand before interpretation. Negative reference-endpoint shorthand, references on abstraction endpoints and arbitrary attachments are not specified. `text` is null if syntax errors prevent faithful expansion.

`interpret(sourceOrDocument, options?)` derives contexts, contextual terms, concept IDs, authored judgment occurrences, identity assertions, diagnostics and collision findings. `valid` concerns syntax; collisions do not make it false. Missing contextual references warn and remain unresolved, without inventing concepts. Identity is symmetric and transitive, while contextual addresses remain separately available. `distinctions` and `detachments` preserve the corresponding authored statements. A binary distinction keeps both contextual operands out of implicit coincidence rather than selecting an arbitrary default partition; explicit equalities remain in force. GLOBAL addresses and default-word operands are not detached by that rule. Both simultaneous judgment orientations are preserved as authored occurrences. Cycles are allowed, and indirect context access does not insert transitive judgment statements.

Use `resolveReference(text)` to select a declared contextual term. `conceptId` identifies the equivalence class derived from default coincidence, detachment and explicit identity assertions; IDs are opaque. `referenceKey()` and `contextKey()` expose structural keys. Source positions are zero-based UTF-16 coordinates and offsets, suitable for LSP.

Optional document inclusion is enabled explicitly with `sourceRegistrations: true`, a document `uri` and a synchronous `resolveFile(uri, {read})` callback returning `{source}` or `undefined`. This supports [the document extension](docs/document.md), not additional core grammar. Core itself never performs IO. Foreign registrations are not followed. The standard service supplies a Node local-file resolver through `@abstractlang/service/files`. Browser applications can provide their own resolver.

The public entry point exports only the current API. Earlier `analyze()`, document-wide aliases and application ontologies are not part of this API. The exported aliases `parseContextDocument` and `parseContextReference` name the current parser too; they do not select a legacy mode.

The original language specification lives in `docs/` beside this README. Edit these documents directly; no generated copies or documentation build step are used.
