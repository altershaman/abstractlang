# Documents and inclusion

An Abstract document records a set of judgments together with supporting syntax constructions. A graph is derived by interpreting these records.

## Main and external documents

The **main document** is the focus of the current work. Its declarations and required external declarations are considered together when examining or composing an interpretation. Being main is a working role, not a property established by opening or saving a file.

An **external document** supplies declarations required by the main document. The same document can be main in one working arrangement and external in another. External declarations retain their provenance when considered alongside local declarations.

## Required sources

Registration records where an external source required by the main document can be found:

```abstract
@parts.path:'parts.abstract'
```

The alias `parts` identifies the source. It is not an abstraction context. Relative paths resolve against the main document's location; absolute paths may also be used. Source aliases must be unambiguous within the main document.

Inclusion considers the required source's declarations alongside those authored in the main document. Registration records the dependency and locator; obtaining its content is a separate loading operation. A second import directive is unnecessary.

Sources are included explicitly and non-recursively. Registrations inside external documents are not followed implicitly. Every required external contribution must be declared by the main document. Unavailable sources remain recorded and unresolved while available declarations can still be examined.

Source registration and source-qualified references are an optional document convention, separate from the core judgment grammar. The standard CLI and LSP enable this convention; the core parser accepts it only when explicitly configured with `sourceRegistrations: true`.

## Sharing and separation

The same word in the same abstraction context identifies one contextual term across included sources. Across different contexts, matching words coincide by default unless explicit identity statements distinguish them. Root terms share the special GLOBAL context. Different source documents do not automatically create different semantic contexts or separate GLOBAL identities. Included declarations can therefore contribute to the same concept while retaining their source provenance.

Source qualification addresses a particular external contribution:

```abstract
a:b.c@parts
```

The suffix `@parts` qualifies the complete contextual reference: `a` in the `b.c` context supplied by `parts`. The corresponding local reference is `a:b.c`. Qualification makes the source contributions separately addressable; it does not create a new semantic context or separate their concept identities.

Several referents may describe one shared concept. Different specifications, descriptions or resource locations alone do not require separating the concept. To distinguish matching words across contexts, authors can detach a contextual term with `(a:b.c)!.` or explicitly distinguish selected contextual terms. Different words are needed to distinguish uses within the same context, including GLOBAL; merely repeating a term through another source or path cannot split that identity. Source qualification alone does not make that distinction.

Inclusion may expose contradictions or entanglements, as described in [collisions.md](collisions.md). Comparing referents or versions is an application concern. Inclusion itself chooses no resolution.

## File operations

Applications may offer file operations to manage working documents. These operations concern loading and persistence; they do not define what makes a document main or external. Closing a document contribution is distinct from closing an editor tab.

Saving writes the main document's authored declarations and source registrations. External declarations are written into the main document only through an explicit copying operation. Copying is distinct from inclusion and leaves the original source unchanged.

Closing an external document unloads its contribution while retaining its registration. Dropping it additionally removes its registration from the main document. Locally authored or explicitly copied declarations remain. References depending on an unavailable source may remain unresolved.
