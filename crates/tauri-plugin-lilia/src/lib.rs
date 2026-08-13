use serde::{Deserialize, Serialize};
use std::marker::PhantomData;
use std::sync::Mutex;
#[cfg(desktop)]
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
#[cfg(target_os = "macos")]
use tauri::window::EffectState;
#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuBuilder, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
};
use tauri::{
    plugin::{Builder as PluginBuilder, TauriPlugin},
    utils::config::Color,
    window::{Effect, EffectsBuilder},
    AppHandle, Manager, PhysicalPosition, PhysicalSize, RunEvent, Runtime, State, WebviewWindow,
    WindowEvent,
};
use tauri_plugin_store::StoreExt;

const PLUGIN_NAME: &str = "lilia";
const DEFAULT_MAIN_WINDOW_LABEL: &str = "main";
const DEFAULT_WINDOW_STATE_STORE_FILE: &str = "main-window-state.json";
const DEFAULT_WINDOW_STATE_KEY: &str = "mainWindow";
const DEFAULT_MIN_MAIN_WINDOW_WIDTH: u32 = 960;
const DEFAULT_MIN_MAIN_WINDOW_HEIGHT: u32 = 600;
#[cfg(desktop)]
const DEFAULT_TRAY_ID: &str = "main";
#[cfg(desktop)]
const TRAY_SHOW_MENU_ID: &str = "lilia.tray.show-window";
#[cfg(desktop)]
const TRAY_QUIT_MENU_ID: &str = "lilia.tray.quit";

#[cfg(target_os = "macos")]
const WINDOW_CHROME_INIT_SCRIPT: &str = r#"
window.__LILIA_NATIVE_PLATFORM__ = "macos";
window.__LILIA_WINDOW_CHROME__ = Object.freeze({
  controls: "native-leading",
  leadingInset: 78,
  trailingInset: 0
});
"#;

#[cfg(target_os = "windows")]
const WINDOW_CHROME_INIT_SCRIPT: &str = r#"
window.__LILIA_NATIVE_PLATFORM__ = "windows";
window.__LILIA_WINDOW_CHROME__ = Object.freeze({
  controls: "custom",
  leadingInset: 0,
  trailingInset: 0
});
"#;

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
const WINDOW_CHROME_INIT_SCRIPT: &str = r#"
window.__LILIA_NATIVE_PLATFORM__ = "linux";
window.__LILIA_WINDOW_CHROME__ = Object.freeze({
  controls: "custom",
  leadingInset: 0,
  trailingInset: 0
});
"#;

#[cfg(desktop)]
type TrayExtraMenuProvider<R> = Arc<dyn Fn(&AppHandle<R>) -> Vec<TrayMenuNode> + Send + Sync>;
#[cfg(desktop)]
type TrayExtraMenuHandler<R> = Arc<dyn Fn(&AppHandle<R>, &str) + Send + Sync>;

pub struct Builder<R: Runtime = tauri::Wry> {
    main_window_label: String,
    background_color: Option<Color>,
    window_state: WindowStateOptions,
    #[cfg(desktop)]
    tray: Option<TrayOptions>,
    #[cfg(desktop)]
    tray_extra_menu: Option<TrayExtraMenuProvider<R>>,
    #[cfg(desktop)]
    tray_extra_handler: Option<TrayExtraMenuHandler<R>>,
    _runtime: PhantomData<fn() -> R>,
}

impl<R: Runtime> Default for Builder<R> {
    fn default() -> Self {
        Self {
            main_window_label: DEFAULT_MAIN_WINDOW_LABEL.to_string(),
            background_color: None,
            window_state: WindowStateOptions::default(),
            #[cfg(desktop)]
            tray: None,
            #[cfg(desktop)]
            tray_extra_menu: None,
            #[cfg(desktop)]
            tray_extra_handler: None,
            _runtime: PhantomData,
        }
    }
}

impl<R: Runtime> Builder<R> {
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

    #[cfg(desktop)]
    pub fn tray(mut self, options: TrayOptions) -> Self {
        self.tray = Some(options);
        self
    }

    #[cfg(desktop)]
    pub fn tray_extra_menu<F>(mut self, provider: F) -> Self
    where
        F: Fn(&AppHandle<R>) -> Vec<TrayMenuNode> + Send + Sync + 'static,
    {
        self.tray_extra_menu = Some(Arc::new(provider));
        self
    }

    #[cfg(desktop)]
    pub fn on_tray_extra_menu<F>(mut self, handler: F) -> Self
    where
        F: Fn(&AppHandle<R>, &str) + Send + Sync + 'static,
    {
        self.tray_extra_handler = Some(Arc::new(handler));
        self
    }

    pub fn build(self) -> TauriPlugin<R> {
        #[cfg(desktop)]
        let tray_options = self.tray.clone();
        #[cfg(desktop)]
        let tray_extra_menu = self.tray_extra_menu.clone();
        #[cfg(desktop)]
        let tray_extra_handler = self.tray_extra_handler.clone();
        #[cfg(desktop)]
        let main_window_label_for_setup = self.main_window_label.clone();
        let event_options = self;

        PluginBuilder::new(PLUGIN_NAME)
            .js_init_script(WINDOW_CHROME_INIT_SCRIPT)
            .invoke_handler(tauri::generate_handler![set_window_backdrop])
            .setup(move |app, _api| {
                app.manage(BackdropRuntimeState::default());
                #[cfg(desktop)]
                if let Some(options) = tray_options.as_ref() {
                    setup_tray(
                        app,
                        options,
                        &main_window_label_for_setup,
                        tray_extra_menu.clone(),
                        tray_extra_handler.clone(),
                    )?;
                }
                Ok(())
            })
            .on_event(move |app, event| match event {
                RunEvent::Ready => {
                    configure_main_window(app, &event_options);
                    #[cfg(desktop)]
                    if let Some(options) = event_options.tray.as_ref() {
                        install_tray_window_behavior(
                            app,
                            &event_options.main_window_label,
                            options.close_behavior,
                        );
                    }
                    present_main_window(app, &event_options);
                }
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
    Builder::<R>::new().build()
}

#[cfg(desktop)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayCloseBehavior {
    Hide,
    Exit,
}

#[cfg(desktop)]
impl Default for TrayCloseBehavior {
    fn default() -> Self {
        Self::Hide
    }
}

#[cfg(desktop)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayLeftClickBehavior {
    ToggleWindow,
    ShowMenu,
}

#[cfg(desktop)]
impl Default for TrayLeftClickBehavior {
    fn default() -> Self {
        Self::ToggleWindow
    }
}

#[cfg(desktop)]
#[derive(Debug, Clone)]
pub struct TrayOptions {
    tray_id: String,
    show_window_label: String,
    quit_label: String,
    close_behavior: TrayCloseBehavior,
    left_click_behavior: TrayLeftClickBehavior,
}

#[cfg(desktop)]
impl Default for TrayOptions {
    fn default() -> Self {
        Self {
            tray_id: DEFAULT_TRAY_ID.to_string(),
            show_window_label: "Show Window".to_string(),
            quit_label: "Quit".to_string(),
            close_behavior: TrayCloseBehavior::default(),
            left_click_behavior: TrayLeftClickBehavior::default(),
        }
    }
}

#[cfg(desktop)]
impl TrayOptions {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn tray_id(mut self, id: impl Into<String>) -> Self {
        self.tray_id = id.into();
        self
    }

    pub fn show_window_label(mut self, label: impl Into<String>) -> Self {
        self.show_window_label = label.into();
        self
    }

    pub fn quit_label(mut self, label: impl Into<String>) -> Self {
        self.quit_label = label.into();
        self
    }

    pub fn close_behavior(mut self, behavior: TrayCloseBehavior) -> Self {
        self.close_behavior = behavior;
        self
    }

    pub fn left_click_behavior(mut self, behavior: TrayLeftClickBehavior) -> Self {
        self.left_click_behavior = behavior;
        self
    }
}

#[cfg(desktop)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TrayMenuNode {
    Separator,
    Item { id: String, label: String },
}

#[cfg(desktop)]
impl TrayMenuNode {
    pub fn item(id: impl Into<String>, label: impl Into<String>) -> Self {
        Self::Item {
            id: id.into(),
            label: label.into(),
        }
    }
}

#[cfg(desktop)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TrayMenuDispatch<'a> {
    ShowWindow,
    Quit,
    Extra(&'a str),
}

