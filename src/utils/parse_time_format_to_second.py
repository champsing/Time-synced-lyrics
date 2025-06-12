def parse_time_format_to_second(time_format):
    """
    將 'MM:SS.ss' 的時間格式轉換為秒數（浮點數）
    例如：
    '01:02.22' => 62.22
    '00:59.00' => 59.0
    """
    parts = time_format.strip().split(":")
    parts = [float(p) for p in parts]

    # 支援 MM:SS、SS
    if len(parts) == 2:
        minutes, seconds = parts
        return minutes * 60 + seconds
    elif len(parts) == 1:
        return parts[0]
    else:
        raise ValueError(f"不支援的時間格式: {time_format}")