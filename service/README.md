# Standard Abstract language service

`@abstractlang/service` provides reusable document analysis and contextual navigation on top of `@abstractlang/core`. The CLI uses its file resolver, and the standard LSP uses its analysis and navigation interfaces. A scenario can reuse it without starting a language server.

```js
import {createLanguageService} from '@abstractlang/service/analysis';

const uri = 'memory:/main.abstract';
const service = createLanguageService(new Map([[uri, 'engine.car::part.whole']]));
const selection = service.at(uri, {line: 0, character: 1});
console.log(service.hover(selection));
console.log(service.locations(selection, {definitions: true}));
```

The analysis entry point is filesystem-independent. It accepts source snapshots and optional `languageIds` and `resolveFile` options. Explicit snapshots take precedence over the supplied resolver, including for imported documents. No files are discovered, watched or written by this service. Unknown imports produce findings while available declarations remain analyzable. URI-keyed diagnostics include findings from imported sources.

The returned service exposes `graphs`, `diagnostics`, `directories`, `graphFor`, `at`, `hover` and `locations`. `directories` contains file-directory URIs derived from interpreted documents so a host can watch their saved sources; analysis itself performs no watching. Rebuild the service with updated snapshots when documents change. Previously returned services remain snapshots.

The separate `@abstractlang/service/files` entry point supplies a Node local-file resolver. Open snapshots override disk reads. Standard CLI and LSP hosts use this resolver; browser consumers use their own source access. Neither entry point depends on workspace, Markdown, LSP transport or an editor.

## Scenario composition

An ecosystem integration can use this analysis service for Abstract interpretation and source selection, then add its own document handling or attributes. `startLanguageServer({createService,watchPattern})` accepts a compatible service factory. Hosts may provide additional note and attribution records for preview requests; the standard server supplies empty records when absent. A host must return the graph, diagnostics and navigation interface and must keep source URIs and ranges in the core format.

The existing Markdown-aware launcher is `abstract-workspace-lsp --stdio`. IDE bundles use that launcher to preserve their Markdown features. `abstract-lsp --stdio` is the standard Abstract-only server. This is an explicit factory interface, not dynamic plugin loading or an extension to Abstract syntax. Standard CLI commands remain `validate`, `expand` and `inspect`; scenario commands can use the service directly and own their own command names and policies.

Contradictions and entanglements are published as warning diagnostics at each participating judgment, with related locations linking the witnesses. They remain findings and do not invalidate otherwise valid syntax. Rebuilding after a correction removes the corresponding warnings.

See the [semantic-token guide](../lsp/docs/semantic_tokens.md) for token categories, judgment roles, editor styling and testing.

## Identity-aware highlighting

`highlights(uri, position)` returns authored term ranges when the cursor is on a word, or matching relation-expression ranges when the cursor is on a relation dot. Results stay in the requested Abstract document. It expands the selected contextual terms through their interpreted `conceptId`, so default coincidence and explicit equality join occurrences while detachment and distinction separate them. Differently spelled synonyms participate. Context words inside explicit references are independently selectable. Comments, paths, nonrelation punctuation and surrounding Markdown prose are not highlight targets. `locations` uses the same identity groups and can return references across explicitly included sources.

A relation dot selects the whole written relation. Matching compares both endpoint concept identities, independently of whether the relation is concrete or abstract in its current judgment. Reversal preserves the relation expression for highlighting; this does not equate judgments with different endpoint correspondence. In shared-concept blocks, only written fragments are highlighted. Equality/distinction marker dots do not select relations. Identity assertions can nevertheless join the endpoints of differently spelled relation expressions.

See the [navigation and completion guide](../lsp/docs/navigation.md) for hierarchy queries, linked hover and completion behavior.


The [contextual detachment code action](../lsp/docs/code-actions.md) inserts unary detachment for a selected contextual term.

[Same as lenses](../lsp/docs/same-as.md) show explicit cross-word identity and navigate to its source.

Open included documents use their loaded including root’s interpretation for analysis and navigation. Opening an external buffer therefore does not shadow composed identities with a standalone graph. Diagnostics come from effective roots; unrelated roots remain independent. No importer discovery or recursive import following is added.

`createInterpretationService(graphs)` exposes the same standard queries and diagnostics for native `@abstractlang/core` interpretations supplied by a host adapter. It does not reparse source or interpret application metadata. This lets applications preserve their own metadata layer while reusing the standard service.
