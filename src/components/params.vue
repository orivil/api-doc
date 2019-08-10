<template>
    <div>
        <el-card class="box-card toggle-body-card" :class="showBody?'':'closed'" shadow="hover">
            <div slot="header" class="toggle-body-header" @click="showBody=!showBody">
                <i :class="showBody?'el-icon-minus':'el-icon-plus'"></i>
                <span>请求参数</span>
            </div>
            <div v-if="showBody">
                <div v-if="ps && ps.length > 0">
                    <template v-for="(param, idx) in ps">
                        <div :key="idx">
                            <h3>参数来源: {{param.Type}}</h3>
                            <el-form label-width="250px" style="width: 100%" :rules="rules">
                                <el-form-item v-for="(field, fieldIdx) in param.Fields" :key="fieldIdx"
                                              :prop="field.Name">
                                    <span slot="label">
                                        <span>{{field.Name}}</span>
                                        <span class="field-kind">{{field.Kind}}</span>
                                    </span>
                                    <template v-if="field.input_type==='time'">
                                        <el-input v-model="field.Value" class="param-input"></el-input>
                                    </template>
                                    <template v-else-if="field.input_type==='file'">
                                        <input @change="field.Value=$event" type="file" multiple="multiple" class="param-input"></input>
                                    </template>
                                    <template v-else-if="field.input_type==='common'">
                                        <el-input v-model="field.Value" class="param-input"></el-input>
                                    </template>
                                    <template v-else-if="field.input_type==='bool'">
                                        <el-switch v-model="field.Value"></el-switch>
                                    </template>
                                    <template v-else-if="field.input_type==='slice'">
                                        <slice-input :slice.sync="field.Value" class="param-input" placeholder="以 , 号串联数组"></slice-input>
                                    </template>
                                    <el-button type="text" v-if="field.Condition" @click="openDialog(field.Condition)" class="param-desc">验证数据</el-button>
                                    <span class="param-desc">{{field.Desc}}</span>
                                </el-form-item>
                            </el-form>
                        </div>
                    </template>
                </div>
                <span v-else>无任何参数</span>
            </div>
        </el-card>
        <el-dialog
                title="后端验证器数据"
                :visible.sync="dialogVisible"
                width="60%">
            <pre v-html="marshal_body(condition)" class="json-container"></pre>
        </el-dialog>
    </div>
</template>

<script>
    import sliceInput from "@/components/slice-input"
    export default {
        name: "params",
        components:{
            "slice-input": sliceInput,
        },
        props: ["params"],
        data() {
            return {
                rules: {},
                dialogVisible: false,
                showBody: true,
                condition: null,
            }
        },
        computed: {
            ps: {
                get() {
                    return this.params
                },
                set(ps) {
                    this.$emit("update:params", ps)
                }
            }
        },
        created() {
            if (this.ps) {
                for (let param of this.ps) {
                    for (let field of param.Fields) {
                        if (field.Condition) {
                            let c = field.Condition;
                            if (c.hasOwnProperty("Required")) {
                                this.addRule(field.Name, {
                                    required: true, validator: this.alwaysChecked,
                                });
                            }
                        }
                        field.input_type = this.inputType(field.Kind);
                    }
                }
            }
        },
        methods: {
            changeSliceField(field) {
                field.Value = field.slice?field.slice.split(","):[]
            },
            addRule(field, rule) {
                if (!this.rules[field]) {
                    this.$set(this.rules, field, [])
                }
                this.rules[field].push(rule)
            },
            alwaysChecked(rule, value, callback) {
                callback()
            },
            openDialog(condition) {
                this.condition = condition;
                this.dialogVisible = true;
            },
            inputType(kind) {
                switch (kind) {
                    case "bool":
                    case "time":
                    case "file":
                    case "invalid":
                        return kind;
                    case "string":
                    case "int":
                    case "int32":
                    case "int64":
                    case "float32":
                    case "float64":
                        return "common";
                    case "[]string":
                    case "[]int":
                    case "[]int32":
                    case "[]int64":
                    case "[]float32":
                    case "[]float64":
                    case "[]bool":
                        return "slice";
                    default:
                        return "invalid";
                }
            }
        },
    }
</script>

<style>
    .field-kind {
        color: #aa55a1;
        font-size: 12px;
        line-height: 1;
        margin-left: 10px;
    }
</style>