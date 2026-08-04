# benchmarks

Measures the impact of the **Lean** persona on LLM output size, latency, and
cost. Arms map 1:1 to `app/services/skills.py` intensities and to the message
list produced by `app/services/formats.build_messages()`.

## Arms

| Arm         | System prompt source                                     |
|-------------|----------------------------------------------------------|
| `baseline`  | none (raw task)                                          |
| `caveman`   | `arms/caveman-SKILL.md` (vendored, MIT, JuliusBrussee)   |
| `lean-lite` | `app/skills/lean/SKILL.md` filtered to `lite`            |
| `lean-full` | `app/skills/lean/SKILL.md` filtered to `full` (default)  |
| `lean-ultra`| `app/skills/lean/SKILL.md` filtered to `ultra`           |

All lean arms call `get_lean_instructions()` — the same builder the FastAPI
provider adapters use in production. Zero drift by construction.

## Tasks

Five standard tasks (email validator, JS debounce, CSV sum, React countdown,
FastAPI rate-limit) plus two Prompt-Studio–specific tasks that exercise the
per-provider adapters:

- `chatml2xml` — convert an OpenAI ChatML message list to Anthropic XML tags.
- `cost-est` — estimate token count + USD cost from per-1M pricing.

## Run

### Local (Ollama, no API key)

```bash
ollama pull llama3.2
python benchmarks/benchmark.py --backend ollama --model llama3.2 --repeat 3
```

### Anthropic API

```bash
export ANTHROPIC_API_KEY=sk-ant-...
python benchmarks/benchmark.py --backend anthropic --model claude-haiku-4-5-20251001 --repeat 5
```

Results write to `benchmarks/results/latest.json`; a summary table (LOC,
latency, cost per arm × task, plus %-less-than-baseline) prints to stdout.

## Agentic benchmark

`agentic/` runs the arms as full Claude Code sessions against a real repo
(see `agentic/README.md`). It is the honest measurement — single-shot LOC
deltas overstate the win because the baseline pads with prose.

## Test

```bash
pytest benchmarks/test_arms.py
```

Six assert-based checks covering message shape per arm, monotone payload sizes
across intensities, and LOC counter behavior.

## License

MIT. `arms/caveman-SKILL.md` vendored from
<https://github.com/JuliusBrussee/caveman> (MIT).
Repo: <https://github.com/utk2103/Prompt-Studio>.
