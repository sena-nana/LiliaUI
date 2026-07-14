const COMMANDS: &[&str] = &["set_window_backdrop"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
