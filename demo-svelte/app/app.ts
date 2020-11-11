/*
In NativeScript, the app.ts file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

import { svelteNative } from 'svelte-native';
import { registerNativeViewElement } from 'svelte-native/dom';
import App from './App.svelte';

import { install } from '@nativescript-community/ui-persistent-bottomsheet';
install();

import DrawerElement from '@nativescript-community/ui-persistent-bottomsheet/svelte';
DrawerElement.register();
import CollectionViewElement from '@nativescript-community/ui-collectionview/svelte';
CollectionViewElement.register();
registerNativeViewElement('cartomap', () => require('@nativescript-community/ui-carto/ui').CartoMap);
svelteNative(App, {});
