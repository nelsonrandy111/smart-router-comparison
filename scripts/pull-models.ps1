param(
  [string] = 'http://localhost:11434'
)
 = @('phi3:mini','mistral:7b','llama3:8b','nomic-embed-text','all-minilm')
foreach ( in ) {
  Write-Host  Pulling ...
  & ollama pull 
}
