import Vue from 'nativescript-vue';
import App from './components/App.vue';

import { install } from '@nativescript-community/ui-persistent-bottomsheet';
install();

import DrawerPlugin from '@nativescript-community/ui-persistent-bottomsheet/vue';
Vue.use(DrawerPlugin);

Vue.config.silent = true;
// Vue.config.silent = (TNS_ENV === 'production')

new Vue({
    render: h => h('frame', [h(App)]),
}).$start();
