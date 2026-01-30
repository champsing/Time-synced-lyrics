import Home from "@components/home/Home.vue";
import Player from "@components/player/Player.vue";
import SongSelect from "@components/song_select/SongSelect.vue";
import {
    createRouter,
    createWebHistory,
    type RouteRecordSingleView,
} from "vue-router";

const routes: Array<RouteRecordSingleView> = [
    {
        path: "/",
        name: "Home",
        component: Home,
    },
    {
        path: "/songs",
        name: "SongSelect",
        component: SongSelect,
    },
    {
        path: "/player/:id?", // id 設為選填，兼容你原本的 query 邏輯
        name: "Player",
        component: Player,
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
