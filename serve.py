#!/usr/bin/env python3
"""Static server with no-cache headers so the browser never serves a stale page.
Run from the project root:  python3 serve.py   →  http://localhost:8000/"""
import http.server, socketserver

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", 8000), Handler) as httpd:
    print("serving with no-cache on http://localhost:8000/")
    httpd.serve_forever()
