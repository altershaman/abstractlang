use zed_extension_api::{self as zed, settings::LspSettings, LanguageServerId, Result};

struct AbstractExtension;

impl zed::Extension for AbstractExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<zed::Command> {
        let settings = LspSettings::for_worktree(language_server_id.as_ref(), worktree)?;
        if let Some(binary) = settings.binary {
            if let Some(command) = binary.path {
                return Ok(zed::Command {
                    command,
                    args: binary.arguments.unwrap_or_else(|| vec!["--stdio".into()]),
                    env: binary.env.unwrap_or_default().into_iter().collect(),
                });
            }
        }

        let command = worktree.which("node").or_else(|| zed::node_binary_path().ok())
            .ok_or_else(|| "Node.js 20+ is required by the Abstract language server.".to_string())?;
        let directory = std::env::current_dir().map_err(|error| error.to_string())?;
        let server = directory.join("abstract-lsp-1.0.0.cjs");
        std::fs::write(&server, include_bytes!("../server/abstract-lsp.cjs"))
            .map_err(|error| format!("Cannot prepare bundled Abstract server: {error}"))?;
        Ok(zed::Command {
            command,
            args: vec![server.to_string_lossy().into_owned(), "--stdio".into()],
            env: Default::default(),
        })
    }

    fn language_server_initialization_options(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<Option<zed::serde_json::Value>> {
        Ok(LspSettings::for_worktree(language_server_id.as_ref(), worktree)?.initialization_options)
    }

    fn language_server_workspace_configuration(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> Result<Option<zed::serde_json::Value>> {
        Ok(LspSettings::for_worktree(language_server_id.as_ref(), worktree)?.settings)
    }
}

zed::register_extension!(AbstractExtension);
