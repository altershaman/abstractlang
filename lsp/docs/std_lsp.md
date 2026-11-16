# Standard language service: verification checklist

The standard server is `abstract-lsp --stdio`, or `node lsp/bin/abstract-lsp.js --stdio` from the Abstract checkout. It uses core and the standard service without the Markdown workspace. This checklist records the expected capabilities for manual verification; automated tests do not replace checking the editor experience.

## Language analysis

- [x] Syntax diagnostics report malformed declarations and disappear after correction.
- [x] Reference diagnostics warn about unknown contexts and unresolved references.
- [x] Contradiction warnings mark the involved judgments, including contradictions through abstraction paths.
- [x] Entanglement warnings mark incompatible endpoint correspondences.
- [ ] Identity-collision warnings report explicit equality conflicting with explicit distinction.
- [ ] Collisions remain findings; they do not invalidate otherwise valid syntax.

## Editor features

- [ ] Placing the cursor on a relation dot highlights matching relation expressions by endpoint identity, across concretization and abstraction positions.

- [ ] Placing the cursor on a term highlights same-identity term occurrences, including explicit synonyms, while excluding comments and plain text.

- [ ] Hover shows contextual term references.
- [ ] Go to definition navigates to the selected term's declaration.
- [ ] Find references lists occurrences of the selected contextual term and respects the include-declaration option.
- [ ] Completion suggests words and contextual references.
- [ ] Semantic highlighting marks term occurrences.

Coincidence, contextual identity, detachment and explicit distinction should be reflected consistently across navigation, hover and analysis. Matching spelling must not silently bypass explicit identity decisions.

## Documents and updates

- [ ] Explicitly registered external Abstract files are resolved without workspace.
- [ ] Missing external sources produce findings while available local declarations remain analyzable.
- [ ] Unsaved editor buffers are analyzed before saving and override the corresponding saved source.
- [ ] Editing and correcting a document updates its findings.
- [ ] Changes to included files refresh the analysis.
- [ ] Closing a buffer removes its unsaved snapshot; included saved sources remain available through the resolver.

## Tool interfaces

- [ ] `abstract/graph` returns a read-only interpretation snapshot.
- [ ] `abstract/preview` returns a read-only source snapshot and available Abstract documents.
- [ ] The service can be used directly through `@abstractlang/service` without starting LSP.

The direct service analyzes supplied snapshots; its host owns file resolution, watching and refresh. Editor completion and semantic-token encoding are supplied by the LSP adapter.

## Outside the standard service

Formatting and rename are not currently provided. Contextual detachment is available as a code action. Markdown discovery, Markdown references, backlinks and Markdown-derived attributes belong to the workspace integration, launched through `abstract-workspace-lsp`. They are not expected from the standard server.


## Try to implement
find references
type hierarchy (prepare, super, sub)
document highlights
document link (+ resolve)
hover
code lenses??

## Neighborhood exploration

- [ ] Hovering a relation dot shows direct children, parents, indirect ancestors and siblings grouped by parent.
- [ ] Hovering a term follows its endpoint correspondence and concept identity.
- [ ] Hover source links open the appropriate file and line, including included sources.
- [ ] Negated claims appear separately and do not become traversal edges.
- [ ] Completion edits only the intended fragment and includes source details.

See the [manual example](../../examples/navigation/README.md) and [navigation guide](navigation.md).

## Contextual detachment action

- [ ] Acting on `a` in `a.b::c.d` offers `(a:c.d)!.`.
- [ ] The action names the selected context and skips GLOBAL or already-detached terms.
- [ ] Applying the action changes contextual highlighting; undo restores it.
- [ ] Requesting actions does not edit or save files, including external sources.

See [code actions](code-actions.md). Pair-level lenses remain removed.

## same as lenses

- [ ] Differently spelled terms joined by explicit identity show lowercase `same as …` labels.
- [ ] Transitive equality is reflected; same-word coincidence alone stays quiet.
- [ ] Clicking a label opens the equivalent term’s recorded source.
- [ ] Removing equality or separating a reading updates the labels.

See [same as lenses](same-as.md).

## Inline same as hints

- [ ] Inline hints appear after the aliased word, as compact `(term)` labels, with source links and full contextual names in tooltips.
- [ ] Only explicit cross-word identities produce hints; comments and identity declaration lines stay quiet.
- [ ] Hints update after identity edits and never change source text.

See [inline hints](inlay-hints.md). CodeLens is hidden while comparing this presentation.
