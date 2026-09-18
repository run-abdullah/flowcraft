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
	"sync"
	"syscall"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed binaries/process_pdf.py
var pythonScript []byte

//go:embed binaries/process_pdf.exe
var pythonExe []byte

type App struct {
	ctx              context.Context
	processedStorage map[string][]byte
	storageMutex     sync.RWMutex
}

type BatchCopyItem struct {
	ID       string `json:"id"`
	FileName string `json:"fileName"`
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
			{DisplayName: "PDF Documents (*.pdf)", Pattern: "*.pdf"},
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
		return false, fmt.Errorf("failed reading input file: %w", err)
	}

	tempDir, err := os.MkdirTemp("", "flowcraft_pdf_*")
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
		exePath := filepath.Join(tempDir, "process_pdf.exe")
		if len(pythonExe) == 0 {
			return false, fmt.Errorf("embedded Windows Python engine missing")
		}
		if err := os.WriteFile(exePath, pythonExe, 0755); err != nil {
			return false, fmt.Errorf("failed unpacking Windows engine: %w", err)
		}
		cmd = exec.Command(exePath, inputPath, outputPath)

		// CMD Pop-up Window Hide Flags
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000, // CREATE_NO_WINDOW
		}
	} else {
		scriptPath := filepath.Join(tempDir, "process_pdf.py")
		if err := os.WriteFile(scriptPath, pythonScript, 0644); err != nil {
			return false, err
		}
		cmd = exec.Command("python3", scriptPath, inputPath, outputPath)
	}

	outputLog, err := cmd.CombinedOutput()
	if len(outputLog) > 0 {
		log.Printf("[ENGINE OUTPUT]: %s\n", string(outputLog))
	}

	if err != nil {
		return false, fmt.Errorf("engine processing failed: %s", string(outputLog))
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

// CopyPDFToClipboard sets target file as a native OS File Object for File Manager (Ctrl+V)
func (a *App) CopyPDFToClipboard(id string, fileName string) (bool, error) {
	a.storageMutex.RLock()
	bytesToCopy, exists := a.processedStorage[id]
	a.storageMutex.RUnlock()

	if !exists || len(bytesToCopy) == 0 {
		return false, fmt.Errorf("cached bytes not found")
	}

	tempDir := os.TempDir()
	cacheDir := filepath.Join(tempDir, "flowcraft_cache")
	_ = os.MkdirAll(cacheDir, 0755)

	safeName := sanitizeFileName(fileName)
	targetPath := filepath.Join(cacheDir, safeName)

	if err := os.WriteFile(targetPath, bytesToCopy, 0644); err != nil {
		return false, err
	}

	var copyErr error
	if runtime.GOOS == "windows" {
		copyErr = copyToClipboardWindows(targetPath)
	} else {
		copyErr = copyToClipboardLinux(targetPath)
	}

	if copyErr != nil {
		log.Printf("[WARN] Native file clipboard failed, using path fallback: %v\n", copyErr)
		wailsRuntime.ClipboardSetText(a.ctx, targetPath)
	}

	return true, nil
}

// CopyAllPDFsToClipboard writes ALL selected files into Clipboard as a Single File Drop
func (a *App) CopyAllPDFsToClipboard(items []BatchCopyItem) (bool, error) {
	if len(items) == 0 {
		return false, fmt.Errorf("no items provided")
	}

	tempDir := os.TempDir()
	cacheDir := filepath.Join(tempDir, "flowcraft_cache")
	_ = os.MkdirAll(cacheDir, 0755)

	var targetPaths []string

	a.storageMutex.RLock()
	defer a.storageMutex.RUnlock()

	for _, item := range items {
		bytesToCopy, exists := a.processedStorage[item.ID]
		if !exists || len(bytesToCopy) == 0 {
			continue
		}

		safeName := sanitizeFileName(item.FileName)
		targetPath := filepath.Join(cacheDir, safeName)

		if err := os.WriteFile(targetPath, bytesToCopy, 0644); err == nil {
			targetPaths = append(targetPaths, targetPath)
		}
	}

	if len(targetPaths) == 0 {
		return false, fmt.Errorf("failed to process any files for clipboard")
	}

	var err error
	if runtime.GOOS == "windows" {
		err = copyMultipleToClipboardWindows(targetPaths)
	} else {
		err = copyMultipleToClipboardLinux(targetPaths)
	}

	if err != nil {
		log.Printf("[ERROR] Multi-file clipboard failed: %v\n", err)
		return false, err
	}

	log.Printf("[SUCCESS] Copied %d files to clipboard natively!\n", len(targetPaths))
	return true, nil
}

// SavePDFFile opens native file save dialog and writes PDF to selected destination
func (a *App) SavePDFFile(id string, defaultName string) (bool, error) {
	a.storageMutex.RLock()
	bytesToSave, exists := a.processedStorage[id]
	a.storageMutex.RUnlock()

	if !exists || len(bytesToSave) == 0 {
		return false, fmt.Errorf("cached bytes not found")
	}

	savePath, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		DefaultFilename: defaultName,
		Title:           "Save Processed Ticket PDF",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "PDF Documents (*.pdf)", Pattern: "*.pdf"},
		},
	})

	if err != nil || savePath == "" {
		return false, err
	}

	err = os.WriteFile(savePath, bytesToSave, 0644)
	if err != nil {
		return false, fmt.Errorf("failed writing file to disk: %w", err)
	}

	return true, nil
}
