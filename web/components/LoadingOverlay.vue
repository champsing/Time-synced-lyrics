<template>
    <div
        id="loading-overlay"
        class="col-span-full text-center py-8 fixed inset-0 z-9999 bg-black/80 flex items-center justify-center flex-col"
    >
        <svg
            class="w-16 h-16 mb-6 animate-spin text-teal-400"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
            />
            <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
            />
        </svg>

        <div class="flex space-x-2 text-white text-3xl font-bold">
            <span class="animate-bounce [animation-delay:50ms]">L</span>
            <span class="animate-bounce [animation-delay:100ms]">O</span>
            <span class="animate-bounce [animation-delay:150ms]">A</span>
            <span class="animate-bounce [animation-delay:200ms]">D</span>
            <span class="animate-bounce [animation-delay:250ms]">I</span>
            <span class="animate-bounce [animation-delay:300ms]">N</span>
            <span class="animate-bounce [animation-delay:350ms]">G</span>
        </div>

        <div class="flex space-x-1 mt-4">
            <div
                class="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0ms]"
            />
            <div
                class="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:150ms]"
            />
            <div
                class="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:300ms]"
            />
        </div>
    </div>
</template>
