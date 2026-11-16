# Collisions

Judgments can collide within one document, as declarations evolve, or when declarations from several documents are considered together. Contradiction and entanglement concern the structure of judgments. Detection exposes them without choosing a resolution.

## Orientation and equivalence

Endpoint order determines correspondence within a judgment, but neither simultaneous orientation is privileged:

```abstract
a.b::c.d
b.a::d.c
```

These express the same judgment. Both preserve the correspondences `a` with `c` and `b` with `d`. The same rule applies to negation:

```abstract
a.b!c.d
b.a!d.c
```

Reversing only one side generally changes the correspondence:

```abstract
a.b::c.d
b.a::c.d
```

The first aligns `a` with `c`; the second aligns `b` with `c`. Exchanging the concrete and abstract sides also generally changes the judgment's meaning. Equivalent spellings can be recognized while preserving every authored occurrence and its provenance.

## Contradiction

A **formal contradiction** consists of positive and negative assertions of the same contextual judgment:

```abstract
a.b::c.d
b.a!d.c
```

These share context and correspondence, with opposite polarity. Matching words coincide across contexts by default, subject to explicit identity statements. Shared identity does not by itself make judgments in different abstraction contexts contradictory: their contexts, correspondence and polarity must also be considered. Explicit equality can reveal that differently spelled terms denote the same concepts.

## Entanglement

An **entanglement** occurs when positive judgments assert crossed correspondences between the same concrete contextual terms and the same abstraction endpoints:

```abstract
a.b::c.d
a.b::d.c
```

The first aligns `a` with `c` and `b` with `d`; the second aligns `a` with `d` and `b` with `c`. The context is shared, so each repeated word denotes the same concept. Cases that reduce to equivalent judgments because an endpoint is repeated are repetitions, not entanglements.

The identity assertion `(a:c.d).(a:d.c)::.` adds no such crossing. Its two references already select the same contextual term. Indirect abstraction paths can also expose opposing correspondences; detecting them does not add transitive judgments to the document.

## Identity collisions

Explicit equality and binary distinction collide when they require the same contextual terms to denote both one concept and different concepts:

```abstract
(a:c.d).(a:f.g)::.
(a:c.d).(a:f.g)!.
```

Assuming the references resolve, these are opposing identity assertions. Equality through intermediate terms can expose the same collision. Binary distinction does not propagate transitively.

Unary detachment is different:

```abstract
(a:c.d)!.
(a:f.g)!.
(a:c.d).(a:f.g)::.
```

This is not a collision. The first two statements remove default coincidence; the third explicitly joins the detached terms. Detachment does not assert permanent inequality. Default coincidence is defeasible, so an explicit distinction is not a collision merely because matching words would otherwise coincide. Within a context, including GLOBAL, the same word still selects the same identity regardless of source or path.

## Practical guidance

These recommendations concern constructing an interpretation, not additional language rules.

For a contradiction, choose which opposing assertion to retain in the resolved interpretation. The original assertions may remain recorded for comparison or history. The language does not select the preferred assertion.

For an entanglement, examine the intended endpoint correspondence and concept identities. The author decides whether the crossing expresses the intended understanding or calls for a correction or distinction.

When an identity assertion brings together terms with different referents, consider whether those resources represent versions of the same concept. Their claims may agree, differ or conflict. Referents describing different aspects can also coexist: an API specification, description and deployment address need not be competing versions. Multiple referents alone are not a collision.

Referent attachment and comparison are outside the core language. Shared concept identity does not merge referent contents, select a version or establish that descriptions agree.

## Treatment

Contradiction, entanglement and opposing identity assertions are findings, not syntax errors in otherwise well-formed declarations. Acceptance, rejection, diagnostic severity and resolution belong to the application or interpretation. Reporting a finding must not silently rewrite assertions, discard provenance or choose among resources.

See [core.md](core.md) for contextual identity and [document.md](document.md) for main/external roles and source inclusion.

Identity collisions are reported without selecting a resolution; see [the identity rules](core.md#coincidence-identity-and-distinction).
