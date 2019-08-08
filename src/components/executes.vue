<template>
    <div>
        <el-card class="box-card toggle-body-card" :class="showBody?'':'closed'" shadow="hover">
            <div slot="header" class="toggle-body-header" @click="showBody=!showBody">
                <i :class="showBody?'el-icon-minus':'el-icon-plus'"></i>
                <span>测试数据</span>
                <div class="execute-container">
                    <el-button type="success execute-button" size="mini" @click.stop="execute">执 行</el-button>
                    <el-button type="warning execute-button" size="mini" v-if="requests.length>0" @click.stop="clear">清 除</el-button>
                </div>
            </div>
            <div v-if="showBody">
                <el-collapse v-model="activeName">
                    <template v-for="(request, idx) in requests">
                        <el-collapse-item :name="idx+''" :class="request.method" :key="idx">
                            <template slot="title">
                                <div class="request-title">
                                    <h4 style="margin: 0">
                                        <span class="method">{{request.method}}</span>
                                    </h4>
                                </div>
                            </template>
                            <div style="padding: 20px">
                                <div>
                                    <h3>URL</h3>
                                    <span class="url">{{request.url}}</span>
                                </div>
                                <div v-if="request.headers||request.data">
                                    <h3>请求数据: </h3>
                                    <el-table
                                            :data="[request]"
                                            style="width: 100%">
                                        <el-table-column
                                                align="center"
                                                label="Header"
                                                width="700">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.headers)" class="header-body"></pre>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                align="center"
                                                label="Body">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.data)" class="response-body"></pre>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </div>
                                <div>
                                    <h3>响应数据: </h3>
                                    <el-table
                                            :data="[request.response]"
                                            style="width: 100%">
                                        <el-table-column
                                                align="center"
                                                label="Code"
                                                width="100">
                                            <template slot-scope="scope">
                                                <span class="response-code">{{scope.row.code?scope.row.code:200}}</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                align="center"
                                                label="Header"
                                                width="600">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.headers)" class="header-body"></pre>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                align="center"
                                                label="Body">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.data)" class="response-body"></pre>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </div>
                            </div>
                        </el-collapse-item>
                    </template>
                </el-collapse>
            </div>
        </el-card>
    </div>
</template>

<script>
    import qs from "qs";
    export default {
        name: "executes",
        props:["action", "middles"],
        data(){
            return {
                showBody: true,
                requests:[],
                successCallback: Function,
                activeName:"",
            }
        },
        methods: {
            clear(){
                this.requests = [];
            },
            execute(){
                let params = this.action.Params;
                params = params?params:[];
                for(let middle of this.middles) {
                    if(middle.Params) {
                        params = params.concat(middle.Params)
                    }
                }
                let url = this.action.Route;
                let paths = this.initParams(params, "path");
                for (let field in paths) {
                    url = url.replace("{" + field + "}", paths[field])
                }
                let headers = this.initParams(params, "header");
                let queries = this.initParams(params, "query");
                let form = this.initFormData(this.initParams(params, "form"));
                let request = {
                    method: this.action.Method,
                    url: url,
                    data: form,
                    headers: headers,
                    params: queries,
                    paramsSerializer: function (params) {
                        return qs.stringify(params,{arrayFormat: 'brackets'})
                    },
                    start: new Date(),
                };
                this.$axios(request).then(resp=> {
                    this.successCallback();
                    request.response = resp;
                    request.end = new Date();
                    this.requests.splice(0, 0, request);
                    this.activeName = "0";
                }).catch((error) => {
                    if (error.response) {
                        request.response = error.response;
                    } else {
                        this.$message.warning(error.message);
                    }
                    request.end = new Date();
                    this.requests.splice(0, 0, request);
                    this.activeName = "0";
                });
            },
            initParams(params, kind) {
                let ps = {};
                for(let param of params) {
                    if(param.Type === kind) {
                        for(let field of param.Fields) {
                            ps[field.Name] = field.Value
                        }
                    }
                }
                return ps
            },
            initFormData(form) {
                let data = form;
                if(this.action.ContentType === "multipart/form-data") {
                    let events = []; // 保留上传文件 input, 用于在上传成功时清除所选数据
                    let formData = new FormData();
                    for (let field in form) {
                        let v = form[field];
                        if (!!v && !!v.target && !!v.target.files) {
                            let ln = v.target.files.length;
                            form[field] = [];
                            for (let i = 0; i < ln; i++) {
                                let file = v.target.files[i];
                                formData.append(field, file, file.name);
                                form[field].push(file.name);
                            }
                            events.push(v);
                        } else {
                            if (Array.isArray(v)) {
                                for (let i = 0, ln = v.length; i < ln; i++) {
                                    formData.append(field, v[i])
                                }
                            } else {
                                formData.append(field, v)
                            }
                        }
                    }
                    this.successCallback = function() {
                        for (let i = 0, ln = events.length; i < ln; i++) {
                            events[i].target.value = '';
                        }
                    };
                    data = formData;
                }
                return data
            }
        },
    }
</script>

<style scoped>
    .execute-container{
        display: inline-block;
        float: right;
    }
    .request-title .method {
        display: inline-block;
        margin-right: 20px;
        width: 80px;
        height: 30px;
        font-weight: bold;
        font-size: 14px;
        line-height: 30px;
        text-align: center;
        border: 1px solid #d6d6d6;
        border-radius: 4px;
    }
    .request-title .url {
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap
    }
    .response-code{
        color: #12560d;
    }
    .response-header{
        color: #333356;
    }
    .response-body{
        margin: 0;
        border-radius: 5px;
        padding: 20px;
        text-align: left;
        color: #f6f6f6;
        background-color: #464646;
    }
    .header-body{
        margin: 0;
        border-radius: 5px;
        padding: 20px;
        text-align: left;
        color: #0f0f0f;
        background-color: #f8f8f8;
    }
</style>