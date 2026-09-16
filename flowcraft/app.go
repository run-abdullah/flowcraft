package main

import (
	"context"
	_ "embed"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.design/x/clipboard"
)

// Embedded Python process script inside compiled Wails binary
//
//go:embed binaries/process_pdf.py
var pythonScript []byte

type FileMeta struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Path string `json:"path"`
}

type App struct {
	ctx              context.Context
	processedStorage map[string][]byte
	storageMutex     sync.RWMutex
}

func NewApp() *App {
	return &App{
		processedStorage: make(map[string][]byte),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("=== [FlowCraft Engine Initialized] Native Handlers & Storage Ready ===")

	// Native Go Clipboard Engine Init
	err := clipboard.Init()
	if err != nil {
		log.Printf("[WARNING] Go Clipboard Native Engine Init failed: %v\n", err)
	}
}

// OpenFilePicker opens native system dialog to select PDF files manually
func (a *App) OpenFilePicker() ([]FileMeta, error) {
	files, err := wailsRuntime.OpenMultipleFilesDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Select Ticket PDFs",
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "PDF Documents (*.pdf)",
				Pattern:     "*.pdf",
			},
		},
	})

	if err != nil {
		log.Printf("[ERROR] OpenFileDialog failed: %v\n", err)
		return nil, err
	}

	var results []FileMeta
	for _, filePath := range files {
		results = append(results, FileMeta{
			ID:   filepath.Base(filePath) + "_" + fmt.Sprintf("%d", len(filePath)),
			Name: filepath.Base(filePath),
			Path: filePath,
		})
	}

	return results, nil
}

// ProcessPDFFromPath executes PDF processing natively on Windows & Linux
func (a *App) ProcessPDFFromPath(id string, filePath string) (bool, error) {
	fileName := filepath.Base(filePath)
	log.Printf("[ProcessPDFFromPath] File: %s | OS Target: %s\n", fileName, runtime.GOOS)

	inputBytes, err := os.ReadFile(filePath)
	if err != nil {
		return false, err
	}

	tempDir, err := os.MkdirTemp("", "flowcraft_*")
	if err != nil {
		return false, err
	}
	defer os.RemoveAll(tempDir)

	inputPath := filepath.Join(tempDir, "input.pdf")
	if err := os.WriteFile(inputPath, inputBytes, 0644); err != nil {
		return false, err
	}

	outputPath := filepath.Join(tempDir, "output.pdf")
	var cmd *exec.Cmd

	if runtime.GOOS == "windows" {
		// Windows: GitHub Actions se compile shuda engine binaries/process_pdf.exe run hoga
		exePath := filepath.Join("binaries", "process_pdf.exe")

		// Fallback check agar path relative check karna ho
		if _, err := os.Stat(exePath); os.IsNotExist(err) {
			// Temp unpack execute fallback
			exePath = filepath.Join(tempDir, "process_pdf.exe")
			if len(pythonScript) > 0 {
				os.WriteFile(exePath, pythonScript, 0755)
			}
		}

		cmd = exec.Command(exePath, inputPath, outputPath)
	} else {
		// Linux Local Dev Target
		scriptPath := filepath.Join(tempDir, "process_pdf.py")
		if err := os.WriteFile(scriptPath, pythonScript, 0644); err != nil {
			return false, err
		}
		cmd = exec.Command("python3", scriptPath, inputPath, outputPath)
	}

	outputLog, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("[ENGINE ERROR]: %s\n", string(outputLog))
		return false, fmt.Errorf("pdf engine execution failed: %s", string(outputLog))
	}

	processedBytes, err := os.ReadFile(outputPath)
	if err != nil {
		return false, err
	}

	a.storageMutex.Lock()
	a.processedStorage[id] = processedBytes
	a.storageMutex.Unlock()

	return true, nil
}

