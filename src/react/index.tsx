import * as React from 'react';
import { GridLayoutAttributes, NSVElement, NativeScriptProps, registerElement } from 'react-nativescript';
import { Color, View } from '@nativescript/core';
import { PersistentBottomSheet as NativeScriptPersistentBottomSheet } from '..';

export function registerDrawer() {
    registerElement('bottomsheet', () => require('../').PersistentBottomSheet);
}

interface PersistentBottomSheetAttributes extends GridLayoutAttributes {
    backdropColor?: Color;
    gestureEnabled?: boolean;
    bottomSheet?: View;
    scrollView?: string;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            drawer: NativeScriptProps<PersistentBottomSheetAttributes, NativeScriptPersistentBottomSheet>;
        }
    }
}

export const PersistentBottomSheet = React.forwardRef<NSVElement<NativeScriptPersistentBottomSheet>, NativeScriptProps<PersistentBottomSheetAttributes, NativeScriptPersistentBottomSheet>>(
    (props, ref) => <drawer {...props} ref={ref} />
);
