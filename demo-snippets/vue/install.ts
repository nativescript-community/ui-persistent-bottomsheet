import Vue from 'nativescript-vue';

import { install } from '@nativescript-community/ui-persistent-bottomsheet';
import BottomSheetPlugin from '@nativescript-community/ui-persistent-bottomsheet/vue';

import Basic from './Basic.vue';

export function installPlugin() {
    Vue.use(BottomSheetPlugin);
    install();
}

export const demos = [{ name: 'Basic', path: 'basic', component: Basic }];
