import { App } from 'nativescript-vue';
import { registerElement } from 'nativescript-vue';

import { install, PersistentBottomSheet } from '@nativescript-community/ui-persistent-bottomsheet';
import CollectionViewPlugin from '@nativescript-community/ui-collectionview/vue3';

import Basic from './Basic.vue';

export function installPlugin(app: App) {
    install();

    // Vue 3 workaround: the plugin's /vue entry only supports the Vue 2 ~bottomSheet directive.
    // Re-register BottomSheet with nodeOps so that a child marked with
    // nodeRole="bottomSheet" is wired up as PersistentBottomSheet.bottomSheet.
    // TODO: move nodeOps into the plugin's vue/index.ts
    registerElement('BottomSheet', () => PersistentBottomSheet, {
        overwriteExisting: true,
        model: {
            prop: 'stepIndex',
            event: 'stepIndexChange',
        },
        nodeOps: {
            insert(child, parent, atIndex) {
                const parentView = parent.nativeView;
                const childView = child.nativeView;
                if (childView.nodeRole === 'bottomSheet') {
                    parentView.bottomSheet = childView;
                } else {
                    parentView.addChild(childView);
                }
            },
            remove(child, parent) {
                const parentView = parent.nativeView;
                const childView = child.nativeView;
                if (parentView.bottomSheet === childView) {
                    parentView.bottomSheet = null;
                } else {
                    parentView.removeChild(childView);
                }
            },
        },
    } as any);

    app.use(CollectionViewPlugin);
}

export const demos = [{ name: 'Basic', path: 'basic', component: Basic }];
