# Abstract syntactic sugar

This document defines optional shorthand for [the core language](core.md). Shorthand expands to core expressions. Its meaning is defined entirely by those expanded expressions.

## Shared abstraction term

When an abstraction uses the same word in both endpoint positions, it may be written once after a leading dot:

```abstract
bob.rob::.brother
```

This expands to:

```abstract
bob.rob::brother.brother
```

`.brother` denotes exactly the `brother.brother` abstraction context.

### References and identity assertions

The same shorthand may be used in a reference fragment, which is not a standalone document statement:

```abstract
bob:.brother
```

This expands to:

```abstract
bob:brother.brother
```

It also applies inside an identity assertion:

```abstract
(bob:.brother).(rob:.brother)::.
```

This expands to:

```abstract
(bob:brother.brother).(rob:brother.brother)::.
```

Only `.brother` is abbreviated here; `::.` retains its [core identity meaning](core.md#coincidence-identity-and-distinction).

## Referenced terms in judgments

A reference can be written directly as an endpoint on the concrete side of a positive abstraction judgment:

```abstract
(a:c.d).(b:g.h)::part.whole
```

This expands to:

```abstract
(a:c.d).(a:part.whole)::.
(b:g.h).(b:part.whole)::.
a.b::part.whole
```

Each reference supplies its word to the new judgment. The identity assertions establish that the term in the new context denotes the same concept as the selected term in the original context. Both contextual addresses remain available for subsequent references.

An endpoint written as a plain word needs no additional identity assertion:

```abstract
(a:c.d).b::part.whole
```

This expands to:

```abstract
(a:c.d).(a:part.whole)::.
a.b::part.whole
```

The contexts remain distinct. The generated equality is explicit: it connects the selected contextual terms even if either has been detached from default coincidence.

## Chains and indentation

Indentation groups expressions for expansion. The grouping itself adds no meaning to the resulting judgments.

Use spaces or tabs consistently. Siblings align, children are indented beyond their parent, and dedents return to an existing level. The examples use four spaces; the width is not prescribed.

### Abstraction chains

An inline chain states adjacent judgments:

```abstract
a.b::c.d::e.f
```

The indented form is:

```abstract
a.b
    ::c.d
        ::e.f
```

Both expand to:

```abstract
a.b::c.d
c.d::e.f
```

Neither form adds `a.b::e.f` as an asserted judgment.

### Several abstractions of one relationship

Sibling continuations share their parent's concrete expression:

```abstract
a.b
    ::c.d
    ::e.f
```

Alternatively, a trailing `::` supplies the concrete expression to each child:

```abstract
a.b::
    c.d
    e.f
```

Both expand to:

```abstract
a.b::c.d
a.b::e.f
```

A deeper continuation uses its immediate parent, not every preceding expression. Branches therefore state only the judgments explicitly supplied by their layout.

### Several concretizations of one abstraction

Consecutive unfinished relation expressions at one indentation level can share an abstraction. A leading `::` indented beneath the last expression completes the group:

```abstract
a.b
c.d
    ::e.f
```

This expands to:

```abstract
a.b::e.f
c.d::e.f
```

A blank line, a completed statement or the end of the enclosing block ends the pending group. Every unfinished expression must receive a continuation; it is not a standalone core statement. A continuation cannot reach across a blank line.

### Shared first term

A header ending in a dot supplies the first term of each child's concrete relation expression:

```abstract
car.
    engine::whole.part
    wheel::whole.part
```

The equivalent leading-dot form is:

```abstract
car
    .engine::whole.part
    .wheel::whole.part
```

Both expand to:

```abstract
car.engine::whole.part
car.wheel::whole.part
```

The header repeats a word; it does not bind a concept before the judgments are expanded. If the children have different abstraction contexts, the repeated word coincides across them by default. Explicit identity statements can distinguish those contextual terms. Only the first endpoint of each child's concrete expression is supplied by the header; subsequent abstraction expressions are complete expressions.

### Limits

Every block header or unfinished expression must expand to complete core statements. Neither `!`, `::.` nor `!.` opens an indentation block.

Resolve contexts and identities after expanding all shorthand. Combining shorthand forms must preserve the resulting core judgments and identity assertions.

The identity rules are described in [core.md](core.md#coincidence-identity-and-distinction). Shorthand expansion must preserve explicit equality and distinction independently of default coincidence.
