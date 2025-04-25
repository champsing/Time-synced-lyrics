export const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const scrollToLineIndex = (index) => {
  const currentLineId = document.getElementById(index);
  currentLineId?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};

export const parseLyrics = (jsonMappingContent, currentSong) => {
  if (!jsonMappingContent) return [];

  return jsonMappingContent.map((line) => {
    const timeMatch = line.time.match(/(\d+):(\d+\.\d+)/);
    if (timeMatch) {
      const [_, mm, ss] = timeMatch;
      line.time = parseFloat(mm) * 60 + parseFloat(ss);
    }

    if (!line.pace) line.pace = [currentSong.value.default_elapse_speed || DEFAULT_ELAPSE_SPEED];
    
    if (line.type === "interlude") line.text = ["● ● ●"];
    if (line.type === "end") {
      line.text = [`作者：${currentSong.value.lyricist?.trim() || ''}`];
      line.pace = [1000];
    }

    return {
      ...line,
      text: Array.isArray(line.text) ? line.text : [line.text]
    };
  }).filter(line => line && line.text);
};