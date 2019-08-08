<template>
    <div>
        <el-card class="box-card toggle-body-card" :class="showBody?'':'closed'" shadow="hover">
            <div slot="header" class="toggle-body-header" @click="showBody=!showBody">
                <i :class="showBody?'el-icon-minus':'el-icon-plus'"></i>
                <span>响应数据</span>
            </div>
            <div v-if="showBody">
                <div v-if="resps">
                    <el-table
                            :data="resps"
                            style="width: 100%">
                        <el-table-column
                                align="center"
                                label="Code"
                                width="100">
                            <template slot-scope="scope">
                                <span class="response-code">{{scope.row.Code?scope.row.Code:200}}</span>
                            </template>
                        </el-table-column>
                        <el-table-column
                                align="center"
                                label="Header"
                                width="400">
                            <template slot-scope="scope">
                                <div style="display: flex;align-items: center;width: 100%">
                                    <div style="width: 90%;display: flex;flex-direction: column;justify-content: center;overflow: auto">
                                        <div style="margin: 20px;text-align: center">
                                            <pre v-html="marshal_body(scope.row.Headers)"></pre>
                                        </div>
                                        <div class="desc" v-html="marked(scope.row.Desciption)"></div>
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column
                                align="center"
                                label="Body">
                            <template slot-scope="scope">
                                <pre v-if="isHtmlBody(scope.row.Body)" v-text="scope.row.Body" class="response-body"></pre>
                                <pre v-else v-html="marshal_body(scope.row.Body)" class="response-body"></pre>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <div v-else>
                    <span class="desc">无任何响应</span>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
    export default {
        name: "responses",
        props:["resps"],
        data(){
            return {
                showBody: true,
            }
        },
        methods: {
            isHtmlBody(body) {
                if(typeof body === "string") {
                    if(body.startsWith("<")) {
                        return true
                    }
                }
                return false
            }
        }
    }
</script>

<style scoped>

</style>