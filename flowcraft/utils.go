package main

import "strings"

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
		out = strings.ReplaceAll(out, r.old, r.new)
	}
	return out
}
