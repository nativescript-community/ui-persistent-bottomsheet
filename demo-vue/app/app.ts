import CartoPlugin from '@nativescript-community/ui-carto/vue';
import CollectionView from '@nativescript-community/ui-collectionview/vue';
import { install } from '@nativescript-community/ui-persistent-bottomsheet';
import PBSPlugin from '@nativescript-community/ui-persistent-bottomsheet/vue';
import Vue from 'nativescript-vue';
import App from './components/App.vue';

install();

Vue.use(PBSPlugin);
Vue.use(CollectionView);
Vue.use(CartoPlugin);

Vue.config.silent = true;
// Vue.config.silent = (TNS_ENV === 'production')

new Vue({
    render: h => h('frame', [h(App)]),
}).$start();
