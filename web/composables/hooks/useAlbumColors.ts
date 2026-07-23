import { ref, watch } from "vue";

export interface AlbumGradient {
    gradient: string;
    dominant: string;
    palette: string[];
}

/**
 * 從專輯封面提取主色並生成深色漸層背景
 * Extract dominant colors from album art and generate a dark gradient
 */
export function useAlbumColors(imageUrl: () => string | undefined) {
    const colors = ref<AlbumGradient>({
        gradient:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        dominant: "#1a1a2e",
        palette: ["#1a1a2e", "#16213e", "#0f3460"],
    });

    async function extractColors(url: string): Promise<AlbumGradient> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const sampleSize = 50;
                    canvas.width = sampleSize;
                    canvas.height = sampleSize;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) throw new Error("No canvas context");

                    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
                    const imageData = ctx.getImageData(
                        0,
                        0,
                        sampleSize,
                        sampleSize,
                    );
                    const pixels = imageData.data;

                    // 收集量化後的顏色並計數
                    const colorCounts = new Map<string, number>();

                    for (let i = 0; i < pixels.length; i += 4) {
                        const r = pixels[i]!;
                        const g = pixels[i + 1]!;
                        const b = pixels[i + 2]!;
                        const a = pixels[i + 3]!;
                        if (a < 128) continue; // 跳過透明像素

                        // 量化至 32 級以減少顏色數量
                        const qr = Math.round(r / 32) * 32;
                        const qg = Math.round(g / 32) * 32;
                        const qb = Math.round(b / 32) * 32;
                        const key = `${qr},${qg},${qb}`;
                        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
                    }

                    // 按出現次數排序，取前 5 個主色
                    const sorted = [...colorCounts.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);

                    const palette: string[] = sorted.map(([key]) => {
                        const [r, g, b] = key.split(",").map(Number);
                        return `rgb(${r},${g},${b})`;
                    });

                    if (palette.length === 0) {
                        // 無有效像素時回退
                        resolve({
                            gradient:
                                "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                            dominant: "#1a1a2e",
                            palette: ["#1a1a2e", "#16213e", "#0f3460"],
                        });
                        return;
                    }

                    // 根據主色計算深色版本用於背景漸層
                    const dark1 = darkenHex(palette[0]!, 0.25);
                    const dark2 = darkenHex(palette[1] || palette[0]!, 0.2);
                    const dark3 = darkenHex(palette[2] || palette[0]!, 0.3);

                    const gradient = `linear-gradient(135deg, ${dark1} 0%, ${dark2} 50%, ${dark3} 100%)`;
                    const dominant = dark1;

                    resolve({ gradient, dominant, palette });
                } catch {
                    // Canvas 操作失敗時回退
                    resolve({
                        gradient:
                            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                        dominant: "#1a1a2e",
                        palette: ["#1a1a2e", "#16213e", "#0f3460"],
                    });
                }
            };

            img.onerror = () => {
                resolve({
                    gradient:
                        "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    dominant: "#1a1a2e",
                    palette: ["#1a1a2e", "#16213e", "#0f3460"],
                });
            };

            img.src = url;
        });
    }

    /** 將 rgb(r,g,b) 轉換為 hex 並調暗 */
    function darkenHex(rgb: string, factor: number): string {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return rgb;
        const r = Math.round(Number(match[1]) * factor);
        const g = Math.round(Number(match[2]) * factor);
        const b = Math.round(Number(match[3]) * factor);
        return `rgb(${r},${g},${b})`;
    }

    // 監聽圖片 URL 變更，自動提取顏色
    watch(
        imageUrl,
        async (url) => {
            if (url) {
                colors.value = await extractColors(url);
            }
        },
        { immediate: true },
    );

    return { colors };
}
