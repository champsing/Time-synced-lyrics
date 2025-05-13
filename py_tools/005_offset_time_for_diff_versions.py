import json

# 读取 JSON 文件
with open(
    "./py_output/005_offset_time_for_diff_versions/input.json", encoding="utf-8"
) as f:
    json_data = json.load(f)

output = []

time_offset = -8


def parse_time_format_to_second(time_format):
    """
    將 'MM:SS.ss' 或 'HH:MM:SS.ss' 的時間格式轉換為秒數（浮點數）
    例如：
    '01:02.22' => 62.22
    '00:59.00' => 59.0
    '1:02:03.5' => 3723.5
    """
    parts = time_format.strip().split(":")
    parts = [float(p) for p in parts]

    # 支援 HH:MM:SS、MM:SS、SS
    if len(parts) == 3:
        hours, minutes, seconds = parts
        return hours * 3600 + minutes * 60 + seconds
    elif len(parts) == 2:
        minutes, seconds = parts
        return minutes * 60 + seconds
    elif len(parts) == 1:
        return parts[0]
    else:
        raise ValueError(f"不支援的時間格式: {time_format}")

def format_seconds_to_time(seconds, show_hours=False):
    """
    將浮點數秒數轉換成 'MM:SS.ss' 或 'HH:MM:SS.ss' 格式的字串
    - seconds: 例如 62.22
    - show_hours: 若為 True，則會顯示 HH:MM:SS.ss（即使小於 1 小時）

    例：
    62.22 => '01:02.22'
    3723.5 => '1:02:03.50'
    """
    if seconds < 0:
        raise ValueError("時間不能為負數")

    total_seconds = float(seconds)
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    secs = total_seconds % 60  # 保留小數

    if show_hours or hours > 0:
        return f"{hours}:{minutes:02}:{secs:05.2f}"
    else:
        return f"{minutes:02}:{secs:05.2f}"

for item in json_data:
    obj = item
    time_in_seconds = parse_time_format_to_second(item["time"])
    time_in_seconds += time_offset
    new_time = format_seconds_to_time(time_in_seconds)
    obj["time"] = new_time
    output.append(obj)


# 写入输出文件
with open(
    "./py_output/005_offset_time_for_diff_versions/output.json", "w", encoding="utf-8"
) as f:
    json.dump(output, f, ensure_ascii=False, indent=4)

print("Output successful.")
