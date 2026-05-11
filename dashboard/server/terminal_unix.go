//go:build darwin || linux

package server

import "strings"

// shellQuote returns a POSIX shell single-quoted form of s, suitable for
// inclusion in a /bin/sh command line. Identical on macOS and Linux.
func shellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "'\\''") + "'"
}
