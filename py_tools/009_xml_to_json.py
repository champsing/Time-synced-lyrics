import xml.etree.ElementTree as ET
import json
import re
import os

def parse_time_to_seconds(time_str):
    """
    將時間字串（例如 "9.408" 或 "1:00.628"）轉換為浮點數秒數。
    """
    if not time_str:
        return 0.0
    if ':' in time_str:
        # 格式 M:SS.mmm
        parts = time_str.split(':')
        minutes = int(parts[0])
        seconds = float(parts[1])
        return minutes * 60 + seconds
    else:
        # 格式 S.mmm
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
        # 直接解析檔案，不需要手動 read() 和 wrapped_content
        tree = ET.parse(input_filename)
        root = tree.getroot()
    except Exception as e:
        print(f"解析 XML 時發生錯誤: {e}")
        return

    # 定義命名空間映射
    # 因為你的 XML 有 xmlns="http://www.w3.org/ns/ttml"
    ns = {'tt': 'http://www.w3.org/ns/ttml'}

    output_json = []

    # 3. 提取資料 - 使用命名空間前綴
    # 這裡的 'tt:p' 會對應到 XML 裡的 <p>
    for p_tag in root.findall('.//tt:p', ns):
        begin_time_str = p_tag.get('begin')
        
        if not begin_time_str:
            continue
            
        start_seconds = parse_time_to_seconds(begin_time_str)
        text_array = []
        
        # 遍歷 span，同樣要加上命名空間
        for span_tag in p_tag.findall('tt:span', ns):
            phrase = span_tag.text if span_tag.text is not None else ""
            
            span_begin_str = span_tag.get('begin')
            span_end_str = span_tag.get('end')
            
            if span_begin_str and span_end_str:
                span_start_seconds = parse_time_to_seconds(span_begin_str)
                span_end_seconds = parse_time_to_seconds(span_end_str)
                
                duration_val = calculate_duration_centiseconds(span_start_seconds, span_end_seconds)
                
                text_array.append({
                    "phrase": phrase,
                    "duration": duration_val
                })

        if text_array:
            entry = {
                "time": format_seconds_to_mmss_mm(start_seconds),
                "text": text_array,
                "translation": ""
            }
            output_json.append(entry)

    # 4. 寫入輸出
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(output_json, f, ensure_ascii=False, indent=4)
        print(f"轉換完成！已將結果寫入 '{output_filename}'")
    except Exception as e:
        print(f"寫入 JSON 檔案時發生錯誤: {e}")

# --- 主程式執行區 ---
if __name__ == "__main__":
    INPUT_FILE = os.path.join(os.path.dirname(__file__), 'py_output', '009_xml_to_json', 'input.xml')
    OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'py_output', '009_xml_to_json', 'output.json')
    
    convert_xml_file_to_json(INPUT_FILE, OUTPUT_FILE)