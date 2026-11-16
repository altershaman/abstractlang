# Abstract core: syntax and semantics

This document defines the minimal language. It specifies what it expresses, independently of conventions for composing consistent documents and independently of applications or implementations.

## Judgment, relationship and term

A **judgment** asserts that the relationship on its right is, or is not, an [abstraction](abstraction.md) of the relationship on its left.

```abstract
// Three judgments
engine.car::part.whole
wheels.car::part.whole
driver.car::operator.machine
```

A set of judgments records **knowledge claims**. These judgments can be written and kept in an **Abstract document** (see [document.md](document.md)).


A judgment has two sides, each written as a relation expression: two related terms joined by a dot. In the examples, `engine.car`, `wheels.car` and `driver.car` occupy the left side; `part.whole` and `operator.machine` occupy the right. Outside a judgment, a relation expression states only that its terms are related; it asserts no abstraction and has no privileged orientation.

`engine`, `car`, `part`, `whole`, `wheels` and `driver` are **words** — written symbols. A **term** is an occurrence of a word in a judgment.

A term's context determines which **concept** it denotes. The abstraction on a judgment’s right supplies a context for interpreting the terms on its left. Within one context, the same word denotes the same concept. Across contexts, occurrences of the same word potentially denote different concepts, but coincide by default. Explicit identity statements can detach a contextual term, join selected identities or assert that they differ.

*How concepts are represented or stored, and how references are resolved computationally, are matters of implementation outside the language specification.*

### Correspondence

In `a.b::c.d`, the left relation expression occupies the **concrete** side, and the right relation expression occupies the **abstract** side. These sides are relative to this judgment. Neither role is an intrinsic property of a term or relation expression. The written order of the endpoints determines their correspondence with the endpoints on the other side.

Written positions establish the correspondence:

| Concrete endpoint | Abstract endpoint |
|---|---|
| `a` | `c` |
| `b` | `d` |

The assertion concerns the relationship as a whole. It does not decompose into two independent assertions about the individual endpoints. 

### Polarity

`a.b::c.d` asserts concretization under the correspondence.

`a.b!c.d` asserts that this concretization does not hold. Negation is a statement of NOT. It is neither absence of an assertion, deletion of an assertion, nor rejection of another author's assertion. It requires no previously recorded positive judgment.

Under the same interpretation and correspondence, the positive and negative forms are opposing assertions. Both are syntactically well formed. A composition policy determines how opposing assertions are reported, accepted or resolved.

### Collisions

Reversal equivalence and the structures it helps distinguish are described in [collisions.md](collisions.md).

### Contexts and GLOBAL

A **reference** expression, such as `a:c.d`, selects a term within its abstraction context. Within one context, the same word strongly denotes the same concept. Different paths to that context do not create separate identities.

```abstract
// Tree segment
a.b::c.d
e.f::c.d
c.d::j.k
// Diamond segment
a.b::g.h
g.h::i.m
g.h::n.o
i.m::p.q
n.o::p.q
```

Here, `a` is available in several abstraction contexts, including `c.d`, `g.h` and `p.q`. All these contextual `a`s coincide by default. Either branch through `i.m` or `n.o` reaches the same `a` in `p.q`.

Terms at the roots, with no further recorded abstraction above them, belong to the special **GLOBAL** context. In this example, the root words are `j`, `k`, `p` and `q`. GLOBAL gives each word one firm identity: reaching `p` through two branches does not create two potentially distinct GLOBAL `p`s. The same applies to `q`. GLOBAL is a semantic root context, not an additional judgment or an implicit root relation expression.

When selecting a term by reference, the context’s endpoint order does not matter: `a:c.d` and `a:d.c` select the same contextual term. In a judgment, endpoint order still determines correspondence.

### Coincidence, identity and distinction

Default coincidence lets authors use the same word across contexts without writing an identity assertion for every use. It does not prevent them from distinguishing particular contextual terms.

```abstract
(a:c.d)!.
(a:g.h)!.
(a:c.d).(a:g.h)::.
```

The first statement detaches `a` in `c.d` from default coincidence with the other contextual `a`s. The second detaches `a` in `g.h` independently, including from `a:c.d`. The final statement explicitly identifies these two detached terms as denoting the same concept. They remain separate from the other `a`s, which still coincide by default.

Unary `!.` disables implicit coincidence. It does not assert permanent inequality, cancel explicit equality or prevent a later explicit connection. Within any one context, including GLOBAL, matching words still have one identity; a path or repeated occurrence cannot split it.

