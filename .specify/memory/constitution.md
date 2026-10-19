<!--
Sync Impact Report
- Version change: N/A (initial adoption) → 1.0.0
- Modified principles: N/A
- Added sections: Core Principles (6), Additional Constraints,
  Development Workflow & Quality Gates, Governance
- Removed sections: None
- Deferred TODOs: None
-->

# TuPigGHD2Chinese Constitution

## Core Principles

### I. 用户数据安全与可回滚（NON-NEGOTIABLE）

任何会修改用户机器上 GitHub Desktop 文件的路径，MUST 先创建可恢复备份，再以原子写入替换；
失败时必须回滚到原始内容。`.bak` 备份 MUST 带来源标记，禁止把已汉化内容当作原始备份重建。
所有下载与自更新 MUST 使用 HTTPS、校验证书、校验 SHA256；校验失败 MUST fail-closed，不得降级放行。
程序 MUST NOT 新增遥测、上传用户数据或收集个人数据；`PRIVACY.md` 与实际行为必须一致。

**Rationale**: 本工具直接改写用户应用文件；一次错误替换就可能让 GitHub Desktop 无法启动。
可回滚、可验证和最小数据收集是不可交易的安全底线。

### II. 测试与证据优先（NON-NEGOTIABLE）

每个变更 MUST 在 PR 中给出与改动范围匹配的验证证据；CI 通过不等于证据完整，禁止用“无法验证”声明完成。
修改 `tools/ci/` 或 `tools/auto-maintain/` 时 MUST 运行 pytest（覆盖率 ≥90%）、Vitest（阈值见
`vitest.config.mjs`）和 `bash tools/ci/bash-scripts-test.sh`。修改 `src/` 或 `tests/` 时 MUST 通过
CTest 的 6 个目标。修改 `json/` 时 MUST 通过本地化质量门，并在 `main_dev` / `renderer_dev` 验证后
再进入正式数组。所有修复 MUST 说明根因、验证命令和残余风险。

**Rationale**: 项目已有 pytest、Vitest、GoogleTest/CTest、Bash 功能测试和覆盖率门禁；证据优先能防止
“看起来修好了”的回归，也能让审查者复现结论。

### III. 供应链与构建可复现（NON-NEGOTIABLE）

第三方 GitHub Actions MUST 以 commit SHA 固定，禁止浮动 tag。OpenSSL MUST 使用 3.5.x 静态库，
由仓库内置或 CI vendor 任务构建；源码哈希 MUST 与 openssl.org 公示值交叉核对，产物 MUST NOT 依赖
Homebrew 或系统 OpenSSL。发布构建 MUST 覆盖 Windows x64、macOS x64/arm64、Linux x64，且仅支持 64 位。
构建 MUST 自包含：不引入外部第三方依赖服务，不要求用户额外安装运行时。

**Rationale**: 供应链篡改和不可复现构建是发布型工具的高风险面；固定 SHA、静态链接和哈希旁证可把风险
收敛到可审计的范围内。

### IV. 本地化映射的正确性与顺序

查找项 MUST 是合法正则，并按 JSON 规则转义；译文 MUST 按字面量写入，不得残留正则转义。
新条目若与已有条目构成“短含长”，MUST 插在更宽泛（更短）条目之前，保证先匹配者生效。
译文 MUST 使用全角问号，末尾不得有多余空格。新增或修改条目 MUST 通过 `--invalidcheck` 或等效的
失效条目自检后再提交。

**Rationale**: 替换按条目顺序逐字面执行；顺序或转义错误会造成误替换、专条失效或产物语法错误。
这些规则已在 `docs/CONTRIBUTING.md` 和 CI 质量门中反复验证。

### V. 跨平台一致与最小惊讶

面向用户的改动 MUST 在 Windows、macOS、Linux 的既有构建矩阵下保持行为一致；平台差异 MUST 有明确
理由和验证记录。不得为了单平台便利破坏其他平台的离线构建或产物自包含性。文档、Release 说明和实际
行为 MUST 保持同步。

