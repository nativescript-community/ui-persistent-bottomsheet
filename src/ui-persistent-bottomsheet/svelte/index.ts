import { NativeViewElementNode, registerElement } from 'svelte-native/dom';
import { PersistentBottomSheet } from '../';

export default class PersistentBottomSheetElement extends NativeViewElementNode<PersistentBottomSheet> {
    constructor() {
        super('bottomsheet', PersistentBottomSheet);
    }

    static register() {
        registerElement('bottomsheet', () => new PersistentBottomSheetElement());
    }
}
