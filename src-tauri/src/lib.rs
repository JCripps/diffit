use tauri::{
    menu::{Menu, MenuItemBuilder, SubmenuBuilder},
    Emitter, Manager,
};

#[tauri::command]
fn update_zoom_label(app: tauri::AppHandle, percentage: u32) {
    if let Some(menu) = app.menu() {
        if let Some(item) = menu.get("zoom_level") {
            if let Some(menu_item) = item.as_menuitem() {
                let _ = menu_item.set_text(format!("{}%", percentage));
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Create zoom level display (disabled, non-interactive)
            let zoom_level = MenuItemBuilder::with_id("zoom_level", "100%")
                .enabled(false)
                .build(app)?;

            // Create Zoom submenu items
            let zoom_in = MenuItemBuilder::with_id("zoom_in", "Zoom In")
                .accelerator("CmdOrCtrl+=")
                .build(app)?;
            let zoom_out = MenuItemBuilder::with_id("zoom_out", "Zoom Out")
                .accelerator("CmdOrCtrl+-")
                .build(app)?;
            let actual_size = MenuItemBuilder::with_id("actual_size", "Actual Size")
                .accelerator("CmdOrCtrl+0")
                .build(app)?;

            // Create Zoom submenu
            let zoom_submenu = SubmenuBuilder::new(app, "Zoom")
                .item(&zoom_level)
                .separator()
                .item(&zoom_in)
                .item(&zoom_out)
                .separator()
                .item(&actual_size)
                .build()?;

            // Create View menu
            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&zoom_submenu)
                .build()?;

            // Build the menu with default items + View menu
            let menu = Menu::with_items(
                app,
                &[
                    &SubmenuBuilder::new(app, "diff-it")
                        .about(None)
                        .separator()
                        .services()
                        .separator()
                        .hide()
                        .hide_others()
                        .show_all()
                        .separator()
                        .quit()
                        .build()?,
                    &SubmenuBuilder::new(app, "File")
                        .close_window()
                        .build()?,
                    &SubmenuBuilder::new(app, "Edit")
                        .undo()
                        .redo()
                        .separator()
                        .cut()
                        .copy()
                        .paste()
                        .select_all()
                        .build()?,
                    &view_menu,
                    &SubmenuBuilder::new(app, "Window")
                        .minimize()
                        .maximize()
                        .separator()
                        .fullscreen()
                        .build()?,
                ],
            )?;

            app.set_menu(menu)?;

            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            if let Some(window) = app.get_webview_window("main") {
                match id {
                    "zoom_in" => {
                        let _ = window.emit("menu-zoom", "in");
                    }
                    "zoom_out" => {
                        let _ = window.emit("menu-zoom", "out");
                    }
                    "actual_size" => {
                        let _ = window.emit("menu-zoom", "reset");
                    }
                    _ => {}
                }
            }
        })
        .invoke_handler(tauri::generate_handler![update_zoom_label])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
