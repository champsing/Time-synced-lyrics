DEFAULT_DURATION = 100  # 厘秒，使用時除以100轉換為秒


def parse_lyrics(json_mapping_content, current_song, song_duration):
    if not json_mapping_content:
        return []

    parsed_lyrics = []

    for line in json_mapping_content:
        # 處理時間格式轉換 (mm:ss.ss → 秒)
        if "time" in line:
            time_match = line["time"].split(":")
            if len(time_match) == 2:
                minutes, seconds = time_match
                line["time"] = float(minutes) * 60 + float(seconds)

        # 處理背景人聲 (background_voice)
        if "background_voice" in line:
            bg_voice = line["background_voice"]
            if "time" in bg_voice:
                bg_time_match = bg_voice["time"].split(":")
                if len(bg_time_match) == 2:
                    bg_minutes, bg_seconds = bg_time_match
                    bg_voice["time"] = float(bg_minutes) * 60 + float(bg_seconds)

            # 計算背景人聲每個短語的持續時間和延遲
            bg_durations = []
            for phr in bg_voice["text"]:
                duration = phr.get("duration", 0) / 100  # 厘秒轉秒
                if duration <= 0:  # 無效或缺失值處理
                    duration = (
                        current_song.get("default_phrase_duration", DEFAULT_DURATION)
                        / 100
                    )
                bg_durations.append(duration)
            bg_voice["duration"] = bg_durations

            # 計算延遲 (每個短語的起始偏移)
            bg_delays = []
            accumulated = 0.0
            for i in range(len(bg_durations)):
                bg_delays.append(accumulated)
                if i < len(bg_durations) - 1:
                    accumulated += bg_durations[i]
            bg_voice["delay"] = bg_delays

        # 處理特殊行類型
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

        # 計算主歌詞的持續時間和延遲
        if "text" in line:
            durations = []
            for phr in line["text"]:
                duration = phr.get("duration", 0) / 100  # 厘秒轉秒
                if duration <= 0:  # 無效或缺失值處理
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

    # 二次處理：計算間奏/前奏的持續時間
    for i in range(len(parsed_lyrics)):
        line = parsed_lyrics[i]
        if line.get("type") in ["interlude", "prelude"]:
            next_line = parsed_lyrics[i + 1] if i + 1 < len(parsed_lyrics) else None
            if next_line:
                interlude_duration = next_line["time"] - line["time"]
                line["duration"] = [interlude_duration]
                line["delay"] = [0.0]

    return parsed_lyrics
