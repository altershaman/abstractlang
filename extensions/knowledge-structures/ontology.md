# Ontologies

This document records the proposed language-level meaning and syntax of ontologies. It is a specification draft; it does not claim that the current core parser implements these constructions.

## Purpose

A judgment records a single abstraction understanding: a piece of knowledge. Judgments together can form a graph, DAG or taxonomy, expressing progressively more organized understanding. An ontology selects abstractions to express a particular aspect of that understanding, restricted by a purpose or task.

An ontology can address part of a domain, a whole domain or several domains. It is not itself a domain, and an abstraction context is not a domain. See [domains.md](domains.md).

## Membership and scope

An ontology consists of selected abstractions together with their concretizations, following downward paths through recorded judgments. Selecting an abstraction does not assert new judgments; the paths come from the document's recorded understanding.

Direct membership is distinct from inclusion through a path. The selected abstractions establish the ontology's starting points; their concretizations supply the understanding available beneath them.

Ontology membership does not establish concept identity, detach terms or resolve collisions. Those operations must remain explicit rather than follow silently from selecting a view of understanding.

## Syntax

The `*` marker associates an abstraction with an ontology:

```abstract
part.whole*composition
component.system*composition
```

These memberships introduce `composition`. No separate `*composition` declaration is required. Attributes are outside Abstract; an ontology does not need a declaration body for titles, descriptions or presentation settings.

A membership block is shorthand:

```abstract
*composition
    part.whole
    component.system
```

The block expresses the same memberships as the two individual lines above. Its contents are abstraction selections, not new concretization–abstraction judgments. The ontology name is a selection name, not an endpoint term in those judgments.

For example:

```abstract
engine.car::part.whole
wheel.car::part.whole
sensor.controller::component.system

*composition
    part.whole
    component.system
```

The ontology selects both abstractions and includes the concretizations reached beneath them. Tools can provide different ways to populate these memberships; those interaction mechanics do not define their language meaning.

## Boundary

The language records selection and its meaning. Nesting rectangles, rendering edges or tags, hiding elements, colors and saved viewer state are application concerns. The same ontology can support different presentations without changing its membership.

## Points still to settle

- How to select a particular contextual reading when the same relation expression participates in several abstraction contexts.
- Whether individual exclusions from downward inclusion are needed, and their syntax.
- How ontology memberships compose across documents, including conflicting selection names.

The proposed syntax does not yet prescribe these operations.