#[cfg(desktop)]
fn dispatch_tray_menu_id(id: &str) -> TrayMenuDispatch<'_> {
    match id {
        TRAY_SHOW_MENU_ID => TrayMenuDispatch::ShowWindow,
        TRAY_QUIT_MENU_ID => TrayMenuDispatch::Quit,
        extra => TrayMenuDispatch::Extra(extra),
    }
}

#[cfg(desktop)]
fn compose_tray_menu_nodes(
    show_label: impl Into<String>,
    extras: Vec<TrayMenuNode>,
    quit_label: impl Into<String>,
) -> Vec<TrayMenuNode> {
    let mut nodes = vec![TrayMenuNode::item(TRAY_SHOW_MENU_ID, show_label)];
    if !extras.is_empty() {
        nodes.push(TrayMenuNode::Separator);
        nodes.extend(extras);
    }
    nodes.push(TrayMenuNode::Separator);
    nodes.push(TrayMenuNode::item(TRAY_QUIT_MENU_ID, quit_label));
    nodes
}

#[cfg(desktop)]
fn should_hide_on_close(close_behavior: TrayCloseBehavior, explicit_quit: bool) -> bool {
    close_behavior == TrayCloseBehavior::Hide && !explicit_quit
}

#[cfg(desktop)]
fn should_show_on_toggle(is_visible: bool, is_minimized: bool) -> bool {
    !is_visible || is_minimized
}

#[cfg(desktop)]
struct TrayRuntimeState<R: Runtime> {
    allow_close: Arc<AtomicBool>,
    tray_id: String,
    show_window_label: String,
    quit_label: String,
    extra_menu: Option<TrayExtraMenuProvider<R>>,
}

#[cfg(desktop)]
fn setup_tray<R: Runtime>(
    app: &AppHandle<R>,
    options: &TrayOptions,
    main_window_label: &str,
    extra_menu: Option<TrayExtraMenuProvider<R>>,
    extra_handler: Option<TrayExtraMenuHandler<R>>,
) -> Result<(), Box<dyn std::error::Error>> {
    let tray = app.tray_by_id(options.tray_id.as_str()).ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("configured tray icon '{}' was not created", options.tray_id),
        )
    })?;
    let extras = extra_menu
        .as_ref()
        .map(|provider| provider(app))
        .unwrap_or_default();
    let menu = materialize_tray_menu(
        app,
        &compose_tray_menu_nodes(&options.show_window_label, extras, &options.quit_label),
    )?;
    tray.set_menu(Some(menu))?;
    tray.set_show_menu_on_left_click(
        options.left_click_behavior == TrayLeftClickBehavior::ShowMenu,
    )?;

    let allow_close = Arc::new(AtomicBool::new(false));
    app.manage(TrayRuntimeState {
        allow_close: allow_close.clone(),
        tray_id: options.tray_id.clone(),
        show_window_label: options.show_window_label.clone(),
        quit_label: options.quit_label.clone(),
        extra_menu,
    });

    let main_window_label_for_menu = main_window_label.to_string();
    let allow_close_for_menu = allow_close;
    app.on_menu_event(
        move |app, event| match dispatch_tray_menu_id(event.id().as_ref()) {
            TrayMenuDispatch::ShowWindow => show_main_window(app, &main_window_label_for_menu),
            TrayMenuDispatch::Quit => {
                request_quit(app, &main_window_label_for_menu, &allow_close_for_menu)
            }
            TrayMenuDispatch::Extra(id) => {
                if let Some(handler) = extra_handler.as_ref() {
                    handler(app, id);
                }
            }
        },
    );

    let tray_id = tray.id().clone();
    let main_window_label_for_click = main_window_label.to_string();
    let toggle_on_left_click = options.left_click_behavior == TrayLeftClickBehavior::ToggleWindow;
    app.on_tray_icon_event(move |app, event| {
        if event.id() != &tray_id {
            return;
        }
        match event {
            TrayIconEvent::Click {
                button: MouseButton::Right,
                button_state: MouseButtonState::Down,
                ..
            } => {
                let _ = refresh_tray_menu(app);
            }
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } if toggle_on_left_click => {
                toggle_main_window(app, &main_window_label_for_click);
            }
            _ => {}
        }
    });

    Ok(())
}

