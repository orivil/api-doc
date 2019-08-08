import Vue from 'vue'
import './plugins/axios'
import './plugins/marshal'
import App from './App.vue'
import './plugins/element.js'
import './assets/css/local.css'

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
