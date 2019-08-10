<template>
    <el-input v-model="value"></el-input>
</template>

<script>
    export default {
        name: "slice-input",
        props: ["slice"],
        computed:{
            value:{
                get() {
                    let str = "";
                    if(this.slice) {
                        str = this.slice.join(",");
                    }
                    return str
                },
                set(v) {
                    let arr = v?v.split(","):[];
                    this.$emit("update:slice", arr)
                }
            }
        }
    }
</script>

<style scoped>

</style>