use serde::{Deserialize, Serialize};
use tauri::{
    plugin::{Builder as PluginBuilder, TauriPlugin},
    utils::config::Color,
    AppHandle, Manager, PhysicalPosition, PhysicalSize, RunEvent, Runtime, WebviewWindow,
    WindowEvent,
};
use tauri_plugin_store::StoreExt;

const PLUGIN_NAME: &str = "lilia";
const DEFAULT_MAIN_WINDOW_LABEL: &str = "main";
const DEFAULT_WINDOW_STATE_STORE_FILE: &str = "main-window-state.json";
const DEFAULT_WINDOW_STATE_KEY: &str = "mainWindow";
const DEFAULT_MIN_MAIN_WINDOW_WIDTH: u32 = 960;
const DEFAULT_MIN_MAIN_WINDOW_HEIGHT: u32 = 600;
const DEFAULT_BACKGROUND_COLOR: Color = Color(0x18, 0x18, 0x18, 0xFF);

#[cfg(target_os = "macos")]
const WINDOW_CHROME_INIT_SCRIPT: &str = r#"
window.__LILIA_WINDOW_CHROME__ = Object.freeze({
  controls: "native-leading",
  leadingInset: 78,
  trailingInset: 0
});
"#;

#[cfg(not(target_os = "macos"))]
const WINDOW_CHROME_INIT_SCRIPT: &str = r#"
window.__LILIA_WINDOW_CHROME__ = Object.freeze({
  controls: "custom",
  leadingInset: 0,
  trailingInset: 0
});
"#;

#[derive(Debug, Clone)]
pub struct Builder {
    main_window_label: String,
    background_color: Option<Color>,
    window_state: WindowStateOptions,
}

impl Default for Builder {
    fn default() -> Self {
        Self {
            main_window_label: DEFAULT_MAIN_WINDOW_LABEL.to_string(),
            background_color: Some(DEFAULT_BACKGROUND_COLOR),
            window_state: WindowStateOptions::default(),
        }
    }
}

impl Builder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn main_window_label(mut self, label: impl Into<String>) -> Self {
        self.main_window_label = label.into();
        self
    }

    pub fn background_color(mut self, color: Option<Color>) -> Self {
        self.background_color = color;
        self
    }

    pub fn window_state(mut self, options: WindowStateOptions) -> Self {
        self.window_state = options;
        self
    }

    pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
        let setup_options = self.clone();
        let event_options = self;

        PluginBuilder::new(PLUGIN_NAME)
            .js_init_script(WINDOW_CHROME_INIT_SCRIPT)
            .setup(move |app, _api| {
                configure_main_window(app, &setup_options);
                Ok(())
            })
            .on_event(move |app, event| match event {
                RunEvent::Ready => present_main_window(app, &event_options),
                RunEvent::WindowEvent { label, event, .. }
                    if label == &event_options.main_window_label
                        && matches!(
                            event,
                            WindowEvent::CloseRequested { .. } | WindowEvent::Destroyed
                        ) =>
                {
                    persist_main_window_state(app, &event_options);
                }
                _ => {}
            })
            .build()
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new().build()
}

#[derive(Debug, Clone)]
pub struct WindowStateOptions {
    pub enabled: bool,
    pub store_file: String,
    pub key: String,
    pub min_width: u32,
    pub min_height: u32,
}

