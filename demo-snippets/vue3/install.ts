import { App } from 'nativescript-vue';

import { install } from '@nativescript-community/ui-persistent-bottomsheet';
import BottomSheetPlugin from '@nativescript-community/ui-persistent-bottomsheet/vue3';
import CollectionViewPlugin from '@nativescript-community/ui-collectionview/vue3';

import Basic from './Basic.vue';

export function installPlugin(app: App) {
    install();

    app.use(BottomSheetPlugin);
    app.use(CollectionViewPlugin);
}

export const demos = [{ name: 'Basic', path: 'basic', component: Basic }];
