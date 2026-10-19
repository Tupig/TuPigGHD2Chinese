// 自动维护报告 Issue 的创建/更新逻辑(由工作流 github-script 步骤 require 调用)
// 入参: { github, context, core } —— 与 actions/github-script 内置对象一致

// #137: 从报告正文提取失效数(纯函数, tools/auto-maintain/test/tools-self-test.test.mjs 回归覆盖):
// 1) 优先解析 report.js renderMarkdown 输出的结构化 meta 行(<!-- stats: total=.. ok=.. failed=.. -->),
//    与中文展示文案解耦, 文案微调不影响解析;
// 2) 后备兼容旧报告/手动报告的中文统计行;
// 3) 都未命中返回 '?': Number('?')===0 为 false → noFailures 恒 false, 保守不自动关单(仅 core.warning)
function extractFailedCount(report) {
  const meta = report.match(/<!--\s*stats:\s*total=(\d+)\s+ok=(\d+)\s+failed=(\d+)\s*-->/);
  if (meta) return { failed: meta[3], source: 'meta' };
  const legacy = report.match(/总映射项\s+(\d+)，有效\s+(\d+)，失效\s+(\d+)。/);
  if (legacy) return { failed: legacy[3], source: 'legacy-text' };
  return { failed: '?', source: 'none' };
}

// 未翻译候选数解析：结构性 meta 优先，兼容旧报告的中文统计行。
// 统计缺失返回 '?'，与失效数一致，保持“数据不完整时不自动关单”的保守策略。
function extractCandidateCount(report) {
  const meta = report.match(/<!--\s*candidates:\s*count=(\d+)\s*-->/);
  if (meta) return { candidates: meta[1], source: 'meta' };
  const legacy = report.match(/发现\s+(\d+)\s+条未被覆盖的英文文案候选/);
  if (legacy) return { candidates: legacy[1], source: 'legacy-text' };
  return { candidates: '?', source: 'none' };
}

module.exports = async ({ github, context, core }) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.env.RUNNER_TEMP, 'ghdesktop-auto-maintain', 'report.md');
    const report = fs.readFileSync(reportPath, 'utf8');

    const failedInfo = extractFailedCount(report);
    const candidateInfo = extractCandidateCount(report);
    if (failedInfo.source === 'none' || candidateInfo.source === 'none') {
      // 解析失败若静默降级, 自动关单/标题计数会永久失效且无告警, 故显式 warning
      core.warning('report.md 中未找到完整的 stats/candidates meta 行或中文统计行, 失效数/候选数按 ? 处理, 请检查 report.js 是否变更输出格式');
    }
    // 未翻译候选本身也是需要维护者处理的工作项:
    // 即使失效项为 0，只要有候选，就必须创建/更新 Issue；仅两者都为 0 才允许自动关单。
    const allClear = Number(failedInfo.failed) === 0 && Number(candidateInfo.candidates) === 0;

    const title = `[自动维护] 汉化映射失效 ${failedInfo.failed} 项 / 未翻译候选 ${candidateInfo.candidates} 条 (GitHub Desktop 报告)`;
    const today = new Date().toISOString().slice(0, 10);
    const body = [
      `## 自动维护报告（${today}）`,
      '',
      '本 Issue 由自动维护工作流生成，用于提醒维护者关注汉化映射的健康度。',
      '',
      '> ⚠️ 此报告不直接修改 `localization.json`，请人工确认后处理。',
      '',
      '---',
      '',
      report,
      '',
      '---',
      `_由 [TuPigGHD2Chinese](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/workflows/tupigghd2chinese.yml) 自动生成_`,
    ].join('\n');

    // 正文超长防护: GitHub Issue body 上限 65536 字符, 超限会导致创建/更新失败(恰在最需要报告时丢失)
    // 截断按 code unit 计数(与 API 限制同口径), 但切点落在 UTF-16 代理对中间会产生孤立代理、
    // 致 GitHub API 422 拒绝(#143), 故切点为高位代理时回退一位按码点边界截断
    const MAX_BODY = 60000;
    let finalBody = body;
    if (body.length > MAX_BODY) {
      const lastUnit = body.charCodeAt(MAX_BODY - 1);
      const cut = (lastUnit >= 0xD800 && lastUnit <= 0xDBFF) ? MAX_BODY - 1 : MAX_BODY;
      finalBody = body.slice(0, cut) + '\n\n> ⚠️ 报告过长，已截断；完整内容见工作流日志。\n';
    }

    // 不按 label 过滤(#144): 旧单 label 被人工移除后, labels 过滤会漏查导致重复开单;
    // 改为列出 open issue 按标题前缀识别(该前缀仅本脚本使用, 误匹配面可控)
    // paginate 聚合全部页(#230): 只取首页时 open issue 超 100 条目标单漏检, 导致重复开单/漏关单
    const issues = await github.paginate(github.rest.issues.listForRepo, {
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'open',
      per_page: 100,
    });

    // 同类 Issue 去重: 选取最早的主单更新, 其余历史重复单关闭,
    // 避免“每次运行都新建一单”或历史 bug 留下的多单长期并存。
    const matches = issues
      .filter(i => i.title.startsWith('[自动维护]'))
      .sort((a, b) => a.number - b.number);
    const existing = matches[0];
    const duplicates = matches.slice(1);
    for (const dup of duplicates) {
      const mergedTitle = dup.title.endsWith('（已合并）') ? dup.title : `${dup.title}（已合并）`;
      await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: dup.number,
        state: 'closed',
        title: mergedTitle,
      });
      console.log(`已关闭重复 Issue #${dup.number}`);
    }

    if (allClear) {
      if (existing) {
        await github.rest.issues.update({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: existing.number,
          state: 'closed',
          title: title + '（已恢复）', // #230: 关单同步标题, 避免历史标题永久保留过期失效计数
          body: finalBody,
        });
        console.log(`已关闭 Issue #${existing.number}（无失效项且无未翻译候选）`);
      } else {
        console.log('无失效项且无未翻译候选，无需操作');
      }
      return;
    }

    if (existing) {
      await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: existing.number,
        title: title,
        body: finalBody,
      });
      console.log(`已更新 Issue #${existing.number}`);
    } else {
      const created = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: title,
        body: finalBody,
        labels: ['auto-maintain'],
      });
      console.log(`已创建 Issue #${created.data.number}`);
    }
  } catch (err) {
    core.setFailed(`创建或更新自动维护 Issue 失败: ${err.message}`);
  }
};

// #137: 纯函数单独导出供 tools/auto-maintain/test/tools-self-test.test.mjs 跨文件契约回归
module.exports.extractFailedCount = extractFailedCount;
module.exports.extractCandidateCount = extractCandidateCount;
