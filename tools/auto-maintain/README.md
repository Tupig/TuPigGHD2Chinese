# auto-maintain — localization.json 自动维护工具

**简体中文** | [English](#auto-maintain--localizationjson-maintenance-tool-english)

自动维护 TuPigGHD2Chinese 的 `json/localization.json`：

1. **失效检测** (`check`)：获取最新 GitHub Desktop（Windows 版），对现有映射逐条检测是否能匹配到 `main.js` / `renderer.js`，找出失效（匹配不到）的映射项。
2. **依序模拟检测** (`simulate`)：按 C++ 加载器的应用顺序（main → renderer → select）依序应用全部映射并逐条统计实际替换次数，找出「单独可匹配、但被前面正则先改写」的隐性失效条目（#207）。
3. **未翻译候选提取** (`extract`)：从最新 GitHub Desktop 中提取尚未被现有映射覆盖的英文 UI 文案候选，并生成可直接粘贴的 JSON 条目草稿。

> 该工具**只产出报告，不直接修改** `localization.json`。所有改动仍需人工确认，避免正则写坏导致 GitHub Desktop 无法打开。

## 运行环境

- Node.js >= 18
- 解压工具：Linux/macOS 需 `unzip`（或 `tar`），Windows 自带 `tar`

## 用法

```bash
cd tools/auto-maintain

# 失效检测（默认读取仓库根目录 json/localization.json，与当前所在目录无关）
node src/index.js check

# 依序模拟检测（可与 check 组合）
node src/index.js simulate

# 模拟检测并输出全量逐条替换计数（默认仅输出隐性失效项）
node src/index.js simulate --verbose

# 未翻译候选提取
node src/index.js extract

# 两者都跑，并输出报告到 workdir/report.md（等价快捷方式：npm run all）
node src/index.js check extract --write-report

# 指定映射文件路径
node src/index.js check --json /path/to/localization.json

# 本地调试：复用已有的 main.js/renderer.js（跳过约 307MB 下载）
node src/index.js check extract --keep-js

# 运行单元测试（与 CI JsonCheck 同一入口，无需网络）
npm test
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `check` / `simulate` / `extract` / `all` | 子命令，可组合（如 `check simulate extract`；`all` = check + extract） |
| `--json <path>` | localization.json 路径（默认为仓库根目录 `json/localization.json`，按脚本位置推导，不受 cwd 影响） |
| `--workdir <dir>` | 下载/解压工作目录（默认系统临时目录） |
| `--keep-js` | 复用 workdir 中已有的 `main.js`/`renderer.js`，跳过下载 |
| `--top <n>` | extract 输出候选条数（默认 60） |
| `--verbose` | simulate 输出全量逐条替换计数（默认仅输出隐性失效项） |
| `--write-report` | 将完整报告写入 `workdir/report.md` |
| `--no-color` | 关闭彩色输出 |

## 更多文档

工作原理（数据源、失效/隐性失效判定、候选提取启发式）、报告解读、CI 自动维护流程（每日北京时间 09:23 定时触发）与常见问题，见 [wiki 自动维护工具](../../docs/wiki/自动维护工具.md)。

## 目录结构

```
tools/auto-maintain/
├── package.json
├── ignore-names.json      # 候选提取时忽略的内部名称清单
├── regex-blacklist.json   # std::regex 不兼容语法黑名单（与 CI 质量门共用单一事实来源）
├── vitest.config.mjs      # Vitest 配置（含覆盖率阈值）
├── src/
│   ├── index.js           # CLI 入口
│   ├── args.js            # 命令行参数解析
│   ├── fetch.js           # 获取/下载/解压最新 GitHub Desktop，提取 main.js/renderer.js
│   ├── check-invalid.js   # 失效检测
│   ├── simulate.js        # 依序模拟检测（按 C++ 应用顺序逐条替换计数，发现隐性抢占）
│   ├── extract-new.js     # 未翻译候选提取
│   └── report.js          # Markdown 报告渲染（含表格行数上限防护）
└── test/                  # Vitest 单元测试
```

---

# auto-maintain — localization.json Maintenance Tool (English)

[简体中文](#auto-maintain--localizationjson-自动维护工具) | **English**

Automates maintenance of TuPigGHD2Chinese's `json/localization.json`:

1. **Invalid-entry check** (`check`): fetches the latest GitHub Desktop (Windows edition) and tests every existing mapping against `main.js` / `renderer.js` to find stale (no-longer-matching) entries.
2. **Sequential simulation detection** (`simulate`): applies all mappings in the C++ loader's order (main → renderer → select), counting actual replacements per entry, to find entries that silently stop working **only when applied in order** because an earlier regex rewrites their target first (#207).
3. **Untranslated candidate extraction** (`extract`): extracts English UI string candidates from the latest GitHub Desktop that are not yet covered by existing mappings, and produces ready-to-paste JSON entry drafts.

> The tool **only produces reports; it never modifies** `localization.json` directly. All changes still require manual confirmation, to avoid a broken regex leaving GitHub Desktop unable to start.

## Requirements

- Node.js >= 18
- An unzip tool: Linux/macOS need `unzip` (or `tar`); Windows ships with `tar`

## Usage

```bash
cd tools/auto-maintain

# Invalid-entry check (reads json/localization.json at the repository root by default, regardless of cwd)
node src/index.js check

# Sequential simulation detection (combinable with check)
node src/index.js simulate

# Simulate and print per-entry replacement counts (by default only hidden failures are printed)
node src/index.js simulate --verbose

# Untranslated candidate extraction
node src/index.js extract

# Run both and write the report to workdir/report.md (equivalent shortcut: npm run all)
node src/index.js check extract --write-report

# Specify a mapping file path
node src/index.js check --json /path/to/localization.json

# Local debugging: reuse existing main.js/renderer.js (skips the ~307MB download)
node src/index.js check extract --keep-js

# Run the unit tests (same entry point as the CI JsonCheck job; no network needed)
npm test
```

## Options

| Option | Description |
| --- | --- |
| `check` / `simulate` / `extract` / `all` | Subcommands, combinable (e.g. `check simulate extract`; `all` = check + extract) |
| `--json <path>` | Path to localization.json (defaults to `json/localization.json` at the repository root, resolved from the script location and unaffected by cwd) |
| `--workdir <dir>` | Download/extraction working directory (defaults to the system temp directory) |
| `--keep-js` | Reuse the `main.js`/`renderer.js` already in workdir, skipping the download |
| `--top <n>` | Number of candidates extract outputs (default 60) |
| `--verbose` | Have simulate print per-entry replacement counts (by default only hidden failures are printed) |
| `--write-report` | Write the full report to `workdir/report.md` |
| `--no-color` | Disable colored output |

## Further Documentation

How it works (data source, stale/hidden-failure criteria, candidate-extraction heuristics), reading the report, the CI auto-maintenance flow (daily schedule at 09:23 Beijing time) and the FAQ are covered in the [wiki auto-maintain tool](../../docs/wiki/自动维护工具.md) page.

## Directory Layout

```
tools/auto-maintain/
├── package.json
├── ignore-names.json      # Internal names ignored during candidate extraction
├── regex-blacklist.json   # Denylist of std::regex-incompatible syntax (shared with the CI quality gate)
├── vitest.config.mjs      # Vitest configuration (with coverage thresholds)
├── src/
│   ├── index.js           # CLI entry
│   ├── args.js            # CLI argument parsing
│   ├── fetch.js           # Fetch/download/extract the latest GitHub Desktop, extract main.js/renderer.js
│   ├── check-invalid.js   # Invalid-entry check
│   ├── simulate.js        # Sequential simulation detection (per-entry replacement counts in C++ application order, finds hidden preemption)
│   ├── extract-new.js     # Untranslated candidate extraction
│   └── report.js          # Markdown report rendering (with table row-limit protection)
└── test/                  # Vitest unit tests
```
