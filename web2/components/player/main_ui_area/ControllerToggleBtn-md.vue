<template>
    <div class="hidden md:flex flex-row">
        <button
            class="rounded-2xl bg-gray-500 outline-black outline-2"
            id="controller-panel-switch-md"
            aria_label="顯示或隱藏控制介面"
            title="顯示或隱藏控制介面"
        >
            <div class="flex flex-row p-1">
                <div
                    class="material-icons p-2 select-none"
                    id="controller-panel-switch-icon-md"
                >
                    keyboard_arrow_down
                </div>
                <div id="controller-panel-switch-state-md" class="mt-2 px-2">
                    CLOSE
                </div>
            </div>
        </button>
    </div>
</template>
