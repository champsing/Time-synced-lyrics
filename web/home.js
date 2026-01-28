import { createApp } from "vue";

// // 動畫指令
// const observer = new IntersectionObserver(
//     (entries) => {
//         entries.forEach((entry) => {
//             const intersecting = entry.isIntersecting;
//             if (intersecting)
//                 entry.target.classList.add("animate-scroll-trigger");
//             console.log(entry.intersectionRatio);
//         });
//     },
//     { threshold: [0, 0.25, 0.5, 0.75, 1] }
// ); // 元素露出10%時觸發

// observer.observe(document.getElementById("card"));

const Card = {
    template: `

`,
};

const app = createApp({
    components: {
        card: Card,
    },
});

app.mount("#app");
