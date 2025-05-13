import json

# 读取 JSON 文件
with open("./py_output/004_extract_translation_and_bgv/input.json", encoding="utf-8") as f:
    json_data = json.load(f)

output = []

for item in json_data:
    # 检查是否存在 'type' 键且值为指定类型
    if "type" in item and item["type"] in ("interlude", "end"):
        obj = {"type": item["type"]}
    elif "background_voice" in item:
        # 当 'type' 不存在时提取其他字段
        obj = {
            "translation": item["translation"],
            "background_voice": item["background_voice"]
        }
    else:
        obj = {
            "translation": item["translation"],
        }
    output.append(obj)

# 写入输出文件
with open(
    "./py_output/004_extract_translation_and_bgv/output.json", "w", encoding="utf-8"
) as f:
    json.dump(output, f, ensure_ascii=False, indent=4)

print("Output successful.")
