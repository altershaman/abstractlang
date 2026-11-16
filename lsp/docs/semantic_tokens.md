# Abstract semantic tokens

The standard and Markdown-aware servers share this legend. Token classification lives in the reusable service package; the LSP encodes its source ranges. This changes presentation only, without changing language rules or identity.

| Token type | Written text |
|---|---|
| `term` | A term word |
| `dot` | `.` in relation expressions, shorthand and identity/distinction markers |
| `doubleColon` | `::` in judgments, continuations and equality markers |
| `bang` | `!` in negation, distinction and detachment |
| `colon` | `:` in a contextual reference |
| `comment` | `//` through the end of its line |

Terms can have the modifiers `concretization`, `abstraction`, `reference` and `rootAbstraction`. The first two describe a term's role in authored judgments, including judgments expanded from indentation. They are not permanent classifications of a word or concept. `reference` marks the words in an explicit contextual reference, including its context words.

```abstract
engine.car::part.whole
```

Here `engine` and `car` have the concretization role; `part` and `whole` have the abstraction role. Each dot and the double colon is a separate token.

```abstract
a.b::c.d::e.f
```

The middle words `c` and `d` have both roles: they abstract the preceding relation and concretize the next one. One written token carries both modifiers, rather than overlapping tokens.

```abstract
(a:c.d).(b:e.f)::part.whole
(a:c.d)!.
```

The referenced endpoint words in the first line have both concretization and reference modifiers; context words carry abstraction and reference modifiers. Equality, distinction and detachment do not give their endpoint words judgment-side roles by themselves; explicit context words retain their abstraction role. The token names for `::` and `!` classify spelling; they do not conflate the meanings of their different constructions.

Only written text is colored. Comments receive one standard `comment` token; any words and operators inside them are not classified separately. Registered source paths, source aliases and quoted text are not classified by this initial semantic provider. Parentheses are also deferred. Syntax highlighting supplied separately by an editor may still color those elements. Incomplete input retains lexical term and punctuation tokens; role modifiers require available parsed judgments. Tokens use UTF-16 positions and never overlap. In Markdown, the integration emits `term` for indexed mentions and adds `reference` for explicit mentions; surrounding prose and code do not become Abstract tokens.

## Editor styles

Both editor extensions map generic terms to variable-style colors, abstraction terms to type-style colors, and terms with both roles to function-style colors. Dots, colons and double colons share the same keyword/operator style; bangs use pale orange (`#D8B48A`) at normal weight. Comments use the theme’s comment style. These are theme fallbacks, not claims that Abstract terms are programming variables, types or functions. Actual colors depend on the theme and user overrides.

VS Code registers the custom token types and modifiers and supplies language-specific TextMate scope fallbacks. Reinstall the rebuilt VSIX and reload the editor to load new contributions. Use **Developer: Inspect Editor Tokens and Scopes** to inspect a term's semantic token type and modifiers. User overrides belong under `editor.semanticTokenColorCustomizations`; selectors include `term.concretization:abstract`, `term.abstraction:abstract` and `term.concretization.abstraction:abstract`.

Zed ships `languages/abstract/semantic_token_rules.json`. Reload or reinstall the development extension after changing those rules, and restart the language server after changing its legend. Keep Abstract's `semantic_tokens` set to `combined` or `full`. Use **dev: open highlights tree view** to inspect tokens. User overrides go under `global_lsp_settings.semantic_token_rules`, matching `token_type` and `token_modifiers`. To color a chain's middle terms separately, place its two-modifier rule before single-role rules. No user settings are changed by building the packages.

Selecting text and highlighting related occurrences is a different feature. This token implementation does not add `textDocument/documentHighlight`; Zed's text-selection matches may still include comments until its selection highlighting is disabled.

References: [LSP semantic tokens](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_semanticTokens), [VS Code semantic highlighting](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide), [Zed semantic styling](https://zed.dev/docs/semantic-tokens), [Zed language-provided rules](https://zed.dev/docs/extensions/languages#extension-provided-semantic-token-rules).

## Root abstractions

`rootAbstraction` marks terms in an abstraction relation that has at least one incoming positive judgment and no outgoing positive judgment in the current interpretation. Both editor extensions render those terms in bold while retaining abstraction styling. In `a.b::c.d::e.f`, only `e.f` is a root. Reversed spelling of a relation preserves its place in this calculation. A word's occurrence in another relation is not automatically bold.

Explicit contextual references to an established root receive the same modifier. Included Abstract documents participate in root detection, so loading an additional abstraction can remove bold styling from a formerly terminal relation. Missing sources cannot contribute unknown edges. Negation and identity assertions do not create positive abstraction edges; cycles with outgoing edges have no terminal root. The standalone `semanticTokens(document)` API uses that document, while `semanticTokens(document,{graph})` accepts a composed interpretation.

## Selecting relations through dots

Place the cursor on a word to highlight its concept, or on the separating dot to highlight the relation expression. In `a.b::c.d`, these dots independently select `a.b` and `c.d`. Matching uses endpoint identities and can find synonyms and reversed spellings in concrete, abstract and explicit-context positions. This is expression highlighting, not a claim that different judgments are equivalent. Comments, paths, `::.`/`!.` marker dots and dots separating identity operands are not relation-selection targets. Dots inside those operands' explicit context relations still work.

Complete expressions are highlighted as a whole, including their written endpoint references. Leading/trailing shared-concept blocks highlight separate written fragments rather than unrelated text between them. A shared trailing dot can supply several relations; selecting it highlights their combined matches. Document highlights remain local; identity assertions from included sources can affect matching. Ordinary word-based Find References remains available separately.
