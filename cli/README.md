# Abstract CLI 1.0.0

`@abstractlang/cli` supplies read-only tools using the same current core as the LSP.

```sh
abstract validate --json examples/vehicle.abstract
abstract expand --json examples/vehicle.abstract
abstract inspect --json examples/vehicle.abstract
```

Use `--core` to accept only minimal core syntax. Default parsing accepts documented sugar and the optional direct-source convention. Use `-` for stdin, once, and `--` before paths beginning with a dash. Commands never write input documents.

Exit codes are 0 for valid syntax (including warnings and collision findings), 1 for syntax errors and 2 for command/file errors. JSON responses use schema `abstract.cli.v1`, with `ok`, per-file diagnostics and collision records. Expansion concerns the main document's authored declarations; external source text is never silently copied into it.

The CLI handles judgments, identity assertions and the documented sugar. Attributes and the proposed Knowledge structures syntax are not implemented by this CLI.

The CLI depends on `@abstractlang/core` and the standard `@abstractlang/service/files` resolver. It does not discover neighboring Markdown notes or derive Markdown attributes.
