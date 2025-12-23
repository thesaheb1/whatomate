package frontend

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"strings"

	"github.com/valyala/fasthttp"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

//go:embed dist/*
var distFS embed.FS

// cachedIndexHTML stores the modified index.html with injected base path
var cachedIndexHTML []byte

// Handler returns a fasthttp handler that serves the embedded frontend files
// basePath should be empty string for root deployment or "/subpath" for subdirectory
func Handler(basePath string) fasthttp.RequestHandler {
	// Normalize base path
	basePath = strings.TrimSuffix(basePath, "/")

	// Get the dist subdirectory
	distSubFS, err := fs.Sub(distFS, "dist")
	if err != nil {
		panic("failed to get dist subdirectory: " + err.Error())
	}

	// Read and modify index.html to inject base path
	indexContent, err := fs.ReadFile(distSubFS, "index.html")
	if err != nil {
		panic("failed to read index.html: " + err.Error())
	}

	// Inject base path script before </head>
	basePathScript := fmt.Sprintf(`<script>window.__BASE_PATH__ = "%s";</script></head>`, basePath)
	cachedIndexHTML = []byte(strings.Replace(string(indexContent), "</head>", basePathScript, 1))

	// Create file server
	fileServer := http.FileServer(http.FS(distSubFS))

	// Wrap with SPA fallback
	spaHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Try to serve the file
		if path != "/" && !strings.HasPrefix(path, "/api") {
			// Check if file exists
			if f, err := distSubFS.Open(strings.TrimPrefix(path, "/")); err == nil {
				f.Close()
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// For root or non-existent files (SPA routes), serve modified index.html
		if path == "/" || (!strings.HasPrefix(path, "/api") && !strings.Contains(path, ".")) {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(cachedIndexHTML)
			return
		}

		// Serve the actual file
		fileServer.ServeHTTP(w, r)
	})

	// Convert to fasthttp handler
	return fasthttpadaptor.NewFastHTTPHandler(spaHandler)
}

// IsEmbedded returns true if the frontend dist folder is embedded
func IsEmbedded() bool {
	entries, err := distFS.ReadDir("dist")
	if err != nil {
		return false
	}
	return len(entries) > 0
}
