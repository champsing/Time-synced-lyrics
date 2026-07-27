<template>
    <div
        id="loading-overlay"
        class="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 backdrop-blur-sm p-4 transition-opacity duration-300"
        :class="{ 'opacity-0 pointer-events-none': !isLoading }"
    >
        <!-- 1. Logo 區域 -->
        <div class="relative mb-12 flex items-center justify-center">
            <!-- 擴散波紋動畫 (Pulsing Ripple) -->
            <div
                class="absolute inset-0 scale-150 animate-pulse-ripple rounded-full bg-teal-400 opacity-20"
            ></div>
            <div
                class="absolute inset-0 scale-125 animate-pulse-ripple rounded-full bg-yellow-400 opacity-10 [animation-delay:200ms]"
            ></div>

            <!-- 您的網頁 Logo (使用附件圖片) -->
            <img
                src="/og_image/music.webp"
                alt="Web Logo"
                class="relative z-10 w-24 h-24 sm:w-32 sm:h-32 object-contain"
            />
        </div>

        <!-- 2. 進度條與百分比區域 -->
        <div class="w-full max-w-sm flex flex-col items-center">
            <!-- 進度條軌道 -->
            <div
                class="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3 shadow-inner"
            >
                <!-- 進度條填充 (使用漸層色和光暈) -->
                <div
                    class="h-full rounded-full bg-gradient-to-r from-teal-400 to-yellow-400 shadow-glow transition-all duration-150 ease-out"
                    :style="{ width: `${loadingPercentage}%` }"
                ></div>
            </div>

            <!-- 3. 文字資訊 (百分比) -->
            <div class="flex items-baseline space-x-2 text-white font-medium">
                <span class="text-xs uppercase tracking-widest text-gray-400"
                    >Loading</span
                >
                <span class="text-3xl font-bold tabular-nums"
                    >{{ loadingPercentage }}%</span
                >
            </div>
        </div>
    </div>
</template>

<script>
// 這是一個 Vue.js 示例，您需要自行控制 isLoading 和 loadingPercentage 變量
export default {
    data() {
        return {
            isLoading: true, // 控制 Loading 頁面顯示/隱藏
            loadingPercentage: 0, // 進度百分比 (0-100)
        };
    },
    mounted() {
        // 模擬短時間載入過程 (例如 1.5 秒完成)
        this.startLoadingSimulation();
    },
    methods: {
        startLoadingSimulation() {
            const interval = setInterval(() => {
                if (this.loadingPercentage < 100) {
                    // 快速且平滑地增加進度
                    this.loadingPercentage +=
                        Math.floor(Math.random() * 10) + 5;
                    if (this.loadingPercentage > 100)
                        this.loadingPercentage = 100;
                } else {
                    clearInterval(interval);
                    // 載入完成後，延遲一小段時間再隱藏，讓用戶看完 100% 狀態
                    setTimeout(() => {
                        this.isLoading = false;
                    }, 300);
                }
            }, 80); // 每 80ms 更新一次進度
        },
    },
};
</script>

<style scoped>
/* 自定義 CSS (Tailwind 不包含的) */

/* 擴散波紋動畫 */
@keyframes pulse-ripple {
    0% {
        transform: scale(0.8);
        opacity: 0.5;
    }
    100% {
        transform: scale(1.8);
        opacity: 0;
    }
}

.animate-pulse-ripple {
    animation: pulse-ripple 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* 進度條光暈效果 */
.shadow-glow {
    box-shadow:
        0 0 10px rgba(74, 222, 128, 0.6),
        0 0 20px rgba(250, 204, 21, 0.4);
}
</style>
