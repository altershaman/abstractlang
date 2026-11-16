# Reference IDE clients

VS Code and Zed clients use the standard Abstract LSP. They provide language registration, launch and editor presentation; language behavior lives in core/service. Markdown and scenario integrations are outside these clients.

## Build and package

From the repository root, install language dependencies and optional IDE build dependencies separately:

```sh
npm ci
npm --prefix ide ci
npm --prefix ide run build
npm --prefix ide test
npm --prefix ide run package:vscode
npm --prefix ide run package:zed
```

VS Code and Zed share a generated standard server bundle. Packages appear in `ide/dist/`. Building Zed additionally requires Rust and the `wasm32-wasip2` target. Core, service, CLI and source LSP do not require the IDE dependency installation or builds. Source changes require rebuilding bundled clients; a configured source server needs only a restart.

See [VS Code](vscode/README.md) and [Zed](zed/README.md) for installation and server overrides. No extension is installed by these build commands.
