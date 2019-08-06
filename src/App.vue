<template>
  <div>
    <el-container>
      <el-header style="text-align: right; font-size: 12px">
        <el-form :inline="true">
<!--            <el-form-item>-->
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
<!--            </el-form-item>-->
        </el-form>
<!--          <el-dropdown>-->
<!--            <i class="el-icon-setting" style="margin-right: 15px"></i>-->
<!--            <el-dropdown-menu slot="dropdown">-->
<!--              <el-dropdown-item>查看</el-dropdown-item>-->
<!--              <el-dropdown-item>新增</el-dropdown-item>-->
<!--              <el-dropdown-item>删除</el-dropdown-item>-->
<!--            </el-dropdown-menu>-->
<!--          </el-dropdown>-->
<!--          <span>王小虎</span>-->
      </el-header>
      <el-container>
        <el-aside width="200px" style="background-color: rgb(238, 241, 246)">
          <el-menu v-if="doc && doc.Tags" @select="selectMenu">
            <template v-for="(tag, idx) in doc.Tags">
              <multi-menu v-if="tag.Subs" :key="idx" :tag="tag"></multi-menu>
              <el-menu-item v-else :key="idx" :index="tag.index">
                <span slot="title">{{tag.Name}}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </el-aside>
        <el-main>
          <template v-if="doc&&doc.Actions">
            <div v-for="(acts, key) in doc.Actions" :key="key" :id="key">
              <div v-for="(act, actIdx) in acts" :key="key + '-' + actIdx" style="margin: 720px 0">
                <h1>{{act.Name}}</h1>
              </div>
            </div>
          </template>
<!--          <el-table :data="tableData">-->
<!--            <el-table-column prop="date" label="日期" width="140">-->
<!--            </el-table-column>-->
<!--            <el-table-column prop="name" label="姓名" width="120">-->
<!--            </el-table-column>-->
<!--            <el-table-column prop="address" label="地址">-->
<!--            </el-table-column>-->
<!--          </el-table>-->
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import multiMenu from "@/components/multi-menu"
export default {
  name: 'app',
  components: {
    "multi-menu": multiMenu,
  },
  data() {
    return {
      addr:"",
      activeAddr:"",
      doc:null,
      tags:[],
    }
  },
  methods:{
    clearAddr() {
      let addrs = this.getLocalAddrs();
      for(let idx=0, ln=addrs.length; idx<ln; idx++) {
        if(addrs[idx] === this.activeAddr) {
          addrs.splice(idx, 1);
          localStorage.setItem("addrs", addrs.join(","))
        }
      }
    },
    getLocalAddrs() {
      let addrs = localStorage.getItem("addrs");
      if(addrs) {
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
      for(let addr of results) {
        res.push({
          value: addr
        })
      }
      cb(res);
    },
    getData() {
      let addrs = this.getLocalAddrs();
      for(let idx=0, ln=addrs.length; idx<ln; idx++) {
        if(addrs[idx] === this.addr) {
          addrs.splice(idx, 1);
        }
      }
      addrs.splice(0, 0, this.addr);
      localStorage.setItem("addrs", addrs.join(","));
      this.activeAddr = this.addr;
      this.$axios.get(this.addr).then((resp)=>{
          if(resp && resp.data) {
              let data = resp.data;
              if(data.doc){
                this.initTagIndex(data.doc.Tags, null);
                this.doc = data.doc;
              }
          }
      })
    },
    selectMenu(index, path) {
      location.href = "#" + this.tags[index].ID;
    },
    initTagIndex(tags, depth) {
      for(let idx=0, ln=tags.length; idx<ln; idx++) {
        let index =  depth?(depth + '-' + (idx + 1)):(idx + 1 + "");
        tags[idx].index = index;
        this.tags[index] = tags[idx];
        if(tags[idx].Subs) {
          this.initTagIndex(tags[idx].Subs, index)
        }
      }
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
  body{
    margin: 0;
  }
</style>
