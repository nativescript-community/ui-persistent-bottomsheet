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
    template: '<ng-content></ng-content>'
})
export class BottomSheetComponent {
    public pbs: PersistentBottomSheet;
    public bottomSheetTemplate: TemplateRef<ElementRef>;

    private _gestureEnabled: boolean;
    private _stepIndex: number;

    constructor(@Inject(ElementRef) public elementRef: ElementRef, @Inject(ViewContainerRef) private viewContainer: ViewContainerRef) {
        this.pbs = this.elementRef.nativeElement;
    }

    public get nativeElement(): PersistentBottomSheet {
        return this.pbs;
    }
    @Input()
    get gestureEnabled(): boolean {
        return this._gestureEnabled;
    }
    set gestureEnabled(value: boolean) {
        this._gestureEnabled = value;
        this.pbs.gestureEnabled = this._gestureEnabled;
    }
    @Input()
    get stepIndex(): number {
        return this._stepIndex;
    }

    set stepIndex(value) {
        if (!isNaN(value)) {
            this._stepIndex = value;
            this.pbs.stepIndex = this._stepIndex;
        }
    }
    @Input()
    get backdropColor() {
        return this.pbs.backdropColor;
    }

    set backdropColor(value) {
        this.pbs.backdropColor = value;
    }

    @Input()
    get scrollViewId() {
        return this.pbs.scrollViewId;
    }

    set scrollViewId(value) {
        this.pbs.scrollViewId = value;
    }
    @Input()
    get panGestureOptions(): any {
        return this.pbs.panGestureOptions;
    }

    set panGestureOptions(value) {
        this.pbs.panGestureOptions = value;
    }
}

/**
 * Directive identifying the left drawer
 */
@Directive({
    selector: '[bottomSheet]'
})
export class BottomSheetDirective {
    constructor(@Inject(ElementRef) private _elementRef: ElementRef) {
        this._elementRef.nativeElement.id = BOTTOMSHEET;
    }
}

const sbsMeta: ViewClassMeta = {
    insertChild: (parent: NgView, child: NgView) => {
        const pbs = parent as any as PersistentBottomSheet;
        const childView = child;

        if (childView.id === BOTTOMSHEET) {
            pbs.bottomSheet = childView;
        } else {
            pbs.addChild(childView);
        }
    },
    removeChild: (parent: NgView, child: NgView) => {
        const pbs = parent as any as PersistentBottomSheet;
        const childView = child;

        if (childView.id === BOTTOMSHEET) {
            pbs.bottomSheet = null;
        } else {
            pbs.removeChild(childView);
        }
    }
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
    declarations: [BottomSheetComponent, PERSISTENTBOTTOMSHEET_DIRECTIVES],
    exports: [BottomSheetComponent, PERSISTENTBOTTOMSHEET_DIRECTIVES]
})
export class BottomSheetModule {}
