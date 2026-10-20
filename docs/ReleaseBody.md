### 修复与更新 / Fixes & Updates

#### 版本更新日志 / Changelog:

<!--
按 docs/CONTRIBUTING.md「发布说明」规则追加变更行：一行中文 + 一行对应英文，
行尾标注下一个发布版本的全角括号标记；
未预置时 CI 自动从提交历史提取兜底。
-->


### 程序说明 / Program Notes  
1. 可以仅下载二进制程序,双击运行后自动汉化  
   You can simply download the binary and double-click to run it — the UI is localized automatically.
2. 如果运行提示出错,可重试或下载[此JSON文件](https://github.com/Tupig/TuPigGHD2Chinese/blob/main/json/localization.json)后放在同目录后运行二进制程序  
   If the program reports an error, retry, or download [this JSON file](https://github.com/Tupig/TuPigGHD2Chinese/blob/main/json/localization.json), put it in the same directory as the binary and run again.
3. **若使用GitHub 仓库作为json文件源，请升级加载器到最新版本**  
   **If you use the GitHub repository as the JSON file source, please upgrade the loader to the latest version.**
4. `TuPigGHD2Chinese.exe` 为 64 位 Windows 程序，不再提供 32 位版本；Release 页同时提供 macOS 分架构二进制（`macos-x64` / `macos-arm64`）与 Linux x64 版本  
   `TuPigGHD2Chinese.exe` is a 64-bit Windows program; 32-bit builds are no longer provided. The Release page also ships per-architecture macOS binaries (`macos-x64` / `macos-arm64`) and a Linux x64 build.
5. 如果汉化后主程序无法打开，请更新加载器后执行参数 `TuPigGHD2Chinese.exe dev --translationfrombak`
   If GitHub Desktop fails to open after localization, update the loader and run it with `TuPigGHD2Chinese.exe dev --translationfrombak`.
