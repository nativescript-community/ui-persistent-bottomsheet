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
    AbsoluteLayout,
    Animation,
    AnimationDefinition,
    CSSType,
    Color,
    CoreTypes,
    EventData,
    GridLayout,
    Property,
    ScrollView,
    TouchGestureEventData,
    Utils,
    View,
    booleanConverter
} from '@nativescript/core';
import { VelocityTracker } from './VelocityTracker';
const OPEN_DURATION = 200;
export let PAN_GESTURE_TAG = 12400;
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
        target._onBottomSheetChanged(oldValue, newValue);
    }
});
export const gestureEnabledProperty = new Property<PersistentBottomSheet, boolean>({
    name: 'gestureEnabled',
    defaultValue: true,
    valueConverter: booleanConverter
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
export class PersistentBottomSheet extends AbsoluteLayout {
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
    // private bottomViewHeight = 0;

    private lastTouchY: number;
    private touchStartY: number;
    private wasDraggingPanel = false;
    private gestureModeDecided = false;
    private _translationY = -1;
    public gestureEnabled = true;
    private _scrollView: ScrollView;
    private _isScrollEnabled = true;

    private animation: Animation;

    private _allowBottomSheetAdd = false;

    public dragToss = 0.05;

    constructor() {
        super();
        this.isPassThroughParentEnabled = true;
        this.on('layoutChanged', this.onLayoutChanged, this);
    }

    get steps() {
        const result = this._steps || (this.bottomSheet && (this.bottomSheet as any).steps);
        return result;
    }
    set steps(value: number[]) {
        this._steps = value;

        if (this._steps?.length) {
            this.alignToStepPosition();
        }
    }

    // nativeGestureHandler: PanGestureHandler;
    translationFunction?: (delta: number, max: number, progress: number) => { bottomSheet?: AnimationDefinition; backDrop?: AnimationDefinition };
    protected initGestures() {
        if (this.scrollView) {
            this.scrollView.on('touch', this.onScrollViewTouch, this);
        }
        // On Android, also listen to touch events on bottomSheet to detect gestures that start
        // on tap-enabled elements (buttons, etc.). On iOS, attaching a touch listener to the
        // bottomSheet container would intercept and block tap events on child elements, so we
        // only listen to scrollView events which is sufficient for iOS gesture handling.
        if (__ANDROID__ && this.bottomSheet) {
            this.bottomSheet.on('touch', this.onBottomSheetTouch, this);
        }
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
        if (__IOS__ && !this.iosIgnoreSafeArea) {
            deltaY -= Utils.layout.toDeviceIndependentPixels(this.getSafeAreaInsets().top);
        }
        const y = data.y + deltaY;
        if (y < this.viewHeight + this.translationY) {
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
    get translationY() {
        return this._translationY;
    }
    set translationY(value: number) {
        // Do we still need this? it had some bad side effect
        // where the scrollview would start with isScrollEnabled= false from alignToStepPosition
        // if (this._translationY !== -1) {
        //     this.isScrollEnabled = value === 0;
        // }
        this._translationY = value;
    }
    get translationMaxOffset() {
        const steps = this.steps;
        return steps[steps.length - 1];
    }
    initNativeView() {
        super.initNativeView();

        if (this.gestureEnabled) {
            this.initGestures();
        }
    }
    disposeNativeView() {
        // this.off('layoutChanged', this.onLayoutChange, this);
        if (this.scrollView) {
            this.scrollView.off('touch', this.onScrollViewTouch, this);
        }
        if (__ANDROID__ && this.bottomSheet) {
            this.bottomSheet.off('touch', this.onBottomSheetTouch, this);
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
        // if (this.viewHeight !== 0) {
        // we are layed out
        this.animateToPosition(this.steps[value]);
        // }
    }
    [backdropColorProperty.setNative](value: Color) {
        if (!this.backDrop && this.bottomSheet) {
            const index = this.getChildIndex(this.bottomSheet);
            this.addBackdropView(index);
        }
    }
    protected addBackdropView(index: number) {
        this.backDrop = new AbsoluteLayout();
        this.backDrop.width = this.backDrop.height = {
            unit: '%',
            value: 100
        };
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
            this.scrollView.off('touch', this.onScrollViewTouch, this);
        }
        this._scrollView = value;

        if (value) {
            if (__IOS__) {
                // Disable bounce effect to prevent scroll acceleration (2x speed issue)
                // and to allow panel dragging when reaching scroll boundaries.
                value.nativeViewProtected.bounces = false;
            }
            if (this.gestureEnabled) {
                value.on('touch', this.onScrollViewTouch, this);
            }
            value.isScrollEnabled = this._isScrollEnabled;
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
    addChild(child) {
        if (child === this.bottomSheet && !this._allowBottomSheetAdd) {
            return;
        }
        super.addChild(child);
    }
    _onBottomSheetChanged(oldValue: View, newValue: View) {
        if (oldValue === newValue) {
            return;
        }
        if (oldValue) {
            this.removeChild(oldValue);
        }
        if (newValue) {
            newValue.iosOverflowSafeAreaEnabled = false;
            if (!newValue.width) {
                newValue.width = {
                    unit: '%',
                    value: 100
                };
            }
            // newValue.top = {
            //     unit: 'px',
            //     value: this.viewHeight
            // };
            // newValue.verticalAlignment = 'bottom';
            // newValue.on('layoutChanged', this.onBottomLayoutChange, this);
            let index;
            if (!newValue.parent) {
                index = this.getChildrenCount();
                this._allowBottomSheetAdd = true;
                this.addChild(newValue);
                this._allowBottomSheetAdd = false;
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

    computeTranslationData() {
        const max = this.translationMaxOffset;
        let value = this._translationY;
        const progress = -value / max;
        if (__IOS__ && progress === 0 && !this.iosIgnoreSafeArea) {
            // if this is the 0 steop ensure it gets hidden even with safeArea
            const safeArea = this.getSafeAreaInsets();
            value += Utils.layout.toDeviceIndependentPixels(safeArea.bottom);
        }
        if (this.translationFunction) {
            return this.translationFunction(value, max, progress);
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
    private alignToStepPosition() {
        if (!this.bottomSheet) {
            return;
        }

        const steps = this.steps;
        const step = steps[Math.min(this.stepIndex, steps.length - 1)] ?? 0;
        const ty = step;
        this.translationY = -ty;
        const data = this.computeTranslationData();
        this.applyTrData(data);
    }
    private onLayoutChanged(event: EventData) {
        const contentView = event.object as GridLayout;
        const height = Math.round(Utils.layout.toDeviceIndependentPixels(contentView.getMeasuredHeight()));
        this.viewHeight = height;
        if (this.bottomSheet) {
            this.bottomSheet.top = {
                unit: 'px',
                value: contentView.getMeasuredHeight()
            };
        }
        if (this.translationY === -1) {
            this.alignToStepPosition();
        }
    }
    private get scrollViewVerticalOffset() {
        if (__ANDROID__) {
            return (this.scrollView.nativeViewProtected as androidx.core.view.ScrollingView).computeVerticalScrollOffset() / Utils.layout.getDisplayDensity();
        } else {
            return (this.scrollView.nativeViewProtected as UIScrollView).contentOffset.y;
        }
    }
    // private set scrollViewVerticalOffset(value: number) {
    //     if (__ANDROID__) {
    //         (this.scrollView.nativeViewProtected as androidx.recyclerview.widget.RecyclerView).scrollTo(0, 0);
    //     } else {
    //         (this.scrollView.nativeViewProtected as UIScrollView).contentOffset = CGPointMake(this.scrollView.nativeViewProtected.contentOffset.x, 0);
    //     }
    // }
    get isScrollEnabled() {
        return this._isScrollEnabled;
    }
    set isScrollEnabled(value: boolean) {
        if (this._isScrollEnabled !== value) {
            this._isScrollEnabled = value;
            if (this.scrollView) {
                // this only works if the scrollView component supports isScrollEnabled
                // otherwise the interaction wont be nice
                this.scrollView.isScrollEnabled = value;
            }
        }
    }
    scrollViewTouched = false;
    private onBottomSheetTouch(event: TouchGestureEventData) {
        if (!this.scrollViewTouched) {
            this.onTouch(event);
        }
    }
    private onScrollViewTouch(event: TouchGestureEventData) {
        if (event.action === 'up' || event.action === 'cancel') {
            this.scrollViewTouched = false;
        } else {
            this.scrollViewTouched = true;
        }
        this.onTouch(event);
    }
    vt: VelocityTracker | null = null;
    private onTouch(event: TouchGestureEventData) {
        let touchY;
        // touch event gives you relative touch which varies with translateY
        // so we use touch location in the window
        if (__ANDROID__) {
            touchY = Utils.layout.toDeviceIndependentPixels((event.android as android.view.MotionEvent).getRawY());
        } else if (__IOS__) {
            touchY = (event.ios.touches.anyObject() as UITouch).locationInView(null).y;
        }
        const p = event.getActivePointers()[0];
        if (event.action === 'down') {
            this.vt = VelocityTracker.obtain();
            this.vt.addMovement(p.getX(), p.getY());
            this.lastTouchY = null;
            this.touchStartY = touchY;
            this.wasDraggingPanel = false;
            this.gestureModeDecided = false;
        } else if (event.action === 'up' || event.action === 'cancel') {
            this.vt?.addMovement(p.getX(), p.getY());
            // If we were dragging the panel, animate to nearest step
            // BUT: ignore 'cancel' events from tap handlers (they shouldn't trigger animation)
            if (this.wasDraggingPanel && event.action === 'up') {
                this.vt?.computeCurrentVelocity(1000);
                const velocityY = -(this.vt?.getYVelocity() ?? 0);
                this.vt?.recycle();
                const y = touchY - (this.lastTouchY || touchY);
                const totalDelta = this.translationY + y + this.dragToss * velocityY;
                this.computeAndAnimateEndGestureAnimation(-totalDelta);
                this.wasDraggingPanel = false;
            }

            this.isScrollEnabled = true;

            // Only reset touchStartY on 'up', not on 'cancel' (@tap elements send cancel mid-gesture)
            // if (event.action === 'up') {
            this.touchStartY = null;
            // }
            this.lastTouchY = null;

            // Reset dragging state on any end event
            this.wasDraggingPanel = false;
        } else if (event.action === 'move') {
            // On Android sometimes we don't get the down event but we get move events
            // so initialize touchStartY if needed
            if (this.touchStartY === undefined) {
                this.vt = VelocityTracker.obtain();
                this.lastTouchY = null;
                this.touchStartY = touchY;
                this.wasDraggingPanel = false;
                this.gestureModeDecided = false;
            }
            this.vt?.addMovement(p.getX(), p.getY());

            const deltaY = touchY - this.touchStartY;
            const absDeltaY = Math.abs(deltaY);

            // we cant have small movement ignore
            // otherwise the scrollview would slowly start moving
            // then after it would peek a scrollview wanting to scroll
            // if (absDeltaY < SWIPE_DISTANCE_MINIMUM) {
            //     // Movement too small - likely a tap
            //     return;
            // }

            // Check current scroll position
            const currentScrollY = this._scrollView ? this.scrollViewVerticalOffset : 0;
            const isAtTop = currentScrollY === 0;

            // If not yet dragging panel, check if we should start (one-way transition)
            if (!this.wasDraggingPanel) {
                let shouldStartDraggingPanel = false;

                if (deltaY > 0) {
                    // Swiping DOWN - start dragging panel if reached top
                    shouldStartDraggingPanel = isAtTop;
                } else {
                    // Swiping UP - start dragging panel if at top AND panel not fully expanded
                    if (isAtTop) {
                        const maxOffset = this.translationMaxOffset;
                        const isPanelFullyExpanded = Math.abs(this.translationY + maxOffset) < 1;
                        shouldStartDraggingPanel = !isPanelFullyExpanded;
                    }
                }

                if (shouldStartDraggingPanel) {
                    // Switch to panel dragging mode (one-way, won't switch back during this gesture)
                    this.wasDraggingPanel = true;
                    this.isScrollEnabled = false;
                    this.panGestureHandler?.cancel();
                } else {
                    // Keep scrolling the list
                    if (!this.gestureModeDecided) {
                        this.gestureModeDecided = true;
                        this.isScrollEnabled = true;
                    }
                }
            } else {
                const maxOffset = this.translationMaxOffset;
                const isPanelFullyExpanded = Math.abs(this.translationY + maxOffset) < 1;
                // if dragged to the top we can enable back scrolling
                if (isPanelFullyExpanded) {
                    this.wasDraggingPanel = false;
                    this.gestureModeDecided = true;
                    this.isScrollEnabled = true;
                }
            }

            // Execute the current mode
            if (this.wasDraggingPanel) {
                // Handle panel drag
                const y = touchY - (this.lastTouchY ?? touchY);
                const trY = this.constrainY(this.translationY + y);
                this.translationY = trY;
                const trData = this.computeTranslationData();
                this.applyTrData(trData);
            }
            // else: let native scroll happen (do nothing)
            this.lastTouchY = touchY;
        }
    }

    private onGestureState(args: GestureStateEventData) {
        // Ignore pan gesture handler when we're manually dragging panel via onTouch
        if (this.wasDraggingPanel) {
            return;
        }

        const { state, prevState, extraData, view } = args.data;
        if (prevState === GestureState.ACTIVE) {
            const { velocityY, translationY } = extraData;
            const y = translationY - this.prevDeltaY;
            const totalDelta = this.translationY + (y + this.dragToss * velocityY);
            this.computeAndAnimateEndGestureAnimation(-totalDelta);
            this.prevDeltaY = 0;
        }
    }

    canAnimateToStep(step: number) {
        return true;
    }

    private computeAndAnimateEndGestureAnimation(totalDelta: number) {
        const steps = this.steps;
        let stepIndex = 0;
        for (let i = 0; i < steps.length; i++) {
            if (!this.canAnimateToStep(i)) {
                stepIndex++;
            } else {
                break;
            }
        }
        let destSnapPoint = steps[stepIndex];
        let distance = Math.abs(destSnapPoint - totalDelta);
        for (let i = stepIndex; i < steps.length; i++) {
            const snapPoint = steps[i];
            if (!this.canAnimateToStep(snapPoint)) {
                continue;
            }
            const distFromSnap = Math.abs(snapPoint - totalDelta);
            if (distFromSnap <= Math.abs(destSnapPoint - totalDelta)) {
                destSnapPoint = snapPoint;
                stepIndex = i;
                distance = distFromSnap;
            }
        }
        stepIndexProperty.nativeValueChange(this, stepIndex);
        this.animateToPosition(destSnapPoint, Math.min(distance * 2, OPEN_DURATION));
    }

    public animateStepIndex(stepIndex, duration?: number, curve?) {
        const steps = this.steps;
        stepIndexProperty.nativeValueChange(this, stepIndex);
        const destSnapPoint = steps[stepIndex];
        this.animateToPosition(destSnapPoint, duration, curve);
    }
    private onGestureTouch(args: GestureTouchEventData) {
        // Ignore pan gesture handler when we're manually dragging panel via onTouch
        if (this.wasDraggingPanel) {
            return;
        }

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
        const trData = this.computeTranslationData();
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
        return Math.max(Math.min(y, 0), -this.translationMaxOffset);
    }

    animating = false;
    private async animateToPosition(position, duration = OPEN_DURATION, curve = CoreTypes.AnimationCurve.easeOut) {
        if (this.animation) {
            this.animation.cancel();
        }
        if (this.animating) {
            return;
        }
        this.notify({ eventName: 'animate', position, duration });

        this.animating = true;
        if (this._scrollView && __ANDROID__) {
            // on android we get unwanted scroll effect while "swipping the view"
            // cancel the views touches before animation to prevent that
            const time = Date.now();
            const event = android.view.MotionEvent.obtain(time, time, android.view.MotionEvent.ACTION_CANCEL, 0, 0, 0);
            event.setAction(android.view.MotionEvent.ACTION_CANCEL);
            this.scrollView.nativeViewProtected.dispatchTouchEvent(event);
        }
        // const height = this.bottomViewHeight;
        this.translationY = -position;
        const trData = this.computeTranslationData();
        const params = Object.keys(trData)
            .map((k) => {
                const data = trData[k];
                if (data.target) {
                    return Object.assign(
                        {
                            curve,
                            duration
                        },
                        transformAnimationValues(trData[k])
                    );
                } else if (this[k]) {
                    return Object.assign(
                        {
                            target: this[k],
                            curve,
                            duration
                        },
                        transformAnimationValues(trData[k])
                    );
                }
            })
            .filter((a) => !!a);
        try {
            this.animation = new Animation(params);
            await this.animation.play();
        } catch (err) {
            //ensure we go to end position
            this.applyTrData(trData);
            console.error('BottomSheet animation cancelled', err);
        } finally {
            this.isScrollEnabled = true;
            this.animating = false;
            this.animation = null;
            this.notify({ eventName: 'animated', position, duration });
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
