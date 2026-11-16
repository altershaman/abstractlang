# Contextual detachment code action

Place the cursor inside `a` in this judgment:

```abstract
a.b::c.d
```

Invoke the editor's code-action menu and choose **Detach contextual term: a:c.d**. The action appends:

```abstract
(a:c.d)!.
```

This is unary detachment, not an equality assertion. It removes default coincidence with other occurrences of the same word across contexts. It does not undo explicit equality statements. GLOBAL terms have no detachment action. Terms already detached, including through explicit distinction, do not receive duplicate actions. If one written term supplies several contextual readings, each available action names the reading it detaches.

The action is classified as `refactor.rewrite`. It supplies a complete, undoable workspace edit. Requesting actions does not alter anything; selecting one changes only the active buffer. Saving remains a separate user action. Imported declarations are never rewritten. The source's newline convention is preserved, and versioned edits are used when supported by the client.

The reusable service API is `detachmentActions(uri, position)`. Its pure counterpart is `detachmentAssertions(graph, uri, position)`, exported from `@abstractlang/service`. Proposals contain the statement, contextual reference and insertion edit; they perform no filesystem writes.

Pair-level CodeLens and its level-display command have been removed. Separate [same as lenses](same-as.md) expose explicit cross-word identities. Existing semantic coloring and bold root-abstraction terms remain.

## Test

Open a document with `a.b::c.d` and `a.b::e.f`. Invoke the action on the first `a`, inspect the appended `(a:c.d)!.`, and check that highlighting no longer joins the two contextual occurrences. Undo should restore the original source and coincidence. Repeat from a contextual reference or a shared header to inspect the named context choices.
