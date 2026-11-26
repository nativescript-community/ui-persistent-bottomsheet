// Svelte 5 binding, for @nativescript-community/svelte-native >= 5. The Svelte 4 one is in ../svelte.
import { NativeViewElementNode, registerElement } from '@nativescript-community/svelte-native/dom';
import { PersistentBottomSheet } from '../';

export default class PersistentBottomSheetElement extends NativeViewElementNode<PersistentBottomSheet> {
    constructor() {
        super('bottomsheet', PersistentBottomSheet);
    }

    static register() {
        registerElement('bottomsheet', () => new PersistentBottomSheetElement());
    }
}
