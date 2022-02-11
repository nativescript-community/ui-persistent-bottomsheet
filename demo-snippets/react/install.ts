import { Basic } from './Basic';
import { install } from '@nativescript-community/ui-persistent-bottomsheet';
import { registerDrawer } from '@nativescript-community/ui-persistent-bottomsheet/react';

export function installPlugin() {
    install();
    registerDrawer();
}

export const demos = [
    { name: 'Basic', path: 'basic', component: Basic },
];
