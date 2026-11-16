# same as lenses

A term occurrence can show a clickable label such as:

```text
same as motor:unit.machine
engine.car::part.whole
```

The label is always lowercase `same as`, followed by the equivalent term's contextual reference. It is shown only when authored equality connects different words in the interpreted concept-identity group. Transitive equality is included. Default coincidence or explicit equality between different contexts of the same word alone does not produce a lens.

Lenses are anchored near actual term occurrences in judgments, including contextual terms. Equality, distinction and detachment statements themselves are omitted to avoid repeating what those lines already declare. Comments and source paths never produce labels. A detached reading is included only if the interpreted identity actually connects it to the differently spelled term. Explicit equality can still join detached terms.

The initial prototype shows up to four alternative words per occurrence, choosing a contextual reference where available. Clicking one requests its recorded source location through standard `workspace/executeCommand` and `window/showDocument`. Clients without show-document support receive a source-location message instead. Included Abstract files may supply the equality or target declaration; the lens stays in the requested document. No source is edited.

In Zed, top-level `"code_lens": "on"` enables display. The setting is editor-wide. Restart the language server after a source upgrade. Bundled editor clients need the rebuilt extension. The old pair-level lenses remain removed; contextual detachment code actions are unchanged.

The service API is `sameAsLenses(uri)`; the pure exported function is `sameAsLenses(graph, uri)`. Each result includes its range, title, contextual reference and target location. Clients supporting CodeLens refresh receive a refresh request when analysis changes.

An [inline hint presentation](inlay-hints.md) is now available and enabled for comparison. CodeLens display is off in the current editor setup; its provider remains available.
