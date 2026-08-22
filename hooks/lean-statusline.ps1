# Prompt-Studio Lean statusline (PowerShell). Opt-in: point
# ~/.claude/settings.json statusLine.command at this script.
# Prints [LEAN] for full/default, [LEAN:LEVEL] otherwise (amber for ultra).
# Silent when Lean is off or no flag exists.

# Match _lean_common.py: state dir precedence + project-scoped flag name
# (.lean-active-<sha1(project)[:8]>). Try raw-path hash, then realpath hash,
# then the global flag.
$StateDir = if ($env:CLAUDE_STATE_DIR) { $env:CLAUDE_STATE_DIR }
            elseif ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR }
            else { Join-Path $HOME ".claude" }
$Raw = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { $PWD.Path }
try { $Real = (Resolve-Path -LiteralPath $Raw -ErrorAction Stop).Path } catch { $Real = $Raw }

function Get-Sha8([string]$s) {
    $sha1 = [System.Security.Cryptography.SHA1]::Create()
    $bytes = $sha1.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($s))
    (([System.BitConverter]::ToString($bytes)) -replace '-', '').ToLower().Substring(0, 8)
}

$Flag = $null
foreach ($name in @(".lean-active-$(Get-Sha8 $Raw)", ".lean-active-$(Get-Sha8 $Real)", ".lean-active")) {
    $p = Join-Path $StateDir $name
    if (Test-Path $p) { $Flag = $p; break }
}
if (-not $Flag) { exit 0 }

$Mode = ""
try { $Mode = (Get-Content $Flag -ErrorAction Stop | Select-Object -First 1).Trim() } catch { exit 0 }
if ($Mode -eq "off") { exit 0 }

$Esc = [char]27
$Color = if ($Mode -eq "ultra") { "173" } else { "108" }
if ([string]::IsNullOrEmpty($Mode) -or $Mode -eq "full") {
    [Console]::Write("${Esc}[38;5;${Color}m[LEAN]${Esc}[0m")
} else {
    [Console]::Write("${Esc}[38;5;${Color}m[LEAN:$($Mode.ToUpperInvariant())]${Esc}[0m")
}
