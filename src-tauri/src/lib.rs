use rfd::FileDialog;
use std::fs;
use std::process::Command;
use tempfile::NamedTempFile;

#[tauri::command]
fn process_ticket_pdf(input_bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    // 1. Create temporary input file
    let input_tmp = NamedTempFile::new().map_err(|e| e.to_string())?;
    fs::write(input_tmp.path(), input_bytes).map_err(|e| e.to_string())?;

    // 2. Create temporary output file
    let output_tmp = NamedTempFile::new().map_err(|e| e.to_string())?;

    // 3. Resolve absolute path to the python script safely
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let script_path = std::path::Path::new(manifest_dir).join("binaries/process_pdf.py");

    // 4. Run Python script sidecar using absolute path
    let status = Command::new("python")
        .arg(script_path)
        .arg(input_tmp.path().to_str().unwrap())
        .arg(output_tmp.path().to_str().unwrap())
        .status()
        .map_err(|e| format!("Failed to execute python process: {}", e))?;

    if !status.success() {
        return Err("Python script failed to process the PDF".into());
    }

    // 5. Read processed bytes
    let output_bytes = fs::read(output_tmp.path()).map_err(|e| e.to_string())?;
    Ok(output_bytes)
}
#[tauri::command]
fn save_pdf_file(default_name: String, file_bytes: Vec<u8>) -> Result<bool, String> {
    if let Some(path) = FileDialog::new()
        .set_file_name(&default_name)
        .add_filter("PDF Document", &["pdf"])
        .save_file()
    {
        fs::write(path, file_bytes).map_err(|e| e.to_string())?;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![process_ticket_pdf, save_pdf_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