impl Default for WindowStateOptions {
    fn default() -> Self {
        Self {
            enabled: true,
            store_file: DEFAULT_WINDOW_STATE_STORE_FILE.to_string(),
            key: DEFAULT_WINDOW_STATE_KEY.to_string(),
            min_width: DEFAULT_MIN_MAIN_WINDOW_WIDTH,
            min_height: DEFAULT_MIN_MAIN_WINDOW_HEIGHT,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MainWindowState {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MainWindowSnapshot {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
}

impl MainWindowSnapshot {
    fn into_state(self) -> MainWindowState {
        MainWindowState {
            x: self.x,
            y: self.y,
            width: self.width,
            height: self.height,
            maximized: self.maximized,
        }
    }
}

pub fn is_restorable_main_window_state(
    state: &MainWindowState,
    options: &WindowStateOptions,
) -> bool {
    state.width >= options.min_width && state.height >= options.min_height
}

pub fn merge_main_window_state(
    previous: Option<MainWindowState>,
    snapshot: MainWindowSnapshot,
    options: &WindowStateOptions,
) -> MainWindowState {
    if snapshot.maximized {
        if let Some(previous) =
            previous.filter(|state| is_restorable_main_window_state(state, options))
        {
            return MainWindowState {
                maximized: true,
                ..previous
            };
        }
    }
    snapshot.into_state()
}

pub fn load_main_window_state<R: Runtime>(
    app: &AppHandle<R>,
    options: &WindowStateOptions,
) -> Option<MainWindowState> {
    if !options.enabled {
        return None;
    }
    let store = app.store(options.store_file.as_str()).ok()?;
    let value = store.get(&options.key)?;
    serde_json::from_value::<MainWindowState>(value)
        .ok()
        .filter(|state| is_restorable_main_window_state(state, options))
}

pub fn save_main_window_state<R: Runtime>(
    app: &AppHandle<R>,
    snapshot: MainWindowSnapshot,
    options: &WindowStateOptions,
) -> Result<(), String> {
    if !options.enabled {
        return Ok(());
    }
    let store = app
        .store(options.store_file.as_str())
        .map_err(|error| format!("failed to open window state store: {error}"))?;
    let previous = store
        .get(&options.key)
        .and_then(|value| serde_json::from_value::<MainWindowState>(value).ok());
    let state = merge_main_window_state(previous, snapshot, options);
    let value = serde_json::to_value(state).map_err(|error| error.to_string())?;
    store.set(options.key.clone(), value);
    store
        .save()
        .map_err(|error| format!("failed to save window state: {error}"))
}

pub fn capture_main_window_snapshot<R: Runtime>(
    window: &WebviewWindow<R>,
) -> Option<MainWindowSnapshot> {
    let position = window.outer_position().ok()?;
    let size = window.inner_size().ok()?;
    let maximized = window.is_maximized().unwrap_or(false);
    Some(MainWindowSnapshot {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        maximized,
    })
}

pub fn restore_main_window_state<R: Runtime>(window: &WebviewWindow<R>, state: MainWindowState) {
    let _ = window.set_position(PhysicalPosition::new(state.x, state.y));
    let _ = window.set_size(PhysicalSize::new(state.width, state.height));
    if state.maximized {
        let _ = window.maximize();
    }
}

fn configure_main_window<R: Runtime>(app: &AppHandle<R>, options: &Builder) {
    if let Some(window) = app.get_webview_window(&options.main_window_label) {
        if let Some(color) = options.background_color {
            let _ = window.set_background_color(Some(color));
        }
        if let Some(state) = load_main_window_state(app, &options.window_state) {
            restore_main_window_state(&window, state);
        }
    }
}

fn present_main_window<R: Runtime>(app: &AppHandle<R>, options: &Builder) {
    if let Some(window) = app.get_webview_window(&options.main_window_label) {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn persist_main_window_state<R: Runtime>(app: &AppHandle<R>, options: &Builder) {
    let Some(window) = app.get_webview_window(&options.main_window_label) else {
        return;
    };
    let Some(snapshot) = capture_main_window_snapshot(&window) else {
        return;
    };
    if let Err(error) = save_main_window_state(app, snapshot, &options.window_state) {
        eprintln!("[lilia-window-state] {error}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maximized_snapshot_keeps_last_normal_geometry() {
        let options = WindowStateOptions::default();
        let previous = MainWindowState {
            x: 120,
            y: 80,
            width: 1180,
            height: 760,
            maximized: false,
        };
        let maximized_snapshot = MainWindowSnapshot {
            x: -8,
            y: -8,
            width: 1936,
            height: 1056,
            maximized: true,
        };

        let merged = merge_main_window_state(Some(previous), maximized_snapshot, &options);

        assert_eq!(
            merged,
            MainWindowState {
                maximized: true,
                ..previous
            }
        );
    }

    #[test]
    fn maximized_snapshot_uses_snapshot_when_previous_geometry_is_too_small() {
        let options = WindowStateOptions::default();
        let previous = MainWindowState {
            x: 120,
            y: 80,
            width: 640,
            height: 480,
            maximized: false,
        };
        let maximized_snapshot = MainWindowSnapshot {
            x: -8,
            y: -8,
            width: 1936,
            height: 1056,
            maximized: true,
        };

        let merged = merge_main_window_state(Some(previous), maximized_snapshot, &options);

        assert_eq!(merged, maximized_snapshot.into_state());
    }

    #[test]
    fn restorable_size_threshold_is_configurable() {
        let options = WindowStateOptions {
            min_width: 320,
            min_height: 240,
            ..WindowStateOptions::default()
        };
        let state = MainWindowState {
            x: 0,
            y: 0,
            width: 480,
            height: 320,
            maximized: false,
        };

        assert!(is_restorable_main_window_state(&state, &options));
    }
}
