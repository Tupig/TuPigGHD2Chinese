#ifndef UTILS_LOCALIZATION_STATE_HPP
#define UTILS_LOCALIZATION_STATE_HPP

// 已汉化状态判定（自 src/TuPigGHD2Chinese.cpp 抽出，便于单元测试）：
//   判断目标 main.js / renderer.js 是否已是汉化后的中文内容。
//
// 背景：用户对已汉化文件再次运行时，英文→中文映射会全部匹配不到（日志显示 0 命中），
// 容易被误判为映射失效。程序应在替换前提示使用 --translationfrombak 或 --rollback。
//
// 判定规则：统计 UTF-8 文本中的 CJK 统一表意文字数量，达到阈值即视为已汉化。
//   - 只覆盖 U+4E00–U+9FFF（UTF-8 三字节，首字节 0xE4–0xE9），
//     足够区分英文原文与中文译文；不引入外部依赖。

#include <cstddef>
#include <string>

namespace utils {

inline auto CountCjkChars(const std::string& text) -> std::size_t {
    std::size_t count = 0;
    for(std::size_t i = 0; i + 2 < text.size(); ++i) {
        const auto b0 = static_cast<unsigned char>(text[i]);
        const auto b1 = static_cast<unsigned char>(text[i + 1]);
        const auto b2 = static_cast<unsigned char>(text[i + 2]);
        if(b0 >= 0xE4 && b0 <= 0xE9 &&
           (b1 & 0xC0) == 0x80 &&
           (b2 & 0xC0) == 0x80) {
            ++count;
            i += 2;
        }
    }
    return count;
}

inline auto LooksAlreadyLocalized(const std::string& text, std::size_t threshold = 10) -> bool {
    return CountCjkChars(text) >= threshold;
}

} // namespace utils

#endif // !UTILS_LOCALIZATION_STATE_HPP
