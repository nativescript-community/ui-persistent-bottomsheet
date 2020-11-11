import { Component, Directive, ElementRef, EmbeddedViewRef, EventEmitter, Inject, Input, NgModule, Output, TemplateRef, ViewContainerRef } from '@angular/core';
import { NgView, ViewClassMeta, registerElement } from '@nativescript/angular';
import { PersistentBottomSheet } from '@nativescript-community/ui-persistent-bottomsheet';

const BOTTOMSHEET: string = 'bottomSheet';

export interface ItemEventArgs {
    object: any;
    view: EmbeddedViewRef<any>;
    returnValue?: boolean;
}

/**
 * This is the SideDrawer component. It separates your mobile app's screen
 * into a main part and a menu part whereby the menu part is shown upon a swipe
 * gesture using a transition effect.
 */
@Component({
    selector: 'BottomSheet',
    template: '<ng-content></ng-content>',
})
export class PersistentBottomSheetComponent {
    public pbs: PersistentBottomSheet;
    public bottomSheetTemplate: TemplateRef<ElementRef>;

    private _gestureEnabled: boolean;

    constructor(@Inject(ElementRef) public elementRef: ElementRef, @Inject(ViewContainerRef) private viewContainer: ViewContainerRef) {
        this.pbs = this.elementRef.nativeElement;
    }

    public get nativeElement(): PersistentBottomSheet {
        return this.pbs;
    }

    set gestureEnabled(value: boolean) {
        this._gestureEnabled = value;
        this.updateGestureEnabled();
    }

    private updateGestureEnabled() {
        this.pbs.gestureEnabled = this._gestureEnabled;
    }
}

/**
 * Directive identifying the left drawer
 */
@Directive({
    selector: '[leftDrawer]',
})
export class BottomSheetDirective {
    constructor(@Inject(ElementRef) private _elementRef: ElementRef) {
        this._elementRef.nativeElement.id = BOTTOMSHEET;
    }
}

const sbsMeta: ViewClassMeta = {
    insertChild: (parent: NgView, child: NgView) => {
        const pbs = (parent as any) as PersistentBottomSheet;
        const childView = child;

        if (childView.id === BOTTOMSHEET) {
            pbs.bottomSheet = childView;
        }
    },
    removeChild: (parent: NgView, child: NgView) => {
        const pbs = (parent as any) as PersistentBottomSheet;
        const childView = child;

        if (childView.id === BOTTOMSHEET) {
            pbs.bottomSheet = null;
        }
    },
};

/**
 * Directives identifying the Drawer.
 */
export const PERSISTENTBOTTOMSHEET_DIRECTIVES = [BottomSheetDirective];

registerElement('BottomSheet', () => PersistentBottomSheet, sbsMeta);

/**
 * NgModule containing all of the RadSideDrawer directives.
 */
@NgModule({
    declarations: [PersistentBottomSheetComponent, PERSISTENTBOTTOMSHEET_DIRECTIVES],
    exports: [PersistentBottomSheetComponent, PERSISTENTBOTTOMSHEET_DIRECTIVES],
})
export class PersistentBottomSheetModule {}
