# Domains

This document records the proposed language-level meaning and syntax of domains. It is a specification draft; the current parser and identity implementation have not yet been revised to implement this proposal.

## Purpose

A domain is a subject of understanding. Domains implicitly precede the judgments people make about them; a header names a domain rather than bringing the subject into existence. An abstraction supplies a context for interpreting a concretization, but that context is not a domain.

A domain selects judgments through their concretizations in their abstraction contexts and includes their upward abstraction paths. Selecting a concretization in its context selects a judgment, not an isolated left-hand expression. An [ontology](ontology.md), conversely, selects abstractions and includes their downward concretization paths. Ontologies express aspects of understanding; domains identify what is being understood.

Following an upward path does not include sibling concretizations merely because they share an abstraction. Selecting an engine's relationship to a car must not automatically include every other relationship understood through `part.whole`.

How users select many concretizations is an implementation matter. Tools may offer bulk selection, queries or graph interactions; the language records the resulting membership.

## Document headers

A domain header marks the domain for subsequent judgments:

```abstract
#cars
engine.car::part.whole
wheel.car::part.whole

#motors
piston.engine::part.whole
```

Each header applies until the next domain header or the document's end. The judgments contribute their concretizations to the named domain; their abstractions remain available along upward paths.

`cars` and `motors` above are independent root domains. A preceding header does not make a following domain its child. Repeating a header returns to the same named domain rather than creating a new domain.

The `#` marker introduces a domain header; comments continue to use `//`.

## Nested domains

Explicit qualification expresses nesting:

```abstract
#cars
wheel.car::part.whole

#cars.motors
piston.engine::part.whole
engine.car::power_unit.vehicle

#motors
rotor.motor::part.whole
```

`cars.motors` is nested within `cars`. The final `motors` is a separate root domain. Domain-name dots express hierarchy; they are not relation-expression dots between judgment terms.

Nesting organizes subject matter. It does not by itself equate terms, detach matching words or make a parent domain's interpretation override a child's.

Whether `#cars.motors` requires an explicit declaration of `#cars` remains unresolved. A missing parent must not be assumed to be implicitly introduced until this rule is agreed.

## Identity

Spelling coincidence concerns terms. It supplies a provisional default where no explicit identity boundary has been established; it does not establish a domain.

Identity and detachment remain distinct operations:

- Identity asserts that selected contextual terms denote the same concept. It joins their identities without removing their existing spelling coincidence.
- Detachment explicitly removes a selected contextual term from default spelling coincidence. Explicit identity assertions still apply.
- Authors can combine detachment with identity when they intend a bounded identity group.

Equality alone does not imply detachment. Establishing sameness provides no reason to separate either operand from terms with which it already coincides. The existing core rule is preserved.

Neither identity assertions nor detachment alone define a domain. Conversely, domain membership alone must not be treated as an identity assertion. The precise relationship between domain membership, contextual identity and cross-domain references still needs specification.

## Change over time

Domains can sharpen, merge and split as understanding develops. The language must allow their membership and organization to be revised without equating domain reorganization with concept identity changes. Historical versions, migration operations and editing workflows are not specified here.

## Points still to settle

- Whether a nested domain requires its parent to be explicitly declared, and whether declaration order matters.
- How to express membership in several domains without duplicating judgments.
- What judgments before the first domain header belong to; no implicit named domain is specified yet.
- How domain membership selects concretizations with several contextual readings, and how references address them.
- Which direct memberships a chain or indented shorthand contributes. Expansion must not accidentally change the intended scope.
- The exact inclusion relationship between a parent domain and its subdomains.
- Domain-name composition across documents and the operations for changing domain boundaries.

These questions remain open rather than being resolved by header order, spelling coincidence or viewer behavior.
