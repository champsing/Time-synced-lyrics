import json
import os
import xml.etree.ElementTree as ET


def parse_time_to_seconds(time_str):
    """
    將時間字串（例如 "9.408"、"1:00.628" 或 "3:31.507"）轉換為浮點數秒數。
    支援多重冒號格式（H:MM:SS.mmm 或 MM:SS.mmm）。
    """
    if not time_str:
        return 0.0
    time_str = time_str.strip()
    if ":" in time_str:
        parts = time_str.split(":")
        seconds = 0.0
        for part in parts:
            seconds = seconds * 60 + float(part)
        return seconds
    else:
        return float(time_str)


def format_seconds_to_mmss_mm(seconds_float):
    """
    將浮點數秒數轉換為 JSON 需要的 MM:SS.mm 格式字串。
    """
    total_milliseconds = int(round(seconds_float * 1000))
    minutes = total_milliseconds // 60000
    seconds = (total_milliseconds % 60000) / 1000
    return f"{minutes:02d}:{seconds:05.2f}"


def calculate_duration_centiseconds(start_float, end_float):
    """
    計算時長，單位為 1/100 秒 (centiseconds)，保留一位小數。
    """
    duration_s = end_float - start_float
    duration_cs = duration_s * 100
    return round(duration_cs, 1)


def convert_xml_file_to_json(input_filename, output_filename):
    if not os.path.exists(input_filename):
        print(f"錯誤: 找不到輸入檔案 '{input_filename}'")
        return

    try:
        # 解析 XML 檔案
        tree = ET.parse(input_filename)
        root = tree.getroot()

    except Exception as e:
        print(f"解析 XML 時發生錯誤: {e}")
        return

    output_json = []

    # 1. 遍歷所有元素，尋找本地名稱為 'p' 的標籤（自動相容所有命名空間）
    for p_tag in root.iter():
        p_local_name = p_tag.tag.split("}")[-1]
        if p_local_name != "p":
            continue

        begin_time_str = p_tag.get("begin")
        if not begin_time_str:
            continue

        start_seconds = parse_time_to_seconds(begin_time_str)
        text_array = []

        # 2. 使用 iter() 深度優先遍歷 p 標籤下的所有子孫元素
        # 這樣可以完美捕捉到嵌套在 <span ttm:role="x-bg"> 內部的真正歌詞 span
        for span_tag in p_tag.iter():
            span_local_name = span_tag.tag.split("}")[-1]
            if span_local_name != "span":
                continue

            span_begin_str = span_tag.get("begin")
            span_end_str = span_tag.get("end")

            # 只有帶有時間軸屬性的 span 才是我們需要的精確短語
            if span_begin_str and span_end_str:
                phrase = span_tag.text if span_tag.text is not None else ""
                phrase = phrase.strip()  # 清除 XML 縮排產生的空白換行

                span_start_seconds = parse_time_to_seconds(span_begin_str)
                span_end_seconds = parse_time_to_seconds(span_end_str)

                duration_val = calculate_duration_centiseconds(
                    span_start_seconds, span_end_seconds
                )

                text_array.append({"phrase": phrase, "duration": duration_val})

        if text_array:
            entry = {
                "time": format_seconds_to_mmss_mm(start_seconds),
                "text": text_array,
                "translation": "",
            }
            output_json.append(entry)

    # 3. 寫入輸出 JSON
    try:
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(output_json, f, ensure_ascii=False, indent=4)
        print(f"轉換完成！已將結果寫入 '{output_filename}'")
    except Exception as e:
        print(f"寫入 JSON 檔案時發生錯誤: {e}")


# --- 主程式執行區 ---
if __name__ == "__main__":
    TSL_FOLDER = os.path.dirname(os.path.dirname(__file__))
    INPUT_FILE = os.path.join(TSL_FOLDER, "py_output", "009_xml_to_json", "input.xml")
    OUTPUT_FILE = os.path.join(
        TSL_FOLDER, "py_output", "009_xml_to_json", "output.json"
    )

    convert_xml_file_to_json(INPUT_FILE, OUTPUT_FILE)
