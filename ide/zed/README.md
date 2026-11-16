# Abstract for Zed

Reference client for `.abstract` files using the standard Abstract LSP. The extension bundles the server and needs Node.js 20+ at runtime. It does not register Markdown support.

Follow the [IDE build instructions](../README.md). For local development, use Zed's **Install Dev Extension** and select this `ide/zed` directory after building its server bundle. Packaging additionally builds the Wasm extension with Rust and the `wasm32-wasip2` target. Semantic-token rules and language settings are included here; see `settings.example.json` for inlay hints.

To use the source server instead, configure a server override in Zed settings, replacing the example paths:

```json
{
  "lsp": {
    "abstract": {
      "binary": {
        "path": "/absolute/path/to/node",
        "arguments": ["/absolute/path/to/abstractlang/lsp/bin/abstract-lsp.js", "--stdio"]
      }
    }
  }
}
```

Install root npm dependencies before launching the source server. Restart the language server after source changes. Bundled server changes require rebuilding the extension.
