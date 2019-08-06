<template>
    <el-submenu :index="tag.index">
        <template slot="title">{{tag.Name}}</template>
        <template v-for="(subTag, idx) in tag.Subs">
            <el-menu-item v-if="!subTag.Subs" :key="idx" :index="subTag.index">{{subTag.Name}}</el-menu-item>
            <multi-menu v-else  :key="idx" :tag="subTag"></multi-menu>
        </template>
    </el-submenu>
</template>

<script>
    export default {
        name: "multi-menu",
        props:["tag"],
    }
</script>

<style scoped>

</style>