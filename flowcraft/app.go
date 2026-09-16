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
)

// Embedded Python process script for Linux development environment
//
//go:embed binaries/process_pdf.py
var pythonScript []byte

// Embedded compiled Windows engine (PyInstaller output during build)
// Note: Requires a dummy or actual binaries/process_pdf.exe to exist at compile time
//
//go:embed binaries/process_pdf.exe
var pythonExe []byte

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

// ProcessPDFFromPath executes PDF conversion logic cross-platform
func (a *App) ProcessPDFFromPath(id string, filePath string) (bool, error) {
	fileName := filepath.Base(filePath)
	log.Printf("[ProcessPDFFromPath] Target File: %s | ID: %s | OS: %s\n", fileName, id, runtime.GOOS)

	inputBytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("[ERROR] Failed to read input file from path: %v\n", err)
		return false, fmt.Errorf("failed reading input file: %w", err)
	}

	tempDir, err := os.MkdirTemp("", "flowcraft_pdf_*")
	if err != nil {
		log.Printf("[ERROR] Failed creating temp dir: %v\n", err)
		return false, err
	}
	defer os.RemoveAll(tempDir) // Auto cleanup temp workspace

	inputPath := filepath.Join(tempDir, "input.pdf")
	if err := os.WriteFile(inputPath, inputBytes, 0644); err != nil {
		log.Printf("[ERROR] Failed writing temp input PDF: %v\n", err)
		return false, err
	}

	outputPath := filepath.Join(tempDir, "output.pdf")
	var cmd *exec.Cmd

	if runtime.GOOS == "windows" {
		// Windows: Unpack standalone embedded process_pdf.exe (Zero Python installation required)
		exePath := filepath.Join(tempDir, "process_pdf.exe")
		if len(pythonExe) > 0 {
			if err := os.WriteFile(exePath, pythonExe, 0755); err != nil {
				log.Printf("[ERROR] Failed unpacking Windows engine: %v\n", err)
				return false, fmt.Errorf("failed unpacking Windows engine: %w", err)
			}
		} else {
			return false, fmt.Errorf("embedded Windows Python engine missing")
		}
		cmd = exec.Command(exePath, inputPath, outputPath)
	} else {
		// Linux/macOS: Execute embedded Python script via system python3
		scriptPath := filepath.Join(tempDir, "process_pdf.py")
		if err := os.WriteFile(scriptPath, pythonScript, 0644); err != nil {
			log.Printf("[ERROR] Failed writing embedded Python script: %v\n", err)
			return false, err
		}
		cmd = exec.Command("python3", scriptPath, inputPath, outputPath)
	}

	log.Println("[DEBUG] Executing PDF ticket converter engine...")
	outputLog, err := cmd.CombinedOutput()

	if len(outputLog) > 0 {
		log.Printf("[ENGINE OUTPUT]: %s\n", string(outputLog))
	}

	if err != nil {
		log.Printf("[ERROR] Converter engine execution failed: %v\n", err)
		return false, fmt.Errorf("engine processing failed: %s", string(outputLog))
	}

	processedBytes, err := os.ReadFile(outputPath)
	if err != nil {
		log.Printf("[ERROR] Failed reading processed output PDF: %v\n", err)
		return false, err
	}

	// Cache in Go memory storage
	a.storageMutex.Lock()
	a.processedStorage[id] = processedBytes
	a.storageMutex.Unlock()

	log.Printf("[SUCCESS] Successfully processed & cached %d bytes for ID: %s (%s)\n", len(processedBytes), id, fileName)
	return true, nil
}

// CopyPDFToClipboard sets target file as a real native OS File Object for File Manager (Ctrl+V)
func (a *App) CopyPDFToClipboard(id string, fileName string) (bool, error) {
	a.storageMutex.RLock()
	bytesToCopy, exists := a.processedStorage[id]
	a.storageMutex.RUnlock()

	if !exists || len(bytesToCopy) == 0 {
		log.Printf("[ERROR] No cached bytes found for ID: %s\n", id)
		return false, fmt.Errorf("cached bytes not found")
	}

	// 1. Cache location in user home directory (File managers ignore /tmp files)
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return false, fmt.Errorf("cannot resolve home dir: %w", err)
	}
	cacheDir := filepath.Join(homeDir, ".cache", "flowcraft")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return false, fmt.Errorf("cannot create cache dir: %w", err)
	}

	safeName := sanitizeFileName(fileName)
	targetPath := filepath.Join(cacheDir, safeName)

	if err := os.WriteFile(targetPath, bytesToCopy, 0644); err != nil {
		log.Printf("[ERROR] Writing file for clipboard failed: %v\n", err)
		return false, err
	}

	log.Printf("[CopyPDFToClipboard] Registering Native File Object: %s\n", targetPath)

	fileURI := "file://" + targetPath
	gnomePayload := "copy\n" + fileURI

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
		}
	}

	// Fallback text clipboard
	log.Println("[WARN] All native file clipboard methods failed, using path text fallback")
	wailsRuntime.ClipboardSetText(a.ctx, targetPath)
	return true, nil
}

// SavePDFFile opens native file save dialog and writes PDF to selected destination
func (a *App) SavePDFFile(id string, defaultName string) (bool, error) {
	a.storageMutex.RLock()
	bytesToSave, exists := a.processedStorage[id]
	a.storageMutex.RUnlock()

	if !exists || len(bytesToSave) == 0 {
		log.Printf("[ERROR] No cached bytes found for ID: %s\n", id)
		return false, fmt.Errorf("cached bytes not found")
	}

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

	if err != nil || savePath == "" {
		return false, err
	}

	err = os.WriteFile(savePath, bytesToSave, 0644)
	if err != nil {
		return false, fmt.Errorf("failed writing file to disk: %w", err)
	}

	log.Printf("[SUCCESS] Saved file directly to path: %s\n", savePath)
	return true, nil
}

// Helper utilities for file sanitization and string readers
func sanitizeFileName(name string) string {
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
