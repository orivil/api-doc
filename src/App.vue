<template>
    <div>
        <el-container>
            <el-header style="padding: 0">
                <el-menu mode="horizontal" background-color="#333a">
                    <div style="height: 60px;display: inline-flex;justify-content: center;align-items: center;margin-left: 30px">
                        <h3 style="color: white;display: inline-block;margin: 0;padding: 0">API 技术文档</h3>
                    </div>
                    <el-menu-item  style="float: right">
                        <el-button v-if="!token" type="success" @click="signInDialogVisible=true">登录</el-button>
                        <el-button v-if="token" type="warning" @click="logout">退出</el-button>
                    </el-menu-item>
                    <el-menu-item style="float: right">
                        <el-form :inline="true">
                            <el-autocomplete
                                    v-model="addr"
                                    clearable
                                    @clear="clearAddr"
                                    style="width: 720px"
                                    :fetch-suggestions="fetchHistories"
                                    placeholder="请输入内容"
                                    @select="getData">
                                <el-button slot="append" icon="el-icon-search" @click="getData"></el-button>
                            </el-autocomplete>
                        </el-form>
                    </el-menu-item>
                </el-menu>
            </el-header>
            <el-container>
                <el-aside width="200px">
                    <div id="aside-container" v-if="ready">
                        <el-menu id="menus" v-if="doc && doc.Tags" @select="selectMenu">
                            <template v-for="(tag, idx) in doc.Tags">
                                <multi-menu v-if="tag.Subs" :key="idx" :tag="tag"></multi-menu>
                                <el-menu-item v-else :key="idx" :index="tag.ID+''">
                                    <span slot="title">{{tag.Name}}</span>
                                </el-menu-item>
                            </template>
                            <el-menu-item index="middleware">
                                <span slot="title">中间件</span>
                            </el-menu-item>
                        </el-menu>
                    </div>
                </el-aside>
                <el-main>
                    <div id="main-container" v-if="ready">
                        <div>
                            <template v-if="rootTags.length > 0 && doc && doc.Actions">
                                <template v-for="(tag, tagKey) in rootTags">
                                    <div :id="tag.ID" :key="'id-' + tagKey" class="controller-container">
                                        <h1 class="tag-title">{{tag.Name}}</h1>
                                        <p>{{tag.Desc}}</p>
                                        <div v-if="tag.actions && tag.actions.length === 0">
                                            <p>暂无接口</p>
                                        </div>
                                        <template v-else>
                                            <el-collapse>
                                                <el-collapse-item v-for="(act, actIdx) in tag.actions"
                                                                  :key="tagKey+'-'+actIdx">
                                                    <template slot="title">
                                                        <template>
                                                            <div style="width:100%;display: flex;justify-content: space-between">
                                                                <div>
                                                                    <el-tag :type="tagType(act.Method)" class="route-method">
                                                                        {{act.Method}}
                                                                    </el-tag>
                                                                    <span class="route">{{act.Route}}</span>
                                                                    <span class="desc">{{act.Name}}</span>
                                                                </div>
                                                                <div>
                                                                    <el-tag v-for="(middle, mIdx) in act.Middles"
                                                                            :type="activeMiddle===middle+''?'warning':'info'"
                                                                            :key="tagKey+'-'+actIdx+'-'+mIdx"
                                                                            class="middle-name" @click.stop="clickMiddle(middle+'')">
                                                                        {{getSortName(doc.Middles[middle].Name)}}
                                                                    </el-tag>
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </template>
                                                    <div class="toggle-container">
                                                        <span class="desc" style="font-weight: bold">TRACE:</span> <span class="desc">{{act.Trace}}</span>
                                                    </div>
                                                    <div class="toggle-container">
                                                        <params :params="act.Params"></params>
                                                    </div>
                                                    <div class="toggle-container">
                                                        <responses :resps="act.Responses"></responses>
                                                    </div>
                                                    <div class="toggle-container">
                                                        <executes :token="token" :action="act" :middles="getMiddles(act.Middles)">
                                                            <template slot="middleware" slot-scope="mid">
                                                                <el-tag :type="activeMiddle===mid.data+''?'warning':'info'"
                                                                        class="middle-name" @click.stop="clickMiddle(mid.data+'')">
                                                                    {{getSortName(doc.Middles[mid.data].Name)}}
                                                                </el-tag>
                                                            </template>
                                                        </executes>
                                                    </div>
                                                </el-collapse-item>
                                            </el-collapse>
                                        </template>
                                    </div>
                                </template>
                            </template>
                        </div>
                        <div id="middleware">
                            <template>
                                <div class="controller-container">
                                    <h1 class="tag-title">中间件</h1>
                                    <div v-if="doc && doc.Middles">
                                        <el-collapse>
                                            <el-collapse-item v-for="(middle, midIdx) in doc.Middles" :key="midIdx">
                                                <template slot="title">
                                                    <template>
                                                        <el-tag class="middle-name"
                                                            :type="activeMiddle===midIdx+''?'warning':'info'"
                                                            @click.stop="clickMiddle(midIdx+'')">
                                                            {{getSortName(middle.Name)}}
                                                        </el-tag>
                                                        <span class="desc">{{middle.Desc}}</span>
                                                    </template>
                                                </template>
                                                <div class="toggle-container">
                                                    <params :params.sync="middle.Params"></params>
                                                </div>
                                                <div class="toggle-container">
                                                    <responses :resps="middle.Responses"></responses>
                                                </div>
                                            </el-collapse-item>
                                        </el-collapse>
                                    </div>
                                    <template v-else>
                                        <p>暂无中间件</p>
                                    </template>
                                </div>
                            </template>
                        </div>
                    </div>
                </el-main>
            </el-container>
        </el-container>
        <el-dialog
                title="设置 token"
                :visible.sync="signInDialogVisible"
                width="30%">
            <el-form>
                <el-form-item>
                    <el-input v-model="dialogToken" placeholder="Authorization Token"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="signInDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="login">登录</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
    import multiMenu from "@/components/multi-menu"
    import params from "@/components/params"
    import responses from "@/components/responses"
    import executes from "@/components/executes"
    import {getToken, setToken, removeToken} from './utils/auth'
    export default {
        name: 'app',
        components: {
            "multi-menu": multiMenu,
            "params": params,
            "responses": responses,
            "executes": executes,
        },
        data() {
            return {
                addr: "",
                activeAddr: "",
                doc: null,
                rootTags: [],
                ready: false,
                activeMiddle:"",
                token: getToken()||"",
                dialogToken: getToken()||"",
                signInDialogVisible: false
            }
        },
        watch:{
            // 监听数据地址，修改 axios 插件数据请求域名
            addr(val, oldVal){
                let m = val.match(/^http[s]*:\/\/[^/]+/);
                this.$axios.defaults.baseURL = m ? m[0] : "";
            },
        },
        methods: {
            login(){
                this.token = this.dialogToken;
                setToken(this.token);
                this.signInDialogVisible = false
            },
            logout(){
                this.token='';
                removeToken()
            },
            tagType(method) {
                switch (method) {
                    case "GET":
                        return "success";
                    case "POST":
                        return "";
                    case "PUT":
                        return "warning";
                    case "DELETE":
                        return "danger";
                    default:
                        return "info"
                }
            },
            clearAddr() {
                let addrs = this.getLocalAddrs();
                for (let idx = 0, ln = addrs.length; idx < ln; idx++) {
                    if (addrs[idx] === this.activeAddr) {
                        addrs.splice(idx, 1);
                        localStorage.setItem("addrs", addrs.join(","))
                    }
                }
            },
            getLocalAddrs() {
                let addrs = localStorage.getItem("addrs");
                if (addrs) {
                    addrs = addrs.split(",");
                } else {
                    addrs = []
                }
                return addrs
            },
            fetchHistories(queryString, cb) {
                let addrs = this.getLocalAddrs();
                let results = queryString ? addrs.filter((addr) => {
                    return (addr.toLowerCase().indexOf(queryString.toLowerCase()) === 0);
                }) : addrs;
                let res = [];
                for (let addr of results) {
                    res.push({
                        value: addr
                    })
                }
                cb(res);
            },
            getData() {
                this.ready = false;
                // Object.assign(this.$data, initData());
                let addrs = this.getLocalAddrs();
                for (let idx = 0, ln = addrs.length; idx < ln; idx++) {
                    if (addrs[idx] === this.addr) {
                        addrs.splice(idx, 1);
                    }
                }
                addrs.splice(0, 0, this.addr);
                localStorage.setItem("addrs", addrs.join(","));
                this.activeAddr = this.addr;
                this.$axios.get(this.addr).then((resp) => {
                    if (resp && resp.data) {
                        let data = resp.data;
                        if (data.Actions) {
                            let rootTags = this.initTags(data.Actions, data.Tags, null);
                            this.doc = data;
                            this.rootTags = rootTags;
                            this.ready = true;
                        }
                    }
                })
            },
            selectMenu(index, path) {
                location.href = "#" + index;
            },
            initTags(actions, tags) {
                let rootTags = [];
                for (let idx = 0, ln = tags.length; idx < ln; idx++) {
                    let tagID = tags[idx].ID;
                    let tag = tags[idx];
                    if (tag.Subs) {
                        rootTags = rootTags.concat(this.initTags(actions, tag.Subs))
                    } else {
                        let tagActs = actions[tagID];
                        tag.actions = tagActs ? tagActs : [];
                        rootTags.push(tag)
                    }
                }
                return rootTags
            },
            getSortName(name) {
                let strs = name.split("|");
                let title = "";
                for(let str of strs) {
                    let matches = str.match(/\b(\w)/g);
                    if (matches) {
                        let acronym = matches.join('');
                        title += acronym.toUpperCase();
                    } else {
                        title += str
                    }
                    title += "|"
                }
                title = title.substring(0, title.lastIndexOf('|'));
                return title
            },
            clickMiddle(middle){
                if(this.activeMiddle===middle) {
                    this.activeMiddle = ""
                } else {
                    this.activeMiddle = middle
                }
            },
            getMiddles(middleNames) {
                let middles = [];
                if(middleNames) {
                    for (let middle of middleNames) {
                        middles.push(this.doc.Middles[middle])
                    }
                }
                return middles
            }
        }
    }
</script>

<style>
    .el-header {
        /*background-color: #64d163;*/
        /*color: #333;*/
        /*line-height: 60px;*/
    }

    .el-aside {
        color: #333;
    }

    #menus {
        border-right: none;
    }

    body {
        margin: 0;
    }

    #main-container {
        position: absolute;
        top: 60px;
        left: 250px;
        bottom: 0;
        overflow: auto;
        right: 0;
        padding: 20px;
    }

    #aside-container {
        position: absolute;
        left: 0;
        top: 60px;
        width: 250px;
        overflow: scroll;
        border-right: solid 1px #e6e6e6;
        bottom: 0;
    }

    .route-method {
        width: 80px;
        text-align: center;
        font-weight: bold;
    }

    .route {
        margin-left: 20px;
        font-weight: bold;
        white-space: nowrap;
    }

    .middle-name {
        text-align: center;
        margin: 0 10px;
        font-weight: bold;
        cursor: pointer;
    }
    .desc {
        margin-left: 20px;
        color: #707371;
    }
    .controller-container {
        margin: 20px;
    }
    .tag-title {
        margin: 60px 0 20px 0;
    }
    .toggle-container{
        padding: 10px;
    }
</style>