#[cfg(desktop)]
fn refresh_tray_menu<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let Some(state) = app.try_state::<TrayRuntimeState<R>>() else {
        return Ok(());
    };
    let extras = state
        .extra_menu
        .as_ref()
        .map(|provider| provider(app))
        .unwrap_or_default();
    let menu = materialize_tray_menu(
        app,
        &compose_tray_menu_nodes(&state.show_window_label, extras, &state.quit_label),
    )
    .map_err(|error| error.to_string())?;
    let tray = app
        .tray_by_id(state.tray_id.as_str())
        .ok_or_else(|| format!("configured tray icon '{}' was not created", state.tray_id))?;
    tray.set_menu(Some(menu))
        .map_err(|error| format!("failed to refresh tray menu: {error}"))
}

#[cfg(desktop)]
fn materialize_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    nodes: &[TrayMenuNode],
) -> tauri::Result<Menu<R>> {
    let mut builder = MenuBuilder::new(app);
    for node in nodes {
        builder = match node {
            TrayMenuNode::Separator => builder.separator(),
            TrayMenuNode::Item { id, label } => {
                builder.item(&MenuItem::with_id(app, id, label, true, None::<&str>)?)
            }
        };
    }
    builder.build()
}

#[cfg(desktop)]
fn install_tray_window_behavior<R: Runtime>(
    app: &AppHandle<R>,
    main_window_label: &str,
    close_behavior: TrayCloseBehavior,
) {
    let Some(window) = app.get_webview_window(main_window_label) else {
        return;
    };
    let state = app.state::<TrayRuntimeState<R>>();
    let allow_close = state.allow_close.clone();
    let window_for_handler = window.clone();
    window.on_window_event(move |event| {
        let WindowEvent::CloseRequested { api, .. } = event else {
            return;
        };
        let explicit_quit = allow_close.swap(false, Ordering::AcqRel);
        if should_hide_on_close(close_behavior, explicit_quit) {
            api.prevent_close();
            let _ = window_for_handler.hide();
        }
    });
}

#[cfg(desktop)]
fn show_main_window<R: Runtime>(app: &AppHandle<R>, main_window_label: &str) {
    let Some(window) = app.get_webview_window(main_window_label) else {
        return;
    };
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg(desktop)]
fn toggle_main_window<R: Runtime>(app: &AppHandle<R>, main_window_label: &str) {
    let Some(window) = app.get_webview_window(main_window_label) else {
        return;
    };
    let is_visible = window.is_visible().unwrap_or(false);
    let is_minimized = window.is_minimized().unwrap_or(false);
    if should_show_on_toggle(is_visible, is_minimized) {
        show_main_window(app, main_window_label);
    } else {
        let _ = window.hide();
    }
}

#[cfg(desktop)]
fn request_quit<R: Runtime>(app: &AppHandle<R>, main_window_label: &str, allow_close: &AtomicBool) {
    let Some(window) = app.get_webview_window(main_window_label) else {
        app.exit(0);
        return;
    };
    allow_close.store(true, Ordering::Release);
    if window.close().is_err() {
        allow_close.store(false, Ordering::Release);
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum BackdropMode {
    System,
    Mica,
    Acrylic,
    Solid,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[cfg_attr(not(test), allow(dead_code))]
enum NativePlatform {
    Macos,
    Windows,
    Linux,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum BackdropAction {
    Set(Option<Effect>),
    Keep,
}

#[derive(Debug, Default)]
struct BackdropRuntimeState {
    effect: Mutex<Option<Effect>>,
}

const fn current_native_platform() -> NativePlatform {
    #[cfg(target_os = "macos")]
    {
        NativePlatform::Macos
    }

    #[cfg(target_os = "windows")]
    {
        NativePlatform::Windows
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        NativePlatform::Linux
    }
}

const fn default_backdrop_action(platform: NativePlatform) -> BackdropAction {
    match platform {
        NativePlatform::Macos => BackdropAction::Set(Some(Effect::Sidebar)),
        NativePlatform::Windows => BackdropAction::Set(Some(Effect::MicaDark)),
        NativePlatform::Linux => BackdropAction::Keep,
    }
}

const fn backdrop_action(
    platform: NativePlatform,
    mode: BackdropMode,
    dark: bool,
) -> BackdropAction {
    match platform {
        NativePlatform::Macos => match mode {
            BackdropMode::Solid => BackdropAction::Keep,
            BackdropMode::System | BackdropMode::Mica | BackdropMode::Acrylic => {
                BackdropAction::Set(Some(Effect::Sidebar))
            }
        },
        NativePlatform::Windows => match mode {
            BackdropMode::System | BackdropMode::Mica => {
                if dark {
                    BackdropAction::Set(Some(Effect::MicaDark))
                } else {
                    BackdropAction::Set(Some(Effect::MicaLight))
                }
            }
            BackdropMode::Acrylic => BackdropAction::Set(Some(Effect::Acrylic)),
            BackdropMode::Solid => BackdropAction::Set(None),
        },
        NativePlatform::Linux => BackdropAction::Keep,
    }
}

fn apply_backdrop_effect<R: Runtime>(
    window: &WebviewWindow<R>,
    effect: Option<Effect>,
) -> tauri::Result<()> {
    #[cfg(target_os = "windows")]
    window.set_effects(None)?;

    let Some(effect) = effect else {
        #[cfg(not(target_os = "windows"))]
        window.set_effects(None)?;
        return Ok(());
    };

    let effects = EffectsBuilder::new().effect(effect);
    #[cfg(target_os = "macos")]
    let effects = effects.state(EffectState::FollowsWindowActiveState);
    window.set_effects(effects.build())?;

    Ok(())
}

fn apply_backdrop_action_if_needed<R: Runtime>(
    window: &WebviewWindow<R>,
    state: &BackdropRuntimeState,
    action: BackdropAction,
) -> Result<(), String> {
    let BackdropAction::Set(effect) = action else {
        return Ok(());
    };
    let mut current_effect = state
        .effect
        .lock()
        .map_err(|error| format!("failed to read backdrop state: {error}"))?;

    if *current_effect == effect {
        return Ok(());
    }

    apply_backdrop_effect(window, effect).map_err(|error| error.to_string())?;
    *current_effect = effect;

    Ok(())
}

#[tauri::command]
fn set_window_backdrop<R: Runtime>(
    window: WebviewWindow<R>,
    state: State<'_, BackdropRuntimeState>,
    mode: BackdropMode,
    dark: bool,
) -> Result<(), String> {
    apply_backdrop_action_if_needed(
        &window,
        &state,
        backdrop_action(current_native_platform(), mode, dark),
    )
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

fn configure_main_window<R: Runtime>(app: &AppHandle<R>, options: &Builder<R>) {
    if let Some(window) = app.get_webview_window(&options.main_window_label) {
        if let Some(color) = options.background_color {
            let _ = window.set_background_color(Some(color));
        }
        let state = app.state::<BackdropRuntimeState>();
        let _ = apply_backdrop_action_if_needed(
            &window,
            &state,
            default_backdrop_action(current_native_platform()),
        );
        if let Some(state) = load_main_window_state(app, &options.window_state) {
            restore_main_window_state(&window, state);
        }
    }
}

fn present_main_window<R: Runtime>(app: &AppHandle<R>, options: &Builder<R>) {
    if let Some(window) = app.get_webview_window(&options.main_window_label) {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn persist_main_window_state<R: Runtime>(app: &AppHandle<R>, options: &Builder<R>) {
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

    #[cfg(desktop)]
    #[test]
    fn tray_close_hides_window_until_explicit_quit() {
        assert!(should_hide_on_close(TrayCloseBehavior::Hide, false));
        assert!(!should_hide_on_close(TrayCloseBehavior::Hide, true));
    }

    #[cfg(desktop)]
    #[test]
    fn tray_exit_behavior_allows_a_regular_window_close() {
        assert!(!should_hide_on_close(TrayCloseBehavior::Exit, false));
    }

    #[cfg(desktop)]
    #[test]
    fn tray_toggle_shows_hidden_or_minimized_windows() {
        assert!(should_show_on_toggle(false, false));
        assert!(should_show_on_toggle(true, true));
        assert!(!should_show_on_toggle(true, false));
    }

    #[cfg(desktop)]
    #[test]
    fn tray_menu_without_extras_keeps_show_and_quit() {
        assert_eq!(
            compose_tray_menu_nodes("显示主窗口", Vec::new(), "退出"),
            vec![
                TrayMenuNode::item("lilia.tray.show-window", "显示主窗口"),
                TrayMenuNode::Separator,
                TrayMenuNode::item("lilia.tray.quit", "退出"),
            ]
        );
    }

    #[cfg(desktop)]
    #[test]
    fn tray_menu_inserts_extras_between_show_and_quit() {
        let extras = vec![
            TrayMenuNode::item("app.stop.repo-a", "停止 Demo · yarn dev"),
            TrayMenuNode::Separator,
            TrayMenuNode::item("app.start.repo-b", "运行 Other · cargo run"),
        ];
        assert_eq!(
            compose_tray_menu_nodes("显示主窗口", extras, "退出"),
            vec![
                TrayMenuNode::item("lilia.tray.show-window", "显示主窗口"),
                TrayMenuNode::Separator,
                TrayMenuNode::item("app.stop.repo-a", "停止 Demo · yarn dev"),
                TrayMenuNode::Separator,
                TrayMenuNode::item("app.start.repo-b", "运行 Other · cargo run"),
                TrayMenuNode::Separator,
                TrayMenuNode::item("lilia.tray.quit", "退出"),
            ]
        );
    }

    #[cfg(desktop)]
    #[test]
    fn tray_menu_ids_keep_show_and_quit_and_forward_extras() {
        assert_eq!(
            dispatch_tray_menu_id("lilia.tray.show-window"),
            TrayMenuDispatch::ShowWindow
        );
        assert_eq!(
            dispatch_tray_menu_id("lilia.tray.quit"),
            TrayMenuDispatch::Quit
        );
        assert_eq!(
            dispatch_tray_menu_id("app.stop.repo-a"),
            TrayMenuDispatch::Extra("app.stop.repo-a")
        );
    }

    #[test]
    fn backdrop_mode_uses_camel_case_wire_values() {
        assert_eq!(
            serde_json::to_string(&BackdropMode::System).unwrap(),
            "\"system\""
        );
        assert_eq!(
            serde_json::to_string(&BackdropMode::Mica).unwrap(),
            "\"mica\""
        );
        assert_eq!(
            serde_json::to_string(&BackdropMode::Acrylic).unwrap(),
            "\"acrylic\""
        );
        assert_eq!(
            serde_json::to_string(&BackdropMode::Solid).unwrap(),
            "\"solid\""
        );
    }

    #[test]
    fn platform_defaults_match_native_materials() {
        assert!(Builder::<tauri::Wry>::default().background_color.is_none());
        assert_eq!(
            default_backdrop_action(NativePlatform::Macos),
            BackdropAction::Set(Some(Effect::Sidebar))
        );
        assert_eq!(
            default_backdrop_action(NativePlatform::Windows),
            BackdropAction::Set(Some(Effect::MicaDark))
        );
        assert_eq!(
            default_backdrop_action(NativePlatform::Linux),
            BackdropAction::Keep
        );
    }

    #[test]
    fn macos_maps_translucent_modes_to_sidebar_without_clearing_solid() {
        for mode in [
            BackdropMode::System,
            BackdropMode::Mica,
            BackdropMode::Acrylic,
        ] {
            assert_eq!(
                backdrop_action(NativePlatform::Macos, mode, false),
                BackdropAction::Set(Some(Effect::Sidebar))
            );
        }
        assert_eq!(
            backdrop_action(NativePlatform::Macos, BackdropMode::Solid, false),
            BackdropAction::Keep
        );
    }

    #[test]
    fn windows_maps_modes_and_theme_to_expected_actions() {
        assert_eq!(
            backdrop_action(NativePlatform::Windows, BackdropMode::System, true),
            BackdropAction::Set(Some(Effect::MicaDark))
        );
        assert_eq!(
            backdrop_action(NativePlatform::Windows, BackdropMode::Mica, false),
            BackdropAction::Set(Some(Effect::MicaLight))
        );
        assert_eq!(
            backdrop_action(NativePlatform::Windows, BackdropMode::Acrylic, true),
            BackdropAction::Set(Some(Effect::Acrylic))
        );
        assert_eq!(
            backdrop_action(NativePlatform::Windows, BackdropMode::Solid, false),
            BackdropAction::Set(None)
        );
    }

    #[test]
    fn linux_backdrop_command_is_always_a_noop() {
        for mode in [
            BackdropMode::System,
            BackdropMode::Mica,
            BackdropMode::Acrylic,
            BackdropMode::Solid,
        ] {
            assert_eq!(
                backdrop_action(NativePlatform::Linux, mode, true),
                BackdropAction::Keep
            );
        }
    }

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
