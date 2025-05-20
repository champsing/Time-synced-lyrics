import re
import json

def parse_lrc_times(lrc_content):
    time_pattern = re.compile(r'\[(\d{2}:\d{2}\.\d{2})\]')
    return [time_pattern.search(line).group(1) for line in lrc_content if time_pattern.search(line)]

def update_json_with_lrc(json_data, lrc_times):
    print(len(json_data), len(lrc_times))
    if len(json_data) != len(lrc_times):
        raise ValueError("JSON line count doesn't match lrc line count")
    for entry, lrc_time in zip(json_data, lrc_times):
        entry["time"] = lrc_time
    return json_data

def main():
    with open('py_output/007_fill_time_into_json/input.lrc', 'r', encoding='utf-8') as f:
        lrc_lines = f.readlines()
    lrc_times = parse_lrc_times(lrc_lines)

    with open('py_output/007_fill_time_into_json/input.json', 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    updated_json = update_json_with_lrc(json_data, lrc_times)

    with open('py_output/007_fill_time_into_json/output.json', 'w', encoding='utf-8') as f:
        json.dump(updated_json, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()