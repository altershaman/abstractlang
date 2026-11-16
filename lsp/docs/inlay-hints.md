# Inline identity hints

The server can place `(term)` directly after an aliased term. This is a display hint, not source text. It uses the same explicit, transitive identity data as the existing same-as lenses, while anchoring at the end of the word rather than above its line.

Each inline hint groups up to four alternative words. The compact label contains only alternative words: `(motor)` or `(motor, power_unit)`. Each word retains its recorded source location and an explicit navigation command; its tooltip shows `same as` and the full contextual reference. Editors can offer navigation from these label parts using their normal inlay-hint gestures. Hints contain no text edits, so accepting or double-clicking them cannot insert them into the document through this provider.

Only explicit identities connecting different words produce synonym hints. Default same-word coincidence does not. Declaration lines for equality, distinction and detachment are omitted, as are comments and paths. Detachment and explicit equality retain their ordinary semantics. Included files can contribute identities and target locations. The provider returns only hints anchored in the requested visible range and uses UTF-16 positions.

A detached contextual term also receives `(detached)`, linked to its unary detachment or binary distinction assertion. Other contexts of the same word remain unmarked unless independently detached. Explicit identity does not remove detachment: a term may show both `(motor)` and `(detached)`. These hints are omitted inside identity, distinction and detachment declarations themselves.

## Editor setup

For comparison, CodeLens display is off and inline hints are on in the current Zed setup. Abstract's `inlay_hints` language setting enables `enabled` and `show_other_hints`. These hints deliberately omit the programming-specific type/parameter kind. VS Code's Abstract defaults likewise enable `editor.inlayHints.enabled` and disable `editor.codeLens`. The CodeLens provider remains available if you want to compare presentations later.

Restart the language server to load the new capability. Bundled editor clients need the rebuilt extension. Inlay font, color, background and navigation gestures remain editor-controlled. Hints are positioned after the word, which can visually separate a term from its following dot; this prototype is intended to evaluate that tradeoff.

## Interfaces and checks

`textDocument/inlayHint` returns resolved labels, locations and `abstract.openHint` commands. `workspace/inlayHint/refresh` is sent only when the client advertises support. The server handles `abstract.openHint` through `workspace/executeCommand` and requests `window/showDocument` for the current target. Stale commands are ignored if their hint no longer exists. Clients must support label-part commands and `window/showDocument` for this navigation path; no extension-specific command is required. The reusable service exposes `sameAsHints(uri, viewport?)`; the pure exported equivalent takes `(graph, uri, viewport?)`.

Tests cover grouping, source links, range filtering, Unicode positions, identity removal, detached hints and executable navigation in both LSP hosts. VS Code integration checks the received label parts and opens their recorded location. The final visual placement and click gesture in Zed remain a manual check.

When an included Abstract file is also open in the editor, it retains the loaded including document’s interpretation. Reciprocal hints and navigation therefore use the same identity group on both sides. Closing the including document leaves the external file’s standalone interpretation; this does not search disk for importers. Unrelated roots are not merged. If several roots include a file, the service selects a deterministic root by URI until a dedicated context selector is introduced.
