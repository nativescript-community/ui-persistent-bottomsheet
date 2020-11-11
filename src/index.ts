import {
    GestureHandlerStateEvent,
    GestureHandlerTouchEvent,
    GestureState,
    GestureStateEventData,
    GestureTouchEventData,
    HandlerType,
    Manager,
    PanGestureHandler,
    install as installGestures,
} from '@nativescript-community/gesturehandler';
import { Animation, AnimationDefinition, CSSType, Color, EventData, GridLayout, Property, ScrollEventData, ScrollView, TouchGestureEventData, Utils, View, booleanConverter } from '@nativescript/core';
import { AnimationCurve } from '@nativescript/core/ui/enums';
installGestures(false);
const OPEN_DURATION = 200;
const CLOSE_DURATION = 200;
export const PAN_GESTURE_TAG = 12431;
export const NATIVE_GESTURE_TAG = 12421;
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
        target._onScrollViewIdChanged(oldValue, newValue);
    },
});
export const bottomSheetProperty = new Property<PersistentBottomSheet, View>({
    name: 'bottomSheet',
    defaultValue: undefined,
    valueChanged: (target, oldValue, newValue) => {
        target._onBottomSheetChanged(oldValue, newValue);
    },
});
export const gestureEnabledProperty = new Property<PersistentBottomSheet, boolean>({
    name: 'gestureEnabled',
    defaultValue: true,
    valueConverter: booleanConverter,
});
export const stepsProperty = new Property<PersistentBottomSheet, number[]>({
    name: 'steps',
    defaultValue: [70],
});
export const stepIndexProperty = new Property<PersistentBottomSheet, number>({
    name: 'stepIndex',
    defaultValue: 0,
});
export const backdropColorProperty = new Property<PersistentBottomSheet, Color>({
    name: 'backdropColor',
    valueConverter: (c) => (c ? new Color(c) : null),
});
export const translationFunctionProperty = new Property<PersistentBottomSheet, Function>({
    name: 'translationFunction',
});

@CSSType('PersistentBottomSheet')
export class PersistentBottomSheet extends GridLayout {
    public bottomSheet: View;
    public scrollViewId: string;
    public backDrop: View;
    // isPanning = false;
    backdropColor = null;

    _steps: number[] = [70];

    get steps() {
        const result = this._steps || (this.bottomSheet && (this.bottomSheet as any).steps);
        return result;
    }
    set steps(value: number[]) {
        this._steps = value;
    }
    stepIndex = 0;

    isAnimating = false;
    prevDeltaY = 0;
    viewHeight = 0;
    bottomViewHeight = 0;
    panGestureHandler: PanGestureHandler;

    lastScrollY: number;
    lastTouchY: number;
    scrollViewTouched = false;

    // nativeGestureHandler: PanGestureHandler;
    gestureEnabled = true;
    translationFunction?: (height: number, delta: number, progress: number) => { bottomSheet?: AnimationDefinition; backDrop?: AnimationDefinition };
    initGestures() {
        const manager = Manager.getInstance();
        const gestureHandler = manager.createGestureHandler(HandlerType.PAN, PAN_GESTURE_TAG, {
            shouldStartGesture: this.shouldStartGesture.bind(this),
            // waitFor: [NATIVE_GESTURE_TAG],
            // disallowInterruption: true,
            simultaneousHandlers: [NATIVE_GESTURE_TAG],
            // shouldCancelWhenOutside: true,
            // activeOffsetX: this.leftSwipeDistance,
            minDist: SWIPE_DISTANCE_MINIMUM,
            // failOffsetX: SWIPE_DISTANCE_MINIMUM,
        });
        gestureHandler.on(GestureHandlerTouchEvent, this.onGestureTouch, this);
        gestureHandler.on(GestureHandlerStateEvent, this.onGestureState, this);
        gestureHandler.attachToView(this);
        this.panGestureHandler = gestureHandler as any;
        // if (this.mainContent) {
        //     this.initNativeGestureHandler(this.mainContent);
        // }
    }
    shouldStartGesture(data) {
        // if (this.scrollView) {
        const safeAreatop = Utils.layout.toDeviceIndependentPixels(this.getSafeAreaInsets().top);
        // if (global.isIOS) {
        //     // why do we get need :s
        //     safeAreatop -= 10;
        // }
        // const y = data.y - safeAreatop;
        const y = data.y - safeAreatop;
        // console.log('shouldStartGesture ', safeAreatop, data, y, this.viewHeight - (this.translationMaxOffset - this.translationY), this.translationY, this.translationMaxOffset, this.viewHeight);
        if (y < this.viewHeight - (this.translationMaxOffset - this.translationY)) {
            return false;
        }
        if (this._scrollView) {
            const posY = this._scrollView && this.scrollView.getLocationRelativeTo(this).y - safeAreatop;
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
    constructor() {
        super();
        this.isPassThroughParentEnabled = true;
        this.on('layoutChanged', this.onLayoutChange, this);
    }
    _translationY = -1;
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
    addBackdropView(index: number) {
        // console.log('addBackdropView', index);
        this.backDrop = new GridLayout();
        this.backDrop.backgroundColor = this.backdropColor;
        this.backDrop.opacity = 0;
        this.backDrop.isUserInteractionEnabled = false;
        this.insertChild(this.backDrop, index);
    }

    _scrollView: ScrollView;

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
    public _onScrollViewIdChanged(oldValue: string, newValue: string) {
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

    public _onBottomSheetChanged(oldValue: View, newValue: View) {
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
        const value = this._translationY;
        const progress = 1 - value / height;
        if (this.translationFunction) {
            return this.translationFunction(height, value, progress);
        }
        return {
            bottomSheet: {
                translateY: value,
            },
            backDrop: {
                opacity: progress,
            },
        };
    }
    onLayoutChange(event: EventData) {
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
    onBottomLayoutChange(event: EventData) {
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
    get scrollViewVerticalOffset() {
        if (global.isAndroid) {
            return (this.scrollView.nativeViewProtected as androidx.core.view.ScrollingView).computeVerticalScrollOffset() / Utils.layout.getDisplayDensity();
        } else {
            return (this.scrollView.nativeViewProtected as UIScrollView).contentOffset.y;
        }
    }
    set scrollViewOffset(value: number) {
        if (global.isAndroid) {
            (this.scrollView.nativeViewProtected as androidx.recyclerview.widget.RecyclerView).scrollTo(0, 0);
        } else {
            (this.scrollView.nativeViewProtected as UIScrollView).contentOffset = CGPointMake(this.scrollView.nativeViewProtected.contentOffset.x, 0);
        }
    }
    _isScrollEnabled = true;
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
    onTouch(event: TouchGestureEventData) {
        let touchY;
        // if (this.animationTimer) {
        //     clearTimeout(this.animationTimer);
        //     this.animationTimer = null;
        // }
        // touch event gives you relative touch which varies with translateY
        // so we use touch location in the window
        if (global.isAndroid) {
            touchY = Utils.layout.toDeviceIndependentPixels((event.android as android.view.MotionEvent).getRawY());
        } else {
            touchY = (event.ios.touches.anyObject() as UITouch).locationInView(null).y;
        }
        // console.log('onToucht', event.action, this.lastTouchY, touchY);
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
                    if (y !== 0) {
                        const totalDelta = this.translationY + y;
                        this.computeAndAnimateEndGestureAnimation(totalDelta);
                    }
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
            // const height = this.viewHeight;
            // const viewY = this.translationY - height;
            const y = touchY - (this.lastTouchY || touchY);
            const trY = this.constrainY(this.translationY + y);
            const height = this.translationMaxOffset;
            // console.log('constraining on touch event', touchY, this.lastTouchY, y, trY);
            this.translationY = trY;
            const trData = this.computeTranslationData(height);
            this.applyTrData(trData);
        }
        this.lastTouchY = touchY;
        // console.log('setting lastTouchY', this.lastTouchY);
    }
    scrollViewAtTop: boolean = true;
    onScroll(event: ScrollEventData & { scrollOffset?: number }) {
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
    onGestureState(args: GestureStateEventData) {
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

    computeAndAnimateEndGestureAnimation(totalDelta: number) {
        const viewHeight = this.translationMaxOffset;
        const steps = this.steps;
        let stepIndex = 0;
        let destSnapPoint = viewHeight - steps[stepIndex];
        for (let i = 0; i < steps.length; i++) {
            const snapPoint = viewHeight - steps[i];
            const distFromSnap = Math.abs(snapPoint - totalDelta);
            if (distFromSnap <= Math.abs(destSnapPoint - totalDelta)) {
                destSnapPoint = snapPoint;
                stepIndex = i;
            }
        }
        // stepIndexProperty.nativeValueChange
        // this.stepIndex = stepIndex;
        stepIndexProperty.nativeValueChange(this, stepIndex);
        this.animateToPosition(viewHeight - destSnapPoint);
    }
    onGestureTouch(args: GestureTouchEventData) {
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
        const height = this.translationMaxOffset;
        const trData = this.computeTranslationData(height);
        this.applyTrData(trData);
        this.prevDeltaY = deltaY;
    }

    applyTrData(trData: { [k: string]: any }) {
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

    constrainY(y) {
        return Math.max(Math.min(y, this.translationMaxOffset), 0);
    }

    async animateToPosition(position, duration = OPEN_DURATION) {
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
                            curve: AnimationCurve.easeInOut,
                            duration,
                        },
                        transformAnimationValues(trData[k])
                    );
                } else if (this[k]) {
                    return Object.assign(
                        {
                            target: this[k],
                            curve: AnimationCurve.easeInOut,
                            duration,
                        },
                        transformAnimationValues(trData[k])
                    );
                }
            })
            .filter((a) => !!a);
        try {
            await new Animation(params).play();
            this.isScrollEnabled = true;
        } catch (err) {
            console.error(err);
        } finally {
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