// CopyPDFToClipboard sets the target file as a real native OS File Object
func (a *App) CopyPDFToClipboard(id string, fileName string) (bool, error) {
	a.storageMutex.RLock()
	bytesToCopy, exists := a.processedStorage[id]
	a.storageMutex.RUnlock()

	if !exists || len(bytesToCopy) == 0 {
		log.Printf("[ERROR] No cached bytes found for ID: %s\n", id)
		return false, fmt.Errorf("cached bytes not found")
	}

	// FIX 1: /tmp ki jagah ~/.cache/flowcraft use karo
	// File managers /tmp se clipboard files ko ignore karte hain
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return false, fmt.Errorf("cannot resolve home dir: %w", err)
	}
	cacheDir := filepath.Join(homeDir, ".cache", "flowcraft")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return false, fmt.Errorf("cannot create cache dir: %w", err)
	}

	// FIX 2: filename sanitize karo (spaces, special chars issue karte hain URI mein)
	safeName := sanitizeFileName(fileName)
	targetPath := filepath.Join(cacheDir, safeName)

	if err := os.WriteFile(targetPath, bytesToCopy, 0644); err != nil {
		log.Printf("[ERROR] Writing file for clipboard failed: %v\n", err)
		return false, err
	}

	log.Printf("[CopyPDFToClipboard] Registering Native File Object: %s\n", targetPath)

	fileURI := "file://" + targetPath
	// GNOME/Nautilus format: "copy\n<uri>" (with x-special/gnome-copied-files)
	gnomePayload := "copy\n" + fileURI

	// Strategy: try multiple clipboard mechanisms in order
	// 1. wl-copy with gnome-copied-files (Wayland + GNOME/Nautilus)
	// 2. wl-copy with text/uri-list (Wayland + KDE/XFCE)
	// 3. xclip with gnome-copied-files (X11 + GNOME)
	// 4. xclip with text/uri-list (X11 fallback)
	// 5. wails text fallback

	type clipAttempt struct {
		name string
		cmd  *exec.Cmd
	}

	attempts := []clipAttempt{
		{
			name: "wl-copy gnome-copied-files",
			cmd: exec.Command("wl-copy",
				"--type", "x-special/gnome-copied-files",
				gnomePayload),
		},
		{
			name: "wl-copy uri-list",
			cmd:  exec.Command("wl-copy", "--type", "text/uri-list", fileURI+"\r\n"),
		},
		{
			name: "xclip gnome-copied-files",
			cmd: exec.Command("xclip",
				"-selection", "clipboard",
				"-t", "x-special/gnome-copied-files",
				"-i"),
		},
		{
			name: "xclip uri-list",
			cmd: exec.Command("xclip",
				"-selection", "clipboard",
				"-t", "text/uri-list",
				"-i"),
		},
	}

	// xclip ko stdin se data dena hota hai
	for _, attempt := range attempts {
		var cmd *exec.Cmd
		if attempt.name == "xclip gnome-copied-files" {
			cmd = attempt.cmd
			cmd.Stdin = stringReader(gnomePayload)
		} else if attempt.name == "xclip uri-list" {
			cmd = attempt.cmd
			cmd.Stdin = stringReader(fileURI + "\r\n")
		} else {
			cmd = attempt.cmd
		}

		if err := cmd.Run(); err == nil {
			log.Printf("[SUCCESS] File copied via: %s\n", attempt.name)
			return true, nil
		} else {
			log.Printf("[DEBUG] Clipboard attempt '%s' failed: %v\n", attempt.name, err)
		}
	}

	// Last-resort fallback: Wails text clipboard with file path
	log.Println("[WARN] All native file clipboard methods failed, using text fallback")
	wailsRuntime.ClipboardSetText(a.ctx, targetPath)
	return true, nil
}

// Helper: sanitize filename for URI safety
func sanitizeFileName(name string) string {
	// Replace problematic URI chars with underscore
	replacer := []struct{ old, new string }{
		{" ", "_"},
		{"#", "_"},
		{"?", "_"},
		{"&", "_"},
		{"%", "_"},
	}
	out := name
	for _, r := range replacer {
		out = replaceAll(out, r.old, r.new)
	}
	return out
}

func replaceAll(s, old, new string) string {
	result := ""
	for {
		idx := indexOf(s, old)
		if idx == -1 {
			return result + s
		}
		result += s[:idx] + new
		s = s[idx+len(old):]
	}
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}

func stringReader(s string) *strings.Reader {
	return strings.NewReader(s)
}

// SavePDFFile opens native file save dialog and saves cached PDF directly to disk
func (a *App) SavePDFFile(id string, defaultName string) (bool, error) {
	a.storageMutex.RLock()
	bytesToSave, exists := a.processedStorage[id]
	a.storageMutex.RUnlock()

	if !exists || len(bytesToSave) == 0 {
		log.Printf("[ERROR] No cached bytes found for ID: %s\n", id)
		return false, fmt.Errorf("cached bytes not found")
	}

	log.Printf("[SavePDFFile] Opening native save dialog for ID: %s (%d bytes)\n", id, len(bytesToSave))

	savePath, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		DefaultFilename: defaultName,
		Title:           "Save Processed Ticket PDF",
		Filters: []wailsRuntime.FileFilter{
			{
				DisplayName: "PDF Documents (*.pdf)",
				Pattern:     "*.pdf",
			},
		},
	})

	if err != nil {
		log.Printf("[ERROR] SaveFileDialog failed: %v\n", err)
		return false, err
	}

	if savePath == "" {
		log.Println("[INFO] Save dialog cancelled by user.")
		return false, nil
	}

	err = os.WriteFile(savePath, bytesToSave, 0644)
	if err != nil {
		log.Printf("[ERROR] Writing file to disk failed: %v\n", err)
		return false, fmt.Errorf("failed writing file to disk: %w", err)
	}

	log.Printf("[SUCCESS] File saved directly by Go backend to path: %s\n", savePath)
	return true, nil
}