The identity forms are:

| Form | Meaning |
|---|---|
| `a.b::.` | The default concepts named `a` and `b` share identity. |
| `(a:c.d).(a:g.h)::.` | These contextual terms share identity explicitly. |
| `(a:c.d)!.` | This contextual term no longer participates in default coincidence with the other `a`s. |
| `(a:c.d).(a:g.h)!.` | These contextual terms explicitly denote different concepts. |

A bare word selects its default identity; a contextual reference selects the term in its named context, including when it has been detached. Equality and binary distinction may therefore use words or parenthesized contextual references as operands. Explicit contextual references must select available terms; references cannot stand alone as document statements.

Equality is reflexive, symmetric and transitive. Binary distinction is symmetric but not transitive: `a` distinct from `b`, and `b` distinct from `c`, does not establish whether `a` and `c` share identity. Explicit distinction constrains default coincidence. Equality and distinction that require the same two terms to be both identical and distinct expose an identity collision; the language chooses no resolution.

These forms introduce no abstraction relationship. `!.` concerns concept identity and differs from `!` between relation expressions, which negates a concretization judgment. Similarly, `a.b::.antonyms` is ordinary repeated-abstraction shorthand for `a.b::antonyms.antonyms`; the word `antonyms` is not reserved and does not itself assert distinct identity.

Judgments and explicit identity assertions can also be combined through [shorthand](sugar.md#referenced-terms-in-judgments). Contextual addresses remain separately available even when their concepts coincide or have been explicitly identified.

## Repeated abstraction terms

An abstraction may use the same word in both endpoint positions:

```abstract
bob.rob::brother.brother
```

Both concrete endpoints correspond to the abstract term `brother`. This does not require `bob` and `rob` to denote the same concept.

```abstract
bob.rob::sibling.sibling
```

This uses another context. The language does not infer a relationship between `brother.brother` and `sibling.sibling` from their word meanings. The shorthand for repeated abstraction terms is defined in [sugar.md](sugar.md), separately from the core syntax.

## Syntax

Words contain no whitespace. They consist of Unicode letters, digits, underscores, hyphens and combining marks, and cannot begin with a combining mark. Spelling is case-sensitive; no normalization is implied.

```ebnf
document  = { line, end_of_line }, [ line ] ;
line      = [ statement ], [ comment ] ;
statement = judgment | identity | distinction | detachment ;
judgment  = relation, operator, relation ;
identity  = operand, ".", operand, "::." ;
distinction = operand, ".", operand, "!." ;
detachment = qualified, "!." ;
operand   = word | qualified ;
relation  = word, ".", word ;
qualified = "(", reference, ")" ;
reference = word, ":", context ;
context   = relation ;
operator  = "::" | "!" ;
comment   = "//", { ? any character except a line ending ? } ;
end_of_line = "\n" | "\r\n" ;
```

Each statement occupies one physical line. The last line may end at end of input. Spaces and tabs may separate tokens and may surround a statement; they do not introduce grouping. The characters of `::`, the equality marker `::.` and the identity-distinction marker `!.` cannot be separated by whitespace. Blank lines have no semantic effect. `//` starts a comment that continues to the end of the line.

## Referent attachment

A **referent** is something a contextual term points to that describes, identifies or realizes its concept, wholly or partly. One concept may have several referents.

For example, `api:interface.black_box` may have an API specification, a Markdown description and a deployment IP address as referents. They contribute information about different aspects of one API concept.

Referent attachment is handled outside the language specification. Default coincidence and explicit equality establish shared concept identity; they do not require matching referents or prescribe how referent data is combined.

## Purpose and extensibility

The language provides a common written form for recording, communicating and examining how relationships are understood through abstractions.

Interpreting these records produces a graph. Applications may impose structural constraints, such as requiring that graph to be acyclic or to form a tree.

The core defines the meaning of these expressions. It leaves applications free to establish conventions for interpreting and combining documents, checking their consistency, and presenting the resulting graphs.

The language is intended to support extensions for additional forms of expression and particular uses. The extension mechanism, including how extensions are declared and combined, is to be defined **(TBD)**.

## Implementation status

The shared library implements default coincidence, GLOBAL root terms, bare-word equality, unary detachment and binary identity distinction. The CLI, language server and Origami use these rules through the shared core. Markdown attributions are a document convention implemented by the workspace and exposed through the language server and browser reader; they are not additional judgment syntax.
