Intro to ww as part of tool-lang-records triade.
Short tool-lang-records triad

WW main article



# Abstract Language

Abstract language is a minimal formal language for expressing knowledge as relationships. It has no objects, no properties, no hierarchies — only relations and the statements that connect them. Everything that can be said is said through a single kind of statement.

---

## Entities

An entity is any identifier — a word, a name, a symbol — assigned to something observable or imaginable. Entities carry no intrinsic meaning. Their meaning emerges entirely from the relations they participate in.

If you know nothing about an entity, you give it a name and begin relating it to other things. The accumulation of those relations is all there is to know about it.

---

## Relations

A **relation** is a directed connection between two entities:

```
entity_a.entity_b
```

The dot `.` marks an arbitrary relation. It has no fixed semantics — it means only "entity_a relates to entity_b in some way". What that way is, is expressed by the abstraction side of a Knowledge Element (see below).

Relations are directed: `apple.tree` and `tree.apple` are distinct relations, though they are mirror images of each other.

---

## Knowledge Elements

The **Knowledge Element** (KE) is the only declarative unit in abstract language. Every statement is a KE. A KE connects two relations through the declaration-abstraction axis:

```
entity_a.entity_b : entity_c.entity_d
```

- The **left side** (`entity_a.entity_b`) is the **declaration** — the concrete, specific, particular instance.
- The **right side** (`entity_c.entity_d`) is the **abstraction** — the higher-level pattern, type, or principle that the declaration exemplifies.
- The colon `:` marks the declaration-abstraction relationship between two relations.

A KE is read as:

> *entity_a relates to entity_b **as** entity_c relates to entity_d.*

Or equivalently: the relation on the left is an instance, manifestation, occurrence, or example of the relation on the right.

### Examples

```
apple.tree : fruit.plant
```
*Apple relates to tree as fruit relates to plant.*
The apple-tree relation is an instance of the fruit-plant relation.

```
wheel.car : part.vehicle
```
*Wheel relates to car as part relates to vehicle.*
The wheel-car relation is an instance of the part-vehicle relation.

```
earth.sun : planet.star
```
*Earth relates to the sun as a planet relates to a star.*

### Validation

Before stating a KE, two questions must both be answered yes:

1. **Is the declaration truly an instance of the abstraction?** The left relation must concretely exemplify the pattern expressed by the right relation. Part-whole composition (`wheel.car`) is different from abstraction (`planet.star`) — do not confuse them.
2. **Does the abstraction genuinely manifest as the declaration?** The right relation must be a real generalization that the left relation falls under, not merely a superficial resemblance.

If both answers are yes, the KE is valid and can be stated.

---

## Mirror Symmetry

A KE can be read in both directions without loss of meaning:

```
entity_a.entity_b : entity_c.entity_d
      ≡
entity_b.entity_a : entity_d.entity_c
```

Both express the same analogy, only with both relations reversed simultaneously. `apple.tree:fruit.plant` and `tree.apple:plant.fruit` are the same statement. This is called the **mirror** of a KE.

A consequence: the order within each relation matters, but swapping both relations symmetrically produces an identical fact.

---

## Identity and Deduplication

**If two identical KEs occur, all four corresponding entities are the same.** An identical KE is one whose content — after considering mirror symmetry — is the same. Restating an existing KE does not add new knowledge; it merely confirms identity.

**If an entity name appears in multiple KEs, those occurrences may or may not refer to the same entity.** Entity identity across KEs is not guaranteed by name alone — it is established by the network of relations in which the entity participates. The same name in different KEs could be the same entity or a coincidental reuse of the identifier.

---

## The Knowledge Graph

All stated KEs together form a **knowledge graph**. The four entities in each KE are nodes; the relations and the declaration-abstraction connection between them are edges. The graph has no privileged center — every entity is defined by its position in the web of relations.

The graph grows by stating new KEs and is never modified in place. Knowledge is accumulated, not overwritten.

---

## KE Lifecycle

A KE can be in one of three epistemic states:

| State | Meaning |
|---|---|
| **Stated** | The KE is asserted as true. It is part of the active knowledge. |
| **Blamed** | The KE is marked as untrue. It is a negative assertion: the relation was believed, then found to be wrong, deceptive, or harmful. The KE is remembered as a known falsehood. It can be reclaimed if the negative judgment is reversed. |
| **Retracted** | The KE is erased — treated as a mistake in expression, not a judgment about truth. It leaves no trace. |

The distinction between *blame* and *retract* is important:

- **Blame** is a substantive act. "This relation does not hold, and I want to record that." A blamed KE can be shared, discussed, and potentially reclaimed.
- **Retract** is an administrative act. "I stated this incorrectly — a typo, a misparse, an accident." A retracted KE disappears as if it was never stated.

---

## Aliases

Any relation can be given one or more **aliases** to improve readability:

```
entity_a.entity_b = alias
```

Aliases can then appear in place of the full `entity.entity` form in KEs:

```
alias : entity_c.entity_d
entity_a.entity_b : alias
alias1 : alias2
```

Because relations are directed, aliases carry directional meaning:

| Syntax | Meaning |
|---|---|
| `>alias` | Alias for the relation read left-to-right |
| `<alias` | Alias for the relation read right-to-left |
| `=alias` | Direction-agnostic alias |

A single relation can hold all three alias forms simultaneously. The direction of an alias affects how the KE is interpreted and communicated, not its underlying identity.

---

## Comments

Any line beginning with `//` is a comment and is ignored. Comments are per-line only — there are no block comments.

```
// This is a comment
apple.tree : fruit.plant        // inline-style markers in docs only
- earth.sun : planet.star
```

Comments can appear anywhere in a `.ab` file to annotate or group KEs for readability. They carry no semantic weight.

---

## What Abstract Language Is Not

- It is not a logic — there are no quantifiers, no inference rules, no proofs.
- It is not an ontology — there is no fixed taxonomy of categories.
- It is not a property graph — entities have no intrinsic attributes, only relations.
- It is not a type system — abstraction is not subtyping; it is analogical patterning.

Abstract language is a medium for recording and sharing the relational structure of knowledge, keeping that structure open and extensible without committing to any particular interpretation framework.
