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
                                <div style="width: 100%;display: flex;justify-content: space-between">
                                    <div>
                                        <span class="method">{{request.method}}</span>
                                        <span class="url">{{request.url}}</span>
                                    </div>
                                    <span style="margin-right: 20px">{{request.costTime}}</span>
                                </div>
                            </template>
                            <div style="padding: 20px">
                                <div v-if="request.headers||request.data">
                                    <h3>请求数据: </h3>
                                    <el-table
                                            :data="[request]"
                                            style="width: 100%">
                                        <el-table-column
                                                label="Header">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.headers)" class="header-body"></pre>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                label="Queries">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.params)" class="data-body"></pre>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                label="Data">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.form)" class="data-body"></pre>
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
                                                label="Code"
                                                width="100">
                                            <template slot-scope="scope">
                                                <span class="response-code">{{scope.row.code?scope.row.code:200}}</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                v-if="request.response.headers.middleware"
                                                width="100">
                                            <template slot="header">
                                                <span>中间件</span>
                                                <el-tooltip class="item" effect="dark" content="用于提示响应具体来源于哪一个中间件" placement="top">
                                                    <i class="el-icon-question"></i>
                                                </el-tooltip>
                                            </template>
                                            <template slot-scope="scope">
                                                <slot name="middleware" :data="scope.row.headers.middleware"></slot>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                label="Header">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.headers)" class="header-body"></pre>
                                            </template>
                                        </el-table-column>
                                        <el-table-column
                                                label="Body">
                                            <template slot-scope="scope">
                                                <pre v-html="marshal_body(scope.row.data)" class="data-body"></pre>
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
                // headers["Content-Type"] = this.action.ContentType;
                let queries = this.initParams(params, "query");
                let form = this.initParams(params, "form");
                let data = this.initFormData(form);
                let request = {
                    method: this.action.Method,
                    url: url,
                    form: form,
                    data: data,
                    headers: headers,
                    params: queries,
                    paramsSerializer: function (params) {
                        return qs.stringify(params,{arrayFormat: 'brackets'})
                    },
                };
                let startTime = new Date().getTime();
                this.$axios(request).then(resp=> {
                    this.successCallback();
                    request.response = resp;
                    request.costTime = (new Date().getTime() - startTime) + "ms";
                    this.requests.splice(0, 0, request);
                    this.activeName = "0";
                }).catch((error) => {
                    if (error.response) {
                        request.response = error.response;
                    } else {
                        this.$message.warning(error.message);
                    }
                    request.costTime = (new Date().getTime() - startTime) + "ms";
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
                if(this.action.ContentType === "multipart/form-data") {
                    let events = []; // 保留上传文件 input, 用于在上传成功时清除所选数据
                    let formData = new FormData();
                    for (let field in form) {
                        let v = form[field];
                        if (v && v.target && v.target.files) {
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
                    return formData;
                } else {
                    return qs.stringify(form)
                }
            }
        },
    }
</script>

<style scoped>
    .execute-container{
        display: inline-block;
        float: right;
    }
    .method {
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
</style>