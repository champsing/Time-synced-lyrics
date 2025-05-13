import re
import json
import pandas as pd

translation_list = [
    "隨著命運的展開，就讓我們一同迎戰",
    "而考驗尚未結束，我們仍需直面黑暗",
    "穿過絕望的陰影",
    "在沉默中，我們共享希望",
    "只為追逐我們宣告中的理想",
    "我們曾嘗試多看一眼",
    "卻被無知蒙蔽了視線",
    "既然聽不懂他們的注解",
    "那就由我們找尋自己該走的路",
    "請注意！命運的車輪正在轉動",
    "跨過平原，穿過深谷",
    "向著黎明，這車輪行滾滾而行唱歌著",
    "一個無盡的夢！",
    "請注意！軌道已然在運轉",
    "穿過陰霾藏匿的平原",
    "我們奔跑，我們向前",
    "面對恐懼和困境我們依然堅守陣地",
    "歷久彌堅勝利定會在望",
    "我們已穿越風雨",
    "只希望能沐浴在真理的光芒之中",
    "掙脫枷鎖重獲新生",
    "請注意！命運的車輪正在轉動",
    "跨過平原，穿過深谷",
    "向著黎明，這車輪行滾滾而行唱歌著",
    "一個無盡的夢！",
    "請注意！軌道已然在運轉",
    "穿過陰霾藏匿的平原",
    "我們奔跑，我們向前",
    "抬起頭！跟著堅定的節奏",
    "終點已近在咫尺",
    "邁向我們的理想之地",
    "讓一切重見曙光",
    "請注意！命運的車輪正在唱歌",
    "他們保守著苦痛的秘密和私語",
    "而我們終將迎來希望",
    "掙脫束縛，我們在星空下追逐夢想",
    "面對神靈，我們團結一致，奮勇向前",
]

# CSV data as provided
g = open("./py_output/003_parse_kt_csv_to_json/input.csv", encoding="utf-8")
reader = pd.read_csv(g)

output = []
ti = 0  # translation index

print(translation_list)
# print(background_voices_list)

for index, row in reader.iterrows():
    start = row["Start"]
    # remove hours
    time_str = ":".join(start.split(":")[0:])
    text = row["Text"].strip()
    if text in ("interlude", "end"):
        output.append({"time": time_str, "type": text})
    else:
        # parse text for durations and phrases
        parts = re.findall(r"{\\k(\d+)}([^\\{]+)", text)
        text_list = [{"phrase": p, "duration": int(d)} for d, p in parts]
        obj = {
            "time": time_str,
            "text": text_list,
            "translation": translation_list[ti],
        }
        ti += 1
        output.append(obj)

# Save to a JSON file
with open(
    "./py_output/003_parse_kt_csv_to_json/output.json", "w", encoding="utf-8"
) as f:
    json.dump(output, f, ensure_ascii=False, indent=4)

print("Output successful.")
