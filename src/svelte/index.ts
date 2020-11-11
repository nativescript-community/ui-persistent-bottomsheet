import { NativeViewElementNode, registerElement } from 'svelte-native/dom';
import { PersistentBottomSheet } from '../';

export default class PersistentBottomSheetElement extends NativeViewElementNode<PersistentBottomSheet> {
    constructor() {
        super('bottomsheet', PersistentBottomSheet);
    }

    private get _bottomsheet() {
        return this.nativeView;
    }

    // close(side?: Side) {
    //     this._drawer.close(side);
    // }

    // isOpened(side?: Side): boolean {
    //     return this._drawer.isOpened(side);
    // }

    // open(side?: Side) {
    //     this._drawer.open(side);
    // }

    // toggle(side?: Side) {
    //     this._drawer.toggle(side);
    // }

    static register() {
        registerElement('bottomsheet', () => new PersistentBottomSheetElement());
    }
}
