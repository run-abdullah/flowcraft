package main

import (
	"fmt"
	"os/exec"
	"strings"
	"syscall"
)

func copyToClipboardWindows(filePath string) error {
	return copyMultipleToClipboardWindows([]string{filePath})
}

func copyMultipleToClipboardWindows(filePaths []string) error {
	var escapedPaths []string
	for _, p := range filePaths {
		escapedPaths = append(escapedPaths, fmt.Sprintf("'%s'", strings.ReplaceAll(p, "'", "''")))
	}

	pathsJoined := strings.Join(escapedPaths, ",")

	// System.Windows.Forms Assembly explicit load kar di hai
	psScript := fmt.Sprintf(`
		Add-Type -AssemblyName System.Windows.Forms
		$paths = @(%s)
		$col = New-Object System.Collections.Specialized.StringCollection
		foreach ($p in $paths) { $col.Add($p) | Out-Null }
		[System.Windows.Forms.Clipboard]::SetFileDropList($col)
	`, pathsJoined)

	cmd := exec.Command("powershell", "-Sta", "-NoProfile", "-NonInteractive", "-Command", psScript)

	// PowerShell Pop-up Window Hide Flags
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000, // CREATE_NO_WINDOW
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("powershell error: %v, output: %s", err, string(output))
	}
	return nil
}

func copyToClipboardLinux(filePath string) error {
	return copyMultipleToClipboardLinux([]string{filePath})
}

func copyMultipleToClipboardLinux(filePaths []string) error {
	var uris []string
	for _, p := range filePaths {
		uris = append(uris, fmt.Sprintf("file://%s", p))
	}
	content := strings.Join(uris, "\n")

	cmd := exec.Command("xclip", "-selection", "clipboard", "-t", "text/uri-list")
	cmd.Stdin = strings.NewReader(content)
	return cmd.Run()
}
