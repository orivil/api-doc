<template>
    <div>
        <el-card class="box-card" shadow="hover">
            <div slot="header" class="clearfix">
                <span>Request 参数</span>
            </div>
            <div>
                <div v-if="ps && ps.length > 0">
                    <template v-for="(param, idx) in ps">
                        <div :key="idx">
                            <h3>参数来源: {{param.Type}}</h3>
                            <el-form label-width="250px" style="width: 100%" :rules="rules">
                                <el-form-item v-for="(field, fieldIdx) in param.Fields" :key="fieldIdx">
                                    <span slot="label">
                                        <span>{{field.Name}}</span>
                                        <span class="field-kind">{{field.Kind}}</span>
                                    </span>
                                    <template v-if="field.Kind==='string'">
                                        <el-input v-model="field.Value"></el-input>
                                    </template>
                                </el-form-item>
                            </el-form>
                        </div>
                    </template>
                </div>
                <span v-else>无任何参数</span>
            </div>
        </el-card>
    </div>
</template>

<script>
    export default {
        name: "params",
        props: ["params"],
        data(){
            return {
                rules: {},
            }
        },
        computed: {
            ps: {
                get() {
                    return this.params
                },
                set(v) {
                    this.$emit("update:params", v)
                }
            }
        },
        created() {
            if (this.params) {
                for (let param of this.params) {
                    for (let field of param.Fields) {
                        if (field.Condition) {
                            let c = field.Condition;
                            if (c.hasOwnProperty("Required")) {
                                this.addRule(field.Name, {
                                    required: true, validator: this.alwaysChecked,
                                });
                            }
                        }
                    }
                }
            }
        },
        methods:{
            addRule(field, rule) {
                if (!this.rules[field]) {
                    this.$set(this.rules, field, [])
                }
                this.rules[field].push(rule)
            },
            alwaysChecked(rule, value, callback) {
                callback()
            },
        },
    }
</script>

<style scoped>
    .field-kind {
        color: #aa55a1;
        font-size: 12px;
        line-height: 1;
        margin-left: 10px;
    }
</style>