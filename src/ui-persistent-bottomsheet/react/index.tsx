import * as React from 'react';
import { GridLayoutAttributes, NSVElement, NativeScriptProps, registerElement } from 'react-nativescript';
import { Color, View } from '@nativescript/core';
import { PersistentBottomSheet as NativeScriptBottomSheet } from '..';
import { PanGestureHandlerOptions } from '@nativescript-community/gesturehandler';

export function registerDrawer() {
    registerElement('bottomsheet', () => require('../').BottomSheet);
}

interface BottomSheetAttributes extends GridLayoutAttributes {
    stepIndex?: number;
    steps?: number[];
    backdropColor?: Color | string;
    gestureEnabled?: boolean;
    bottomSheet?: View;
    scrollViewId?: string;
    panGestureOptions?: PanGestureHandlerOptions & { gestureId?: number };
    onStepIndexChange?(args: any): void;

}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            bottomsheet: NativeScriptProps<BottomSheetAttributes, NativeScriptBottomSheet>;
        }
    }
}

export const BottomSheet = React.forwardRef<NSVElement<NativeScriptBottomSheet>, NativeScriptProps<BottomSheetAttributes, NativeScriptBottomSheet>>((props, ref) => (
    <bottomsheet {...props} ref={ref} />
));
