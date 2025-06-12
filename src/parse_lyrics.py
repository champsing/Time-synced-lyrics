import json


DEFAULT_DURATION = 100  # 厘秒单位，使用时需除以100转为秒


def parse_lyrics(json_mapping_content, current_song, song_duration):
    if not json_mapping_content:
        return []

    parsed_lyrics = []

    for line in json_mapping_content:
        # 处理时间格式转换 (mm:ss.ss → 秒)
        if "time" in line:
            time_match = line["time"].split(":")
            if len(time_match) == 2:
                minutes, seconds = time_match
                line["time"] = float(minutes) * 60 + float(seconds)

        # 处理背景人声 (background_voice)
        if "background_voice" in line:
            bg_voice = line["background_voice"]
            if "time" in bg_voice:
                bg_time_match = bg_voice["time"].split(":")
                if len(bg_time_match) == 2:
                    bg_minutes, bg_seconds = bg_time_match
                    bg_voice["time"] = float(bg_minutes) * 60 + float(bg_seconds)

            # 计算背景人声每个短语的持续时间和延迟
            bg_durations = []
            for phr in bg_voice["text"]:
                duration = phr.get("duration", 0) / 100  # 厘秒转秒
                if duration <= 0:  # 无效或缺失值处理
                    duration = (
                        current_song.get("default_phrase_duration", DEFAULT_DURATION)
                        / 100
                    )
                bg_durations.append(duration)
            bg_voice["duration"] = bg_durations

            # 计算延迟 (每个短语的起始偏移)
            bg_delays = []
            accumulated = 0.0
            for i in range(len(bg_durations)):
                bg_delays.append(accumulated)
                if i < len(bg_durations) - 1:
                    accumulated += bg_durations[i]
            bg_voice["delay"] = bg_delays

        # 处理特殊行类型
        if line.get("type") in ["interlude", "prelude"]:
            line["text"] = [{"phrase": "● ● ●", "duration": 0}]

        elif line.get("type") == "end":
            creator = (
                current_song.get("lyricist", "").strip()
                or current_song.get("artist", "").strip()
                or "未知的創作者"
            )
            line["text"] = [
                {
                    "phrase": f"創作者：{creator}",
                    "duration": song_duration - line["time"],
                }
            ]

        # 计算主歌词的持续时间和延迟
        if "text" in line:
            durations = []
            for phr in line["text"]:
                duration = phr.get("duration", 0) / 100  # 厘秒转秒
                if duration <= 0:  # 无效或缺失值处理
                    duration = DEFAULT_DURATION / 100
                durations.append(duration)
            line["duration"] = durations

            delays = []
            accumulated = 0.0
            for i in range(len(durations)):
                delays.append(accumulated)
                if i < len(durations) - 1:
                    accumulated += durations[i]
            line["delay"] = delays

        # 保留有效行
        if line.get("text"):
            parsed_lyrics.append(line)

    # 二次处理：计算间奏/前奏的持续时间
    for i in range(len(parsed_lyrics)):
        line = parsed_lyrics[i]
        if line.get("type") in ["interlude", "prelude"]:
            next_line = parsed_lyrics[i + 1] if i + 1 < len(parsed_lyrics) else None
            if next_line:
                interlude_duration = next_line["time"] - line["time"]
                line["duration"] = [interlude_duration]
                line["delay"] = [0.0]

    return parsed_lyrics
