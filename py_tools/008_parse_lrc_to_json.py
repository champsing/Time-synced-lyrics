import re
import json

import pandas as pd


def lrc_to_json(lrc_text):
    result = []
    lines = lrc_text.strip().split("\n")

    for line in lines:
        # 解析時間標籤
        time_match = re.match(r"\[(\d{2}):(\d{2})\.(\d{2})\](.*)", line)
        if not time_match:
            continue

        minutes, seconds, hundredths = time_match.groups()[:3]
        time_str = f"{minutes}:{seconds}.{hundredths}"
        content = time_match.group(4).strip()

        # 處理特殊行 (prelude/interlude/end)
        if re.match(r"^(prelude|interlude|end)\b", content, re.IGNORECASE):
            # 提取特殊行類型
            special_type = (
                re.match(r"^(prelude|interlude|end)\b", content, re.IGNORECASE)
                .group(0)
                .lower()
            )

            # 檢查是否有括號內容
            bracket_match = re.search(r"\((.*?)\)", content)
            if bracket_match:
                # 處理括號內的文本
                bracket_content = bracket_match.group(1)
                phrases = [p.strip() for p in bracket_content.split("|") if p.strip()]
                text_list = [{"phrase": p, "duration": 0} for p in phrases]

                result.append(
                    {
                        "time": time_str,
                        "type": special_type,
                        "background_voice": {"time": time_str, "text": text_list},
                    }
                )
            else:
                # 沒有括號內容
                result.append({"time": time_str, "type": special_type})
        else:
            # 處理普通行
            # 檢查是否有括號內容
            bracket_match = re.search(r"\((.*?)\)", content)
            if bracket_match:
                # 處理括號內的文本
                main_content = content.replace(bracket_match.group(0), "")
                phrases = [p for p in main_content.split("|")]
                text_list = [{"phrase": p, "duration": 0} for p in phrases]
                bracket_content = bracket_match.group(1)
                bg_phrases = [p for p in bracket_content.split("|")]
                bg_text_list = [{"phrase": p, "duration": 0} for p in bg_phrases]
                result.append(
                    {
                        "time": time_str,
                        "text": text_list,
                        "background_voice": {"time": time_str, "text": bg_text_list},
                    }
                )

            else:

                phrases = [p for p in content.split("|")]
                text_list = [{"phrase": p, "duration": 0} for p in phrases]
                result.append(
                    {
                        "time": time_str,
                        "text": text_list,
                    }
                )

    return result


# CSV data as provided
with open("./py_output/008_parse_lrc_to_json/input.txt", encoding="utf-8") as g:
    reader = g.read()

# 轉換為JSON
json_output = lrc_to_json(reader)

# 輸出結果
with open("py_output/008_parse_lrc_to_json/output.json", "w", encoding="utf-8") as f:
    json.dump(json_output, f, ensure_ascii=False, indent=2)
