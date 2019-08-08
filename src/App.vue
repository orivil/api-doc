<template>
    <div>
        <el-container>
            <el-header style="text-align: right; font-size: 12px">
                <el-form :inline="true">
                    <el-autocomplete
                            class="inline-input"
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
                                                            <el-tag :type="tagType(act.Method)" class="route-method">
                                                                {{act.Method}}
                                                            </el-tag>
                                                            <span class="route">{{act.Route}}</span>
                                                            <div style="width: 100%">
                                                                <el-tag v-for="(middle, mIdx) in act.Middles"
                                                                        :type="activeMiddle===middle+''?'warning':'info'"
                                                                        :key="tagKey+'-'+actIdx+'-'+mIdx"
                                                                        class="middle-name right" @click.stop="clickMiddle(middle+'')">
                                                                    {{getSortName(doc.Middles[middle].Name)}}
                                                                </el-tag>
                                                            </div>
                                                        </template>
                                                    </template>
                                                    <div class="toggle-container">
                                                        <params :params="act.Params"></params>
                                                    </div>
                                                    <div class="toggle-container">
                                                        <responses :resps="act.Responses"></responses>
                                                    </div>
                                                    <div class="toggle-container">
                                                        <executes :action="act" :middles="getMiddles(act.Middles)"></executes>
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
                                                        <span class="middle-desc">{{middle.Desc}}</span>
                                                    </template>
                                                </template>
                                                <div class="toggle-container">
                                                    <params :params="middle.Params"></params>
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
    </div>
</template>

<script>
    import multiMenu from "@/components/multi-menu"
    import params from "@/components/params"
    import responses from "@/components/responses"
    import executes from "@/components/executes"

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
            }
        },
        watch:{
            addr(val, oldVal){//普通的watch监听
                let m = val.match(/^http[s]*:\/\/[^/]+/);
                this.$axios.defaults.baseURL = m ? m[0] : "";
            },
        },
        methods: {
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
                        if (data.doc) {
                            this.initTags(data.doc.Actions, data.doc.Tags, null);
                            this.doc = data.doc;
                            this.ready = true;
                        }
                    }
                })
            },
            selectMenu(index, path) {
                location.href = "#" + index;
            },
            initTags(actions, tags) {
                for (let idx = 0, ln = tags.length; idx < ln; idx++) {
                    let tagID = tags[idx].ID;
                    let tag = tags[idx];
                    if (tag.Subs) {
                        this.initTags(actions, tag.Subs)
                    } else {
                        let tagActs = actions[tagID];
                        tag.actions = tagActs ? tagActs : [];
                        this.rootTags.push(tag)
                    }
                }
            },
            getSortName(name) {
                let matches = name.match(/\b(\w)/g);
                if (matches) {
                    let acronym = matches.join('');
                    return acronym.toUpperCase();
                } else {
                    return name
                }
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
                for(let middle of middleNames) {
                    middles.push(this.doc.Middles[middle])
                }
                return middles
            }
        }
    }
</script>

<style>
    .el-header {
        background-color: #B3C0D1;
        color: #333;
        line-height: 60px;
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
        left: 200px;
        bottom: 0;
        overflow: auto;
        right: 0;
        padding: 20px;
    }

    #aside-container {
        position: absolute;
        left: 0;
        top: 60px;
        width: 200px;
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
    }

    .middle-desc {
        margin-left: 20px;
        color: #707371;
    }

    .controller-container {
        margin: 20px;
    }

    .right {
        float: right;
    }

    .tag-title {
        margin: 60px 0 20px 0;
    }
    .toggle-container{
        padding: 10px;
    }
</style>
