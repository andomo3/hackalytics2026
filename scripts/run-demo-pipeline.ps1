$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$repoRoot = Resolve-Path "$PSScriptRoot\.."
$pythonCandidates = @(
  (Join-Path $repoRoot ".venv\Scripts\python.exe"),
  (Join-Path $repoRoot "venv\Scripts\python.exe"),
  (Join-Path $repoRoot "backend\venv\Scripts\python.exe"),
  "python"
)
$pythonExe = $pythonCandidates | Where-Object { $_ -eq "python" -or (Test-Path $_) } | Select-Object -First 1

function Invoke-Py {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Args
  )

  & $pythonExe @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $pythonExe $($Args -join ' ')"
  }
}

Push-Location "$PSScriptRoot\..\backend"
try {
  Write-Host "Checking model artifact..."
  Invoke-Py -Args @(
    "-c",
    "from app.ml.predictor import resolve_model_path, model_search_paths; p=resolve_model_path(); print('Using trained model: '+str(p) if p else 'No trained model found. Fallback will be used. Searched: '+', '.join(str(x) for x in model_search_paths()))"
  )

  Invoke-Py -Args @("-m", "scripts.precompute")
  Invoke-Py -Args @(
    "-m", "scripts.build_demo_timeline",
    "--scenario-id", "scenario_c_blowout_q3",
    "--num-simulations", "10000",
    "--seed", "42"
  )
} finally {
  Pop-Location
}

Write-Host "Demo pipeline complete."
