import BottomSheetElement from '@nativescript-community/ui-persistent-bottomsheet/svelte';
import { install } from '@nativescript-community/ui-persistent-bottomsheet';

import Basic from './Basic.svelte';

export function installPlugin() {
    BottomSheetElement.register();
    install();
}

export const demos = [{ name: 'Basic', path: 'basic', component: Basic }];
