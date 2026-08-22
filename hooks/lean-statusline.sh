#!/usr/bin/env bash
# Prompt-Studio Lean statusline. Opt-in: a plugin cannot self-register a
# statusline, so point ~/.claude/settings.json at this script:
#   "statusLine": { "type": "command", "command": "bash /ABS/PATH/hooks/lean-statusline.sh" }
# Prints [LEAN] for full/default, [LEAN:LEVEL] otherwise (amber for ultra).
# Silent when Lean is off or no flag exists.

# Match _lean_common.py: state dir precedence + project-scoped flag name
# (.lean-active-<sha1(project)[:8]>). Try raw-path hash, then realpath hash
# (realpath is what the #21 normalization fix uses), then the global flag.
state_dir="${CLAUDE_STATE_DIR:-${CLAUDE_CONFIG_DIR:-$HOME/.claude}}"
raw="${CLAUDE_PROJECT_DIR:-$PWD}"
real="$(cd "$raw" 2>/dev/null && pwd -P || printf '%s' "$raw")"
sha() { printf '%s' "$1" | { shasum -a 1 2>/dev/null || sha1sum; } | cut -c1-8; }

flag=""
for name in ".lean-active-$(sha "$raw")" ".lean-active-$(sha "$real")" ".lean-active"; do
    if [ -f "$state_dir/$name" ]; then flag="$state_dir/$name"; break; fi
done
[ -n "$flag" ] || exit 0

mode=$(head -n1 "$flag" | tr -d '[:space:]')
[ "$mode" = "off" ] && exit 0

# ultra is high-intensity: amber (173) vs default (108). Colour is a redundant
# cue; the level is still in the text.
color=108
[ "$mode" = "ultra" ] && color=173

if [ -z "$mode" ] || [ "$mode" = "full" ]; then
    printf '\033[38;5;%sm[LEAN]\033[0m' "$color"
else
    printf '\033[38;5;%sm[LEAN:%s]\033[0m' "$color" "$(printf '%s' "$mode" | tr '[:lower:]' '[:upper:]')"
fi