**Rationale**: 项目以三平台一致发布为承诺；平台特例若无证据，会让用户遇到不可复现的差异。

### VI. 小步变更、可审查与文档同步

每项任务 MUST 先有 issue 或明确的变更说明，再走 `<type>/<短描述>` 分支和 PR。
提交信息 MUST 遵循 Conventional Commits（`<type>(<scope>): <subject>(#<issue>)`）。
`main` MUST 通过 PR 合入，禁止直接推送、强推或删除；PR MUST 通过必需质量校验门、获得 1 个 approval、
解决全部对话后 squash merge。行为、配置或使用方式变化时 MUST 同步更新 README、CONTRIBUTING、wiki
或 Release 说明；不得提交密钥、令牌或本地私有产物。

**Rationale**: 小步、可回滚的 PR 与文档同步降低了审查成本和长期漂移；仓库现有的分支保护和 squash
合并流程已经证明有效。

## Additional Constraints

- 技术栈：C++/CMake/Win32 加载器；Python 3.12 用于 CI 校验器；Node/Vitest 用于自动维护工具。
  CI 中的 Node 版本 MUST 钉扎，依赖升级 MUST 有回归证据。
- 依赖策略：C++ 头文件依赖与 OpenSSL 成品库内置 `third_party/`；不引入外部第三方依赖服务。
- 安全扫描：CodeQL、Secret Scanning、Push Protection、Dependabot 和私密漏洞报告保持启用；
  `localization.json` 的危险正则黑名单与 ReDoS 启发式检查不得削弱。
- 签名与溯源：发布产物 MUST 附带可校验的构建溯源；SignPath 未配置时允许跳过签名，但不得阻断发布。
- 工具链：开发代理默认通过 Codex 全局集成使用 RTK 压缩命令输出；被压缩的输出视为完整结果，只有在
  结果为空、与退出码矛盾或明显损坏时才使用 `rtk bypass` 重新执行。

## Development Workflow & Quality Gates

1. 本地构建：`cmake -B build`，再 `cmake --build build --config Release`。
2. C++ 测试：`ctest --preset x64-release`（或等价的 `ctest -C Release --output-on-failure`）。
3. Python 校验器：`python -m pytest --cov --cov-report=term-missing`（覆盖率门禁 ≥90%）。
4. Node 工具：`cd tools/auto-maintain && npm ci && npm test`。
5. Bash 脚本：`bash -n tools/ci/*.sh` 与 `bash tools/ci/bash-scripts-test.sh`。
6. 加载器冒烟：`tools/ci/smoke-test.ps1`（改 `src/` 后执行）。
7. PR 必需检查：`质量校验门（json/编码/工具/md/工作流）`；其余平台构建、CodeQL 等须通过但不设为
   唯一必需项。
8. Spec Kit 流程：项目原则变更走 `$speckit-constitution`；功能变更按
   `$speckit-specify → $speckit-plan → $speckit-tasks → $speckit-implement → $speckit-converge`
   推进。特性文档位于 `specs/`；本地规划目录 `spec/` 继续由 `.gitignore` 忽略。
9. Aegis 方法层：用于基线对齐、证据验证、漂移检查与长任务安全；用户明确指令和本宪法优先。

## Governance

本宪法约束本仓库的工程实践；用户明确指令、法律要求和安全要求优先于本文件。任何 PR 的审查者 MUST
检查变更是否符合本宪法；偏离原则时 MUST 在 PR 中说明理由、影响和补救计划，不得静默绕过。

修订 MUST 通过 PR 提交，包含变更理由、影响的模板/流程和迁移说明。版本号遵循语义化版本：
移除或重新定义原则为 MAJOR；新增原则或实质性扩展为 MINOR；措辞澄清或非语义修正为 PATCH。
每次修订 MUST 更新顶部的 Sync Impact Report，并在合并前移除该临时报告。批准流程与代码变更一致：
1 个 approval、必需检查通过、对话解决后 squash merge。

**Version**: 1.0.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
