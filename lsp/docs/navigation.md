# Graph navigation and completion

The standard language service exposes `hierarchy(uri, position)` and `completions(uri, position)`. They operate on the current interpretation, including explicitly loaded Abstract sources and unsaved snapshots. Workspace delegates these Abstract operations to the same service. Neither operation changes a source or asserts identity.

## Selecting a neighborhood

A relation dot selects the relation expression by endpoint identities. A word selects its concept and follows endpoint correspondence through judgments. Default coincidence, detachment, distinction and explicit equality determine which occurrences belong together; identical spelling alone cannot bypass those decisions. Reversed written pairs retain their endpoint correspondence when exploring words.

The hierarchy result contains selected entries, direct `parents`, direct `children`, reachable `ancestors` with shortest distance, and `siblings` grouped by shared direct parent. Items preserve source locations and alternative labels for joined identities. Negated claims are reported separately with their direction and source judgment. They do not create traversal edges. Multiple parents, diamonds and cycles are supported; a traversal never repeats the selected node or follows a cycle indefinitely.

For relation expressions, children are direct concretizations and parents are direct abstractions. For a selected term, only corresponding endpoints participate: the other endpoint does not become a sibling merely because it is written in the same pair.

## Hover and source navigation

Hovering a dot or term shows a compact neighborhood summary. Direct parents and children are distinguished from indirect ancestors. Siblings remain grouped by their parent. Markdown-capable clients get clickable source links. Plain-text clients get names and source locations. Each list shows at most six entries; the full structured query retains all entries. Hover links choose a recorded location; they do not invent a unique declaration for a relation used in several judgments.

Links use `file:///...#Lline,column` and point only to recorded source locations. VS Code can navigate to the line and column. Zed's hover-file handler currently uses the line. Unsaved documents without a navigable file path have limited cross-document linking. No editor-specific command URI or custom click handler is needed. User-provided text is escaped when rendered as Markdown.

The read-only `abstract/hierarchy` LSP request accepts `{uri, position}` and returns the complete service result or `null`. Positions are zero-based UTF-16 line/character positions. Internal ranges also contain offsets, as in other Abstract graph records. This request is available for future clients; the current editor interaction uses standard hover.

## Completion

- At a word or relation start, suggest existing words and complete relation expressions.
- After `engine.`, rank observed second endpoints first; other existing words remain available for new pairings.
- After `engine.car::`, suggest complete relation expressions, preferring recorded abstractions for that concrete expression and other known abstractions.
- After `(engine:`, suggest only contexts in which that word is available.

Proposals include source details and precise replacement ranges. Imported vocabulary is included. Partial input, Unicode words and UTF-16 offsets are supported. Source paths, comments and identity-marker endings do not receive these completion proposals. Accepting an existing word neither merges concepts nor emits an identity assertion. Users can always type new vocabulary.

## Testing

Use the [navigation example](../../examples/navigation/README.md). Automated tests cover branching, diamonds, cycles, negative claims, aliases, contextual detachment, source links and exact completion edits. The VS Code extension-host test opens linked source locations and requests completions. Zed uses its built-in Markdown-hover link handling; the example provides the manual visual check.

Dedicated hierarchy views are deferred. A [contextual detachment code action](code-actions.md) appends unary detachment for a selected contextual term. The former level CodeLens is removed; [same as lenses](same-as.md) expose explicit aliases.
