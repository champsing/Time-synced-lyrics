from bs4 import BeautifulSoup
import json
import os

html_path = os.path.join("karaoke mappings", "tenbyouno uta", "tenbyouno uta.html")

try:
    with open(html_path, "r", encoding="utf-8") as html:
        html_content = html.read()  # read html
        soup = BeautifulSoup(html_content, "html.parser")
        result = []
except FileNotFoundError:
    print(f"Error：Document {html_path} doesn't exist")
    exit()
except Exception as e:
    print(f"Error occurred：{str(e)}")
    exit()

# 遍历每个歌词行
for line in soup.find_all("amp-lyrics-display-synced-line"):
    text_entry = {"time": "", "text": [], "translation": ""}
    
    # 检查整行是否为空或无效
    if not line.find("span", class_="syllable"):
        continue
        
    # 遍历行内的每个音节
    for syllable in line.find_all("span", class_="syllable"):
        # 检查音节是否在bidi-supplementary元素内
        bidi_parent = syllable.find_parent(class_="bidi-supplementary")
        if bidi_parent:
            # 忽略bidi-supplementary中的音节
            continue
            
        phrase = syllable["data-content"]
        duration = int(syllable["data-duration"]) / 10

        # 创建音节对象
        syllable_obj = {"phrase": phrase, "duration": duration}

        # 检查是否强调
        if "emphasis" in syllable.get("class", []):
            syllable_obj["kiai"] = True

        text_entry["text"].append(syllable_obj)
    
    # 如果行内有有效音节才添加到结果
    if text_entry["text"]:
        result.append(text_entry)

# 写入输出文件
output_dir = "./py_output/006_extract_json_from_html"
os.makedirs(output_dir, exist_ok=True)

with open(os.path.join(output_dir, "output.json"), "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Output successful.")