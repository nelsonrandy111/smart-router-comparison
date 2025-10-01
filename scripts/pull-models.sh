#!/usr/bin/env bash
set -euo pipefail
models=(phi3:mini mistral:7b llama3:8b nomic-embed-text all-minilm)
for m in ; do
  echo Pulling ...
  ollama pull 
done
