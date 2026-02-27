# Abstract Language Rules

## Purpose

Abstract language communicates relationships. Relationships collectively constitute a knowledge graph.

---

## Knowledge Element (KE)

The only declarative statement in abstract language. A KE expresses a **declaration-abstraction** relationship.

### Syntax

```
entity_a.entity_b : entity_c.entity_d
```

- `.` — marks an arbitrary relation between two **entities** (identifiers)
- `:` — marks the declaration-abstraction relationship between two **relations**
- Left side (`entity_a.entity_b`) — the **declaration**
- Right side (`entity_c.entity_d`) — the **abstraction**
- Whitespace is ignored

Reading: *"entity_a relates to entity_b as entity_c relates to entity_d."*

### Validity

To state a KE, both must be true:
1. The declaration is genuinely an instance, class, revelation, occurrence, or manifestation of the abstraction
2. The abstraction manifests as the declaration

Note: part-whole is **composition**, not abstraction — it does not qualify as a KE.

---

## Entities

- Entities are defined entirely by what they relate to — there is no inherent definition
- If you start with no knowledge of an entity, assign a name to something observable or imaginable and derive its meaning from relations and abstractions
- **Same name in different KEs does not guarantee same entity** — context determines identity
- **Identical KEs guarantee identical entities** — all four positions refer to the same things

---

## Immutability

KEs are immutable statements. A KE either exists in the kb or it does not. There is no "updating" a KE — changing any entity produces a **different KE**, not a new version of the same one.

**Why?** A KE is a statement about reality, not a record in a database. Statements don't change — they are either true or false, present or retracted. If you change `apple.banana:cherry.date` to `apple.banana:cherry.fig`, you have not modified the first statement — you have made a second, different statement. The first one may still be true independently. Treating a KE as mutable would mean the same identifier refers to different facts at different times, which destroys the reliability of any other KE that references its entities. Immutability guarantees that every stated KE means exactly what it said when it was stated, forever.

Consequences:
- No versioning, no branching, no forking
- Derivation or lineage between KEs is itself expressed as a KE
- The kb is a flat set of immutable statements

---

## Canonical Form

Both `.` and `:` are **directional**. `a.b` and `b.a` are distinct relations (Boss→Reporter is not the same as Reporter→Boss). `:` is always declaration on the left, abstraction on the right — by design, not symmetric.

However, a KE as a whole encodes a relational analogy that holds in **both reading directions simultaneously**:

- `John.Willy : Boss.Reporter` — "John relates to Willy as Boss relates to Reporter"
- `Willy.John : Reporter.Boss` — "Willy relates to John as Reporter relates to Boss"

These are **the same KE** — not because the individual relations are symmetric, but because the analogy statement itself is equivalent when read from either direction. One reading implies the other.

### Definition

The canonical form of a KE `a.b:c.d` is the lexicographically smaller of:
- `(a, b, c, d)`
- `(b, a, d, c)` — the mirror (statement read in reverse direction)

Both forms refer to the same KE. The kb stores whichever form the author stated; identity and deduplication are always based on the canonical form.

---

## CRUD

```
ww new <ke>       — assert a statement (fails if already exists or previously existed)
ww destroy <id>   — retract a statement
ww list / find / show / status — query
```

---

## Syntax Sugar

### Aliases

Assign an alias to any relation:

```
entity_a.entity_b = alias
```

Use aliases in KEs:
```
alias : entity_c.entity_d
entity_a.entity_b : alias
alias1 : alias2
```

### Directional Aliases

Direction matters. A KE can be read left-to-right or right-to-left.

- `>alias` — left-to-right alias
- `<alias` — right-to-left alias
- `=alias` — direction-agnostic alias

A relation can carry all three simultaneously.
