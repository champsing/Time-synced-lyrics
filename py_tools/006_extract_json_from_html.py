from bs4 import BeautifulSoup
import json
import os

html_path = os.path.join("karaoke mappings", "gift", "gift.html")

try:
    with open(html_path, "r", encoding="utf-8") as html:
        html_content = html.read()  # read html
        soup = BeautifulSoup(html_content, "html.parser")
        result = []
except FileNotFoundError:
    print(f"Error：Document {html_path} doesn't exist")
except Exception as e:
    print(f"Error occurred：{str(e)}")

# traverse every lyrics-display-synced-line element
for line in soup.find_all("lyrics-display-synced-line"):
    text_entry = {"time": "", "text": [], "translation": ""}

    # Find every syllable element
    for syllable in line.find_all("span", class_="syllable"):
        phrase = syllable["data-content"]
        duration = int(syllable["data-duration"]) / 10

        # build phrase object
        syllable_obj = {"phrase": phrase, "duration": duration}

        # check if emphasized
        if "emphasis" in syllable.get("class", []):
            syllable_obj["kiai"] = True

        text_entry["text"].append(syllable_obj)

    result.append(text_entry)

# write output.json
with open(
    "./py_output/006_extract_json_from_html/output.json", "w", encoding="utf-8"
) as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Output successful.")
