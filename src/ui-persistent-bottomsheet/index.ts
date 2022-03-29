import {
    GestureHandlerStateEvent,
    GestureHandlerTouchEvent,
    GestureState,
    GestureStateEventData,
    GestureTouchEventData,
    HandlerType,
    Manager,
    PanGestureHandler,
    PanGestureHandlerOptions,
    install as installGestures
} from '@nativescript-community/gesturehandler';
import {
    Animation,
    AnimationDefinition,
    CSSType,
    Color,
    CoreTypes,
    EventData,
    GridLayout,
    Property,
    ScrollEventData,
    ScrollView,
    TouchGestureEventData,
    Utils,
    View,
    booleanConverter
} from '@nativescript/core';
const OPEN_DURATION = 200;
const CLOSE_DURATION = 200;
export let PAN_GESTURE_TAG = 12400;
// export const NATIVE_GESTURE_TAG = 12421;
const DEFAULT_TRIGGER_WIDTH = 20;
const SWIPE_DISTANCE_MINIMUM = 10;

function transformAnimationValues(values) {
    values.translate = { x: values.translateX || 0, y: values.translateY || 0 };
    values.scale = { x: values.scaleX || 1, y: values.scaleY || 1 };
    delete values.translateX;
    delete values.translateY;
    delete values.scaleX;
    delete values.scaleY;
    return values;
}

export interface BottomSheetEventData extends EventData {
    duration?: number;
}

export const scrollViewProperty = new Property<PersistentBottomSheet, string>({
    name: 'scrollViewId',
    defaultValue: undefined,
    valueChanged: (target, oldValue, newValue) => {
        (target as any)._onScrollViewIdChanged(oldValue, newValue);
    }
});
export const bottomSheetProperty = new Property<PersistentBottomSheet, View>({
    name: 'bottomSheet',
    defaultValue: undefined,
    valueChanged: (target, oldValue, newValue) => {
        (target as any)._onBottomSheetChanged(oldValue, newValue);
    }
});
export const gestureEnabledProperty = new Property<PersistentBottomSheet, boolean>({
    name: 'gestureEnabled',
    defaultValue: true,
    valueConverter: booleanConverter
});
export const stepsProperty = new Property<PersistentBottomSheet, number[]>({
    name: 'steps',
    defaultValue: [70]
});
export const stepIndexProperty = new Property<PersistentBottomSheet, number>({
    name: 'stepIndex',
    defaultValue: 0
});
export const backdropColorProperty = new Property<PersistentBottomSheet, Color>({
    name: 'backdropColor',
    valueConverter: (c) => (c ? new Color(c) : null)
});
export const translationFunctionProperty = new Property<PersistentBottomSheet, Function>({
    name: 'translationFunction'
});

@CSSType('PersistentBottomSheet')
export class PersistentBottomSheet extends GridLayout {
    public bottomSheet: View;
    public scrollViewId: string;
    // isPanning = false;
    public backdropColor = null;

    public stepIndex = 0;
    public panGestureOptions: PanGestureHandlerOptions & { gestureId?: number } = null;

    private backDrop: View;
    private panGestureHandler: PanGestureHandler;
    private _steps: number[] = [70];
    private isAnimating = false;
    private prevDeltaY = 0;
    private viewHeight = 0;
    private bottomViewHeight = 0;

    private lastScrollY: number;
    private lastTouchY: number;
    private scrollViewTouched = false;
    private _translationY = -1;
    public gestureEnabled = true;
    private _scrollView: ScrollView;
    private _isScrollEnabled = true;
    private scrollViewAtTop: boolean = true;

    constructor() {
        super();
        this.isPassThroughParentEnabled = true;
        this.on('layoutChanged', this.onLayoutChange, this);
    }

    get steps() {
        const result = this._steps || (this.bottomSheet && (this.bottomSheet as any).steps);
        return result;
    }
    set steps(value: number[]) {
        this._steps = value;
    }

    // nativeGestureHandler: PanGestureHandler;
    translationFunction?: (height: number, delta: number, progress: number) => { bottomSheet?: AnimationDefinition; backDrop?: AnimationDefinition };
    protected initGestures() {
        const manager = Manager.getInstance();
        const options = { gestureId: PAN_GESTURE_TAG++, ...this.panGestureOptions };
        const gestureHandler = manager.createGestureHandler(HandlerType.PAN, options.gestureId, {
            shouldStartGesture: this.shouldStartGesture.bind(this),
            // simultaneousHandlers: [NATIVE_GESTURE_TAG],
            minDist: SWIPE_DISTANCE_MINIMUM,
            ...options
        });
        gestureHandler.on(GestureHandlerTouchEvent, this.onGestureTouch, this);
        gestureHandler.on(GestureHandlerStateEvent, this.onGestureState, this);
        gestureHandler.attachToView(this);
        this.panGestureHandler = gestureHandler as any;
    }
    protected shouldStartGesture(data) {
        if (this.steps.length === 0 || (this.steps.length === 1 && this.steps[0] === 0)) {
            return false;
        }
        let deltaY = 0;
        if (global.isIOS && !this.iosIgnoreSafeArea) {
            deltaY -= Utils.layout.toDeviceIndependentPixels(this.getSafeAreaInsets().top);
        }
        const y = data.y + deltaY;
        // console.log('shouldStartGesture ', safeAreatop, data, y, this.viewHeight - (this.translationMaxOffset - this.translationY), this.translationY, this.translationMaxOffset, this.viewHeight);
        if (y < this.viewHeight - (this.bottomViewHeight - this.translationY)) {
            return false;
        }
        if (this._scrollView) {
            const posY = this._scrollView && this.scrollView.getLocationRelativeTo(this).y + deltaY;
            if (y >= posY && y <= posY + this.scrollView.getMeasuredHeight()) {
                return false;
            }
        }
        return true;
    }
    // initNativeGestureHandler(newValue: View) {
    //     // console.log('initNativeGestureHandler', newValue);
    //     if (!this.nativeGestureHandler) {
    //         const manager = Manager.getInstance();
    //         const gestureHandler = manager.createGestureHandler(HandlerType.NATIVE_VIEW, NATIVE_GESTURE_TAG, {
    //             shouldActivateOnStart: true,
    //             shouldCancelWhenOutside: false,
    //             // simultaneousHandlers: [PAN_GESTURE_TAG],
    //         });
    //         // gestureHandler.on(GestureHandlerStateEvent, this.onNativeGestureState, this);
    //         this.nativeGestureHandler = gestureHandler as any;
    //     }
    //     if (this.nativeGestureHandler.getView() !== newValue) {
    //         // this.nativeGestureHandler.attachToView(newValue);
    //     }
    // }
    get translationY() {
        return this._translationY;
    }
    set translationY(value: number) {
        // console.log('set translationY', value)
        if (this._translationY !== -1) {
            this.isScrollEnabled = value === 0;
        }
        this._translationY = value;
    }
    get translationMaxOffset() {
        const steps = this.steps;
        return steps[steps.length - 1];
    }
    initNativeView() {
        super.initNativeView();
        if (this.scrollView) {
            this.scrollView.on('scroll', this.onScroll, this);
            this.scrollView.on('touch', this.onTouch, this);
        }
        if (this.gestureEnabled) {
            this.initGestures();
        }
    }
    disposeNativeView() {
        // this.off('layoutChanged', this.onLayoutChange, this);
        if (this.scrollView) {
            this.scrollView.off('scroll', this.onScroll, this);
            this.scrollView.off('touch', this.onTouch, this);
        }
        super.disposeNativeView();
        if (this.panGestureHandler) {
            this.panGestureHandler.off(GestureHandlerTouchEvent, this.onGestureTouch, this);
            this.panGestureHandler.off(GestureHandlerStateEvent, this.onGestureState, this);
            this.panGestureHandler.detachFromView();
            this.panGestureHandler = null;
        }
        // if (this.nativeGestureHandler) {
        //     // this.nativeGestureHandler.off(GestureHandlerTouchEvent, this.onNativeGestureTouch, this);
        //     // this.nativeGestureHandler.off(GestureHandlerStateEvent, this.onNativeGestureState, this);
        //     this.nativeGestureHandler.detachFromView();
        //     this.nativeGestureHandler = null;
        // }
    }
    [gestureEnabledProperty.setNative](value: boolean) {
        if (this.panGestureHandler) {
            this.panGestureHandler.enabled = value;
        } else if (value && !this.panGestureHandler) {
            this.initGestures();
        }
    }
    [stepIndexProperty.setNative](value: number) {
        if (this.viewHeight !== 0) {
            // we are layed out
            this.animateToPosition(this.steps[value]);
        }
    }
    [backdropColorProperty.setNative](value: Color) {
        if (!this.backDrop && this.bottomSheet) {
            const index = this.getChildIndex(this.bottomSheet);
            this.addBackdropView(index);
        }
    }
    protected addBackdropView(index: number) {
        // console.log('addBackdropView', index);
        this.backDrop = new GridLayout();
        this.backDrop.backgroundColor = this.backdropColor;
        this.backDrop.opacity = 0;
        this.backDrop.isUserInteractionEnabled = false;
        this.insertChild(this.backDrop, index);
    }

    get scrollView() {
        return this._scrollView;
    }
    set scrollView(value: ScrollView) {
        if (this._scrollView === value) {
            return;
        }
        if (this._scrollView) {
            this.scrollView.off('scroll', this.onScroll, this);
            this.scrollView.off('touch', this.onTouch, this);
        }
        this._scrollView = value;

        if (value) {
            // if (global.isIOS) {
            //     (value.nativeViewProtected as UIScrollView).delaysContentTouches = true;
            // }
            value.on('scroll', this.onScroll, this);
            value.on('touch', this.onTouch, this);
        }
    }
    private _onScrollViewIdChanged(oldValue: string, newValue: string) {
        if (newValue && this.bottomSheet) {
            if (this.bottomSheet.isLoaded) {
                const view: ScrollView = this.bottomSheet.getViewById(newValue);
                this.scrollView = view;
            } else {
                this.bottomSheet.once('loaded', () => {
                    const view: ScrollView = this.bottomSheet.getViewById(newValue);
                    this.scrollView = view;
                });
            }
        } else {
            this.scrollView = null;
        }
    }

    private _onBottomSheetChanged(oldValue: View, newValue: View) {
        if (oldValue) {
            this.removeChild(oldValue);
        }
        if (newValue) {
            newValue.iosOverflowSafeAreaEnabled = false;
            newValue.verticalAlignment = 'bottom';
            newValue.on('layoutChanged', this.onBottomLayoutChange, this);
            let index;
            if (!newValue.parent) {
                index = this.getChildrenCount();
                this.addChild(newValue);
            } else {
                index = this.getChildIndex(newValue);
            }
            if (!this.backDrop && this.backdropColor) {
                this.addBackdropView(index);
            }
            if (this.scrollViewId) {
                this._onScrollViewIdChanged(null, this.scrollViewId);
            }
        }
    }

    computeTranslationData(height) {
        const max = this.translationMaxOffset;
        const diff = height - max;
        let value = this._translationY;
        const progress = 1 - (this._translationY - diff) / max;

        if (global.isIOS && progress === 0 && !this.iosIgnoreSafeArea) {
            // if this is the 0 steop ensure it gets hidden even with safeArea
            const safeArea = this.getSafeAreaInsets();
            value += Utils.layout.toDeviceIndependentPixels(safeArea.bottom);
        }
        if (this.translationFunction) {
            return this.translationFunction(height, value, progress);
        }
        return {
            bottomSheet: {
                translateY: value
            },
            backDrop: {
                opacity: progress
            }
        };
    }
    private onLayoutChange(event: EventData) {
        const contentView = event.object as GridLayout;
        const height = Math.round(Utils.layout.toDeviceIndependentPixels(contentView.getMeasuredHeight()));
        this.viewHeight = height;
        if (this.translationY === -1 && this.bottomViewHeight !== 0) {
            const height = this.bottomViewHeight;
            const steps = this.steps;
            const step = steps[this.stepIndex];
            const ty = height - step;
            this.translationY = ty;
            const data = this.computeTranslationData(height);
            this.applyTrData(data);
        }
    }
    private onBottomLayoutChange(event: EventData) {
        const contentView = event.object as GridLayout;
        const height = Math.round(Utils.layout.toDeviceIndependentPixels(contentView.getMeasuredHeight()));
        this.bottomViewHeight = height;
        if (this.translationY === -1 && this.viewHeight !== 0) {
            const height = this.bottomViewHeight;
            const steps = this.steps;
            const step = steps[this.stepIndex];
            const ty = height - step;
            this.translationY = ty;
            const data = this.computeTranslationData(height);
            this.applyTrData(data);
        }
    }
    private get scrollViewVerticalOffset() {
        if (global.isAndroid) {
            return (this.scrollView.nativeViewProtected as androidx.core.view.ScrollingView).computeVerticalScrollOffset() / Utils.layout.getDisplayDensity();
        } else {
            return (this.scrollView.nativeViewProtected as UIScrollView).contentOffset.y;
        }
    }
    private set scrollViewVerticalOffset(value: number) {
        if (global.isAndroid) {
            (this.scrollView.nativeViewProtected as androidx.recyclerview.widget.RecyclerView).scrollTo(0, 0);
        } else {
            (this.scrollView.nativeViewProtected as UIScrollView).contentOffset = CGPointMake(this.scrollView.nativeViewProtected.contentOffset.x, 0);
        }
    }
    get isScrollEnabled() {
        return this._isScrollEnabled;
    }
    set isScrollEnabled(value: boolean) {
        if (this._isScrollEnabled !== value) {
            this._isScrollEnabled = value;
            if (this.scrollView) {
                this.scrollView.isScrollEnabled = value;
            }
        }
    }
    private onTouch(event: TouchGestureEventData) {
        let touchY;
        // if (this.animationTimer) {
        //     clearTimeout(this.animationTimer);
        //     this.animationTimer = null;
        // }
        // touch event gives you relative touch which varies with translateY
        // so we use touch location in the window
        if (global.isAndroid) {
            touchY = Utils.layout.toDeviceIndependentPixels((event.android as android.view.MotionEvent).getRawY());
        } else if (global.isIOS) {
            touchY = (event.ios.touches.anyObject() as UITouch).locationInView(null).y;
        }
        if (event.action === 'down') {
            // this.scrollViewTouched = true;
            // this.lastScrollY = this.scrollViewVerticalOffset;
            // this.scrollViewAtTop = this.lastScrollY === 0;
            // if (this.scrollViewAtTop) {
            //     this.panGestureHandler.cancel();
            // }
        } else if (event.action === 'up' || event.action === 'cancel') {
            if (this.scrollViewTouched) {
                this.scrollViewTouched = false;
                if (this.scrollViewAtTop) {
                    this.scrollViewAtTop = this.scrollView.verticalOffset === 0;
                    const y = touchY - (this.lastTouchY || touchY);
                    const totalDelta = this.translationY + y;
                    this.computeAndAnimateEndGestureAnimation(totalDelta);
                }
            }
            this.isScrollEnabled = true;
        } else if ((!this.scrollViewTouched || this.scrollViewAtTop) && event.action === 'move') {
            if (!this.scrollViewTouched) {
                // on android sometimes we dont get the down event but we get move events
                // so let init here if necessary
                this.scrollViewTouched = true;
                this.lastScrollY = this.scrollViewVerticalOffset;
                this.scrollViewAtTop = this.lastScrollY === 0;
                if (!this.scrollViewAtTop) {
                    return;
                } else {
                    this.panGestureHandler.cancel();
                }
            }
            const y = touchY - (this.lastTouchY || touchY);
            const trY = this.constrainY(this.translationY + y);
            const height = this.bottomViewHeight;
            this.translationY = trY;
            const trData = this.computeTranslationData(height);
            this.applyTrData(trData);
        }
        this.lastTouchY = touchY;
    }
    private onScroll(event: ScrollEventData & { scrollOffset?: number }) {
        const scrollY = event.scrollOffset || event.scrollY || 0;
        if (scrollY <= 0) {
            this.scrollViewAtTop = true;
            return;
        } else {
            const height = this.viewHeight;
            if (this.translationY > height - this.translationMaxOffset) {
                return;
            } else {
                this.scrollViewAtTop = false;
            }
        }
        this.lastScrollY = scrollY;
    }
    private onGestureState(args: GestureStateEventData) {
        const { state, prevState, extraData, view } = args.data;
        if (prevState === GestureState.ACTIVE) {
            const { velocityY, translationY } = extraData;
            const dragToss = 0.05;
            const y = translationY - this.prevDeltaY;
            const totalDelta = this.translationY + (y + dragToss * velocityY);
            this.computeAndAnimateEndGestureAnimation(totalDelta);
            this.prevDeltaY = 0;
        }
    }

    private computeAndAnimateEndGestureAnimation(totalDelta: number) {
        const viewHeight = this.bottomViewHeight;
        const steps = this.steps;
        let stepIndex = 0;
        let destSnapPoint = viewHeight - steps[stepIndex];
        let distance = Math.abs(destSnapPoint - totalDelta);
        for (let i = 0; i < steps.length; i++) {
            const snapPoint = viewHeight - steps[i];
            const distFromSnap = Math.abs(snapPoint - totalDelta);
            if (distFromSnap <= Math.abs(destSnapPoint - totalDelta)) {
                destSnapPoint = snapPoint;
                stepIndex = i;
                distance = distFromSnap;
            }
        }
        // stepIndexProperty.nativeValueChange
        // this.stepIndex = stepIndex;
        stepIndexProperty.nativeValueChange(this, stepIndex);
        this.animateToPosition(viewHeight - destSnapPoint, Math.min(distance * 2, OPEN_DURATION));
    }
    private onGestureTouch(args: GestureTouchEventData) {
        const data = args.data;
        if (data.state !== GestureState.ACTIVE) {
            return;
        }
        const deltaY = data.extraData.translationY;
        if (this.isAnimating || deltaY === 0) {
            this.prevDeltaY = deltaY;
            return;
        }
        const y = deltaY - this.prevDeltaY;
        const trY = this.constrainY(this.translationY + y);
        this.translationY = trY;
        const height = this.bottomViewHeight;
        const trData = this.computeTranslationData(height);
        this.applyTrData(trData);
        this.prevDeltaY = deltaY;
    }

    private applyTrData(trData: { [k: string]: any }) {
        Object.keys(trData).forEach((k) => {
            const { target, ...others } = trData[k];
            if (target) {
                Object.assign(target, others);
            }
            if (this[k]) {
                Object.assign(this[k], others);
            }
        });
    }

    private constrainY(y) {
        return Math.max(Math.min(y, this.bottomViewHeight), this.bottomViewHeight - this.translationMaxOffset);
    }

    animating = false;
    private async animateToPosition(position, duration = OPEN_DURATION) {
        if (this.animating) {
            return;
        }
        this.animating = true;
        if (this._scrollView && global.isAndroid) {
            // on android we get unwanted scroll effect while "swipping the view"
            // cancel the views touches before animation to prevent that
            const time = Date.now();
            const event = android.view.MotionEvent.obtain(time, time, android.view.MotionEvent.ACTION_CANCEL, 0, 0, 0);
            event.setAction(android.view.MotionEvent.ACTION_CANCEL);
            this.scrollView.nativeViewProtected.dispatchTouchEvent(event);
        }
        const height = this.bottomViewHeight;
        this.translationY = height - position;
        const trData = this.computeTranslationData(height);

        const params = Object.keys(trData)
            .map((k) => {
                const data = trData[k];
                if (data.target) {
                    return Object.assign(
                        {
                            curve: CoreTypes.AnimationCurve.easeOut,
                            duration
                        },
                        transformAnimationValues(trData[k])
                    );
                } else if (this[k]) {
                    return Object.assign(
                        {
                            target: this[k],
                            curve: CoreTypes.AnimationCurve.easeOut,
                            duration
                        },
                        transformAnimationValues(trData[k])
                    );
                }
            })
            .filter((a) => !!a);
        try {
            await new Animation(params).play();
        } catch (err) {
            console.error('BottomSheet animation cancelled', err);
        } finally {
            this.isScrollEnabled = true;
            this.animating = false;
            if (position !== 0) {
            } else {
                // if (this.backDrop) {
                //     this.backDrop.visibility = 'hidden';
                // }
            }
        }
    }
}

backdropColorProperty.register(PersistentBottomSheet);
scrollViewProperty.register(PersistentBottomSheet);
bottomSheetProperty.register(PersistentBottomSheet);
gestureEnabledProperty.register(PersistentBottomSheet);
translationFunctionProperty.register(PersistentBottomSheet);
stepIndexProperty.register(PersistentBottomSheet);

export function install() {
    installGestures();
}
