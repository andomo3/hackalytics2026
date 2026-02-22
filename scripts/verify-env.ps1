[CmdletBinding()]
param(
  [string]$ComposeFile = "docker-compose.yml",
  [string]$OutFile = "",
  [string]$CompareWith = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-TextSha256 {
  param([Parameter(Mandatory = $true)][string]$Text)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = $sha.ComputeHash($bytes)
    return ([BitConverter]::ToString($hash) -replace "-", "").ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-FileSha256OrNull {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-GitValueOrNull {
  param([Parameter(Mandatory = $true)][string[]]$Args)
  $output = git @Args 2>$null
  if ($LASTEXITCODE -ne 0) {
    return $null
  }
  return ($output | Out-String).Trim()
}

function ConvertTo-Array {
  param($Value)
  if ($null -eq $Value) { return @() }
  if ($Value -is [System.Array]) { return $Value }
  return @($Value)
}

function Get-ObjectPropertyNames {
  param($Object)
  if ($null -eq $Object) { return @() }
  if ($Object -is [System.Collections.IDictionary]) {
    return @($Object.Keys)
  }
  return @($Object.PSObject.Properties | ForEach-Object { $_.Name })
}

function Get-ObjectPropertyValue {
  param($Object, [string]$Name)
  if ($null -eq $Object) { return $null }
  if ($Object -is [System.Collections.IDictionary]) {
    if ($Object.Contains($Name)) {
      return $Object[$Name]
    }
    return $null
  }
  $prop = $Object.PSObject.Properties[$Name]
  if ($null -eq $prop) { return $null }
  return $prop.Value
}

function Get-DockerSnapshot {
  param([Parameter(Mandatory = $true)][string]$ComposeFilePath)

  $snapshot = [ordered]@{
    available = $false
    compose_file = $ComposeFilePath
    compose_config_sha256 = $null
    compose_services = @()
    images_by_service = [ordered]@{}
    errors = @()
  }

  docker version --format '{{.Server.Version}}' 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) {
    $snapshot.errors += "Docker daemon not available."
    return $snapshot
  }
  $snapshot.available = $true

  $composeConfig = docker compose -f $ComposeFilePath config 2>$null
  if ($LASTEXITCODE -ne 0) {
    $snapshot.errors += "Failed to run 'docker compose config'."
    return $snapshot
  }

  $configText = ($composeConfig | Out-String)
  $snapshot.compose_config_sha256 = Get-TextSha256 -Text $configText

  $servicesOutput = docker compose -f $ComposeFilePath config --services 2>$null
  if ($LASTEXITCODE -eq 0) {
    $snapshot.compose_services = @(
      $servicesOutput |
      ForEach-Object { "$_".Trim() } |
      Where-Object { $_ -ne "" }
    )
  } else {
    $snapshot.errors += "Failed to list compose services."
  }

  $imagesRaw = docker compose -f $ComposeFilePath images --format json 2>$null
  if ($LASTEXITCODE -ne 0) {
    $snapshot.errors += "Failed to list compose images."
    return $snapshot
  }

  $imagesRawText = ($imagesRaw | Out-String).Trim()
  if (-not [string]::IsNullOrWhiteSpace($imagesRawText)) {
    $images = ConvertTo-Array -Value ($imagesRawText | ConvertFrom-Json)
    foreach ($image in $images) {
      $serviceName = $null
      $containerName = "$(Get-ObjectPropertyValue -Object $image -Name 'ContainerName')"
      if ($containerName -match "^[^-]+-(.+)-\d+$") {
        $serviceName = $Matches[1]
      }
      if ([string]::IsNullOrWhiteSpace($serviceName)) {
        $serviceName = $containerName
      }

      $repo = "$(Get-ObjectPropertyValue -Object $image -Name 'Repository')"
      $tag = "$(Get-ObjectPropertyValue -Object $image -Name 'Tag')"
      $repo = $repo.Trim()
      $tag = $tag.Trim()
      $imageRef = if (
        -not [string]::IsNullOrWhiteSpace($repo) -and
        -not [string]::IsNullOrWhiteSpace($tag) -and
        $repo -ne "<none>" -and
        $tag -ne "<none>"
      ) { "${repo}:${tag}" } else { $null }
      $repoDigests = @()

      if (-not [string]::IsNullOrWhiteSpace($imageRef)) {
        try {
          $digestsRaw = docker image inspect $imageRef --format '{{json .RepoDigests}}' 2>$null
          if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace("$digestsRaw")) {
            try {
              $parsedDigests = $digestsRaw | ConvertFrom-Json
              $repoDigests = ConvertTo-Array -Value $parsedDigests
            } catch {
              # Keep empty repoDigests if parsing fails.
            }
          }
        } catch {
          # Keep empty repoDigests if docker inspect fails for a local-only image ref.
        }
      }

      $snapshot.images_by_service[$serviceName] = [ordered]@{
        image_id = "$(Get-ObjectPropertyValue -Object $image -Name 'ID')"
        repository = $repo
        tag = $tag
        platform = "$(Get-ObjectPropertyValue -Object $image -Name 'Platform')"
        repo_digests = $repoDigests
      }
    }
  }

  return $snapshot
}

function Add-Check {
  param(
    [Parameter(Mandatory = $true)][ref]$Checks,
    [Parameter(Mandatory = $true)][string]$Name,
    $Local,
    $Other,
    [bool]$Required = $true
  )
  $localText = if ($null -eq $Local) { "<null>" } else { "$Local" }
  $otherText = if ($null -eq $Other) { "<null>" } else { "$Other" }
  $Checks.Value += [pscustomobject]@{
    Check = $Name
    Pass = ($localText -eq $otherText)
    Required = $Required
    Local = $localText
    Other = $otherText
  }
}

try {
  $resolvedCompose = Resolve-Path -LiteralPath $ComposeFile -ErrorAction Stop
  $composePath = $resolvedCompose.Path
} catch {
  Write-Error "Compose file not found: $ComposeFile"
  exit 1
}

$gitBranch = Get-GitValueOrNull -Args @("branch", "--show-current")
$gitCommit = Get-GitValueOrNull -Args @("rev-parse", "HEAD")
$gitDirtyRaw = Get-GitValueOrNull -Args @("status", "--porcelain")
$gitDirty = -not [string]::IsNullOrWhiteSpace($gitDirtyRaw)

$hostName = if ($env:COMPUTERNAME) { $env:COMPUTERNAME } else { "unknown-host" }
if ([string]::IsNullOrWhiteSpace($OutFile)) {
  $OutFile = Join-Path "artifacts" "env-fingerprint-$hostName.json"
}

$outDir = Split-Path -Parent $OutFile
if (-not [string]::IsNullOrWhiteSpace($outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$dockerSnapshot = Get-DockerSnapshot -ComposeFilePath $composePath

$fingerprint = [ordered]@{
  schema_version = 1
  generated_at_utc = (Get-Date).ToUniversalTime().ToString("o")
  host = [ordered]@{
    computer_name = $hostName
    user = $env:USERNAME
    os = [System.Environment]::OSVersion.VersionString
  }
  git = [ordered]@{
    branch = $gitBranch
    commit = $gitCommit
    tree_dirty = $gitDirty
  }
  files = [ordered]@{
    compose_sha256 = Get-FileSha256OrNull -Path $composePath
    env_example_sha256 = Get-FileSha256OrNull -Path ".env.example"
    env_local_sha256 = Get-FileSha256OrNull -Path ".env"
    frontend_package_json_sha256 = Get-FileSha256OrNull -Path "frontend/package.json"
    frontend_lock_sha256 = Get-FileSha256OrNull -Path "frontend/package-lock.json"
    backend_requirements_sha256 = Get-FileSha256OrNull -Path "backend/requirements.txt"
    root_requirements_sha256 = Get-FileSha256OrNull -Path "requirements.txt"
  }
  docker = $dockerSnapshot
}

$json = $fingerprint | ConvertTo-Json -Depth 10
Set-Content -LiteralPath $OutFile -Value $json -Encoding UTF8
Write-Host "Wrote fingerprint: $OutFile"

if ([string]::IsNullOrWhiteSpace($CompareWith)) {
  Write-Host "No comparison file provided."
  Write-Host "Next step:"
  Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/verify-env.ps1 -CompareWith <teammate-fingerprint.json>"
  exit 0
}

if (-not (Test-Path -LiteralPath $CompareWith)) {
  Write-Error "Compare file not found: $CompareWith"
  exit 1
}

$otherFingerprint = Get-Content -LiteralPath $CompareWith -Raw | ConvertFrom-Json
$checks = @()

Add-Check -Checks ([ref]$checks) -Name "compose config hash" `
  -Local $fingerprint.docker.compose_config_sha256 -Other $otherFingerprint.docker.compose_config_sha256
Add-Check -Checks ([ref]$checks) -Name "frontend lock hash" `
  -Local $fingerprint.files.frontend_lock_sha256 -Other $otherFingerprint.files.frontend_lock_sha256
Add-Check -Checks ([ref]$checks) -Name "backend requirements hash" `
  -Local $fingerprint.files.backend_requirements_sha256 -Other $otherFingerprint.files.backend_requirements_sha256
Add-Check -Checks ([ref]$checks) -Name ".env.example hash" `
  -Local $fingerprint.files.env_example_sha256 -Other $otherFingerprint.files.env_example_sha256
Add-Check -Checks ([ref]$checks) -Name "git commit" `
  -Local $fingerprint.git.commit -Other $otherFingerprint.git.commit -Required $false

$localImages = $fingerprint.docker.images_by_service
$otherImages = $otherFingerprint.docker.images_by_service
$serviceNames = @(
  (Get-ObjectPropertyNames -Object $localImages) +
  (Get-ObjectPropertyNames -Object $otherImages)
) | Sort-Object -Unique

foreach ($service in $serviceNames) {
  $localService = Get-ObjectPropertyValue -Object $localImages -Name $service
  $otherService = Get-ObjectPropertyValue -Object $otherImages -Name $service
  $localImageId = Get-ObjectPropertyValue -Object $localService -Name "image_id"
  $otherImageId = Get-ObjectPropertyValue -Object $otherService -Name "image_id"
  Add-Check -Checks ([ref]$checks) -Name "image id [$service]" -Local $localImageId -Other $otherImageId
}

Write-Host ""
Write-Host "Comparison results"
$checks | Format-Table -AutoSize

$requiredFailures = @($checks | Where-Object { $_.Required -and -not $_.Pass })
if ($requiredFailures.Count -gt 0) {
  Write-Host ""
  Write-Host "RESULT: FAIL (required checks differ)" -ForegroundColor Red
  exit 2
}

Write-Host ""
Write-Host "RESULT: PASS (required checks match)" -ForegroundColor Green
exit 0
