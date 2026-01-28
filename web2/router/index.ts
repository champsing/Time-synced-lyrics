import {
    createRouter,
    createWebHistory,
    type RouteRecordSingleView,
} from "vue-router";

const routes: Array<RouteRecordSingleView> = [
    {
        path: "/",
        name: "Home",
        component: () => import("../components/Home.vue"),
    },
    {
        path: "/select",
        name: "SongSelect",
        component: () => import("../components/SongSelect.vue"),
    },
    {
        path: "/player/:id?", // id 設為選填，兼容你原本的 query 邏輯
        name: "Player",
        component: () => import("../components/Player.vue"),
        props: (route) => ({
            songId: route.query.song,
            version: route.query.version,
        }),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
