# Abstract for VS Code

Reference client for `.abstract` files using the standard Abstract LSP. It supports contextual hover/navigation, completion, diagnostics, semantic colors, detachment actions and identity hints as supplied by the server. It does not attach to Markdown files.

Build with the [IDE instructions](../README.md), then use **Extensions: Install from VSIX** and select `ide/dist/abstractlang-1.0.0.vsix`. The package includes the standard server. Run **Abstract: Restart Language Server** after changing configuration.

For development, set `abstract.server.path` to the absolute path of this checkout's `lsp/bin/abstract-lsp.js`. Install root npm dependencies first. Leave the setting empty to use the bundled server. Abstract defaults enable semantic highlighting and inlay hints and disable CodeLens. Editor themes control presentation.
