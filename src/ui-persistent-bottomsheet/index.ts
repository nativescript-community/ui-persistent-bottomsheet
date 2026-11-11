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

function transformAnimationValues({ translateX, translateY, scaleX, scaleY, ...values }) {
    // a copy: trData is applied again once the animation ends
    return {
        ...values,
        translate: { x: translateX || 0, y: translateY || 0 },
        scale: { x: scaleX || 1, y: scaleY || 1 }
    };
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
    private viewWidth = 0;
    // private bottomViewHeight = 0;

    private lastTouchY: number;
    private touchStartY: number;
    private touchStartX: number;
    /** the touch went sideways, so it belongs to whatever is under the finger, not to the sheet */
    private touchIsHorizontal = false;
    private wasDraggingPanel = false;
    private gestureModeDecided = false;
    /** iOS: the pan of the list scroll view drives the sheet while the finger is in the list */
    private iosPanTarget: any;
    private iosPanScrollView: UIScrollView;
    private iosPan = { lastTranslation: 0, previousOffset: 0, sheetMoved: false, blocked: false };
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
        const previous = this._steps;
        this._steps = value;
        if (!value?.length) {
            return;
        }
        const target = value[Math.min(this.stepIndex, value.length - 1)] ?? 0;
        // once laid out, a step that moved is animated to, and an animation under way is retargeted:
        // snapping there would be undone by the running animation, which still ends on the old step
        if (this.viewHeight !== 0 && previous && (this.animating || -this.translationY !== target)) {
            this.animateToPosition(target);
        } else {
            this.alignToStepPosition();
        }
    }

    // nativeGestureHandler: PanGestureHandler;
    translationFunction?: (delta: number, max: number, progress: number) => { bottomSheet?: AnimationDefinition; backDrop?: AnimationDefinition };
    protected initGestures() {
        // iOS: the pan gesture handler (the header) and the pan of the scroll view (the list) drive the sheet, the touch events are not needed
        if (this.scrollView && __ANDROID__) {
            this.scrollView.on('touch', this.onScrollViewTouch, this);
        }
        // Also listen to touch events on bottomSheet to detect gestures that start on children
        // overlaying the scrollView (headers, drag handles, buttons...). Those swallow the touch
        // so the scrollView listener never sees it, and shouldStartGesture rejects the pan handler
        // for anything inside the scrollView bounds. onBottomSheetTouch is a no-op while the
        // scrollView is touched, so the scrollView keeps driving the gesture when it is the target.
        if (this.bottomSheet && __ANDROID__) {
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
        if (this.steps.length === 0 || (this.steps.length === 1 && this.steps[0] === 0) || (this.stepIndex === 0 && this.steps[0] === 0)) {
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
        // Check if gesture is within bottomSheet horizontal bounds (for partial-width panels)
        if (this.bottomSheet) {
            const bsWidth = Utils.layout.toDeviceIndependentPixels(this.bottomSheet.getMeasuredWidth());
            if (bsWidth > 0 && bsWidth < this.viewWidth) {
                const loc = this.bottomSheet.getLocationRelativeTo(this);
                if (loc && (data.x < loc.x || data.x > loc.x + bsWidth)) {
                    return false;
                }
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
        // After native view recreation bottomSheet is kept but scrollView is not: children get
        // their native views after ours, so look it up again once the sheet is loaded.
        if (!this.scrollView && this.bottomSheet && this.scrollViewId) {
            this._onScrollViewIdChanged(null, this.scrollViewId);
        }
    }
    disposeNativeView() {
        // this.off('layoutChanged', this.onLayoutChange, this);
        if (this.scrollView) {
            this.scrollView.off('touch', this.onScrollViewTouch, this);
            if (__IOS__) {
                this.detachScrollPanIOS();
            }
            this.scrollView = null;
        }
        // Keep bottomSheet: native views can be recreated while the JS tree survives (Android
        // activity recreation), and nulling it would remove the sheet from the tree for good.
        if (this.bottomSheet) {
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
        // no such step yet: the steps are about to change, and their setter moves the sheet
        if (this.viewHeight !== 0 && this.steps?.[value] !== undefined) {
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
            if (__IOS__) {
                this.detachScrollPanIOS();
            }
        }
        this._scrollView = value;

        if (value) {
            if (this.gestureEnabled && __ANDROID__) {
                value.on('touch', this.onScrollViewTouch, this);
            }
            if (__IOS__) {
                if (value.nativeViewProtected) {
                    this.attachScrollPanIOS(value.nativeViewProtected);
                } else {
                    value.once('loaded', () => this._scrollView === value && this.attachScrollPanIOS(value.nativeViewProtected));
                }
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

    /** `hideUnderSafeArea`: the closed sheet goes under the safe area. Not while it is dragged: it would jump when it reaches its bottom */
    computeTranslationData(hideUnderSafeArea = true) {
        const max = this.translationMaxOffset;
        let value = this._translationY;
        const progress = -value / max;
        if (__IOS__ && hideUnderSafeArea && progress === 0 && !this.iosIgnoreSafeArea) {
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
        const width = Math.round(Utils.layout.toDeviceIndependentPixels(contentView.getMeasuredWidth()));
        this.viewHeight = height;
        this.viewWidth = width;
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
        let touchX;
        // touch event gives you relative touch which varies with translateY
        // so we use touch location in the window
        if (__ANDROID__) {
            const motionEvent = event.android as android.view.MotionEvent;
            touchY = Utils.layout.toDeviceIndependentPixels(motionEvent.getRawY());
            touchX = Utils.layout.toDeviceIndependentPixels(motionEvent.getRawX());
        } else if (__IOS__) {
            const location = (event.ios.touches.anyObject() as UITouch).locationInView(null);
            touchY = location.y;
            touchX = location.x;
        }
        const p = event.getActivePointers()[0];
        if (event.action === 'down') {
            this.vt = VelocityTracker.obtain();
            this.vt.addMovement(p.getX(), p.getY());
            this.lastTouchY = null;
            this.touchStartY = touchY;
            this.touchStartX = touchX;
            this.touchIsHorizontal = false;
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

            // only reset on bottomsheet up/cancel event (will happen after scrollView up/cancel)
            // because doing it in scrollView could trigger unwanted scroll events breaking things
            if (this.scrollViewTouched) {
                this.isScrollEnabled = true;
            }

            // Only reset touchStartY on 'up', not on 'cancel' (@tap elements send cancel mid-gesture)
            // if (event.action === 'up') {
            this.touchStartY = null;
            // }
            this.lastTouchY = null;
            this.touchIsHorizontal = false;

            // Reset dragging state on any end event
            this.wasDraggingPanel = false;
        } else if (event.action === 'move') {
            // On Android sometimes we don't get the down event but we get move events
            // so initialize touchStartY if needed
            if (this.touchStartY === undefined) {
                this.vt = VelocityTracker.obtain();
                this.lastTouchY = null;
                this.touchStartY = touchY;
                this.touchStartX = touchX;
                this.touchIsHorizontal = false;
                this.wasDraggingPanel = false;
                this.gestureModeDecided = false;
            }
            this.vt?.addMovement(p.getX(), p.getY());

            const deltaY = touchY - this.touchStartY;
            const absDeltaY = Math.abs(deltaY);

            // This path is a plain touch listener, so the pan gesture handler options never reach it.
            // Without them a horizontal drag over a child that pans or zooms - a chart, a pager -
            // still flips us into panel dragging on the first pixel of vertical drift, and the
            // cancelAllGestures() below then kills that child's handlers. So honour here the same
            // options the caller passed for the gesture handler. Opt in: with no panGestureOptions
            // nothing below changes
            if (!this.wasDraggingPanel && this.panGestureOptions) {
                const { failOffsetXEnd, failOffsetXStart, minDist } = this.panGestureOptions;
                const deltaX = touchX - this.touchStartX;
                if (
                    this.touchIsHorizontal ||
                    (failOffsetXEnd !== undefined && deltaX > failOffsetXEnd) ||
                    (failOffsetXStart !== undefined && deltaX < failOffsetXStart)
                ) {
                    // one way for the rest of the touch, like the handler's own fail offsets
                    this.touchIsHorizontal = true;
                    this.lastTouchY = touchY;
                    return;
                }
                if (minDist !== undefined && absDeltaY < minDist) {
                    this.lastTouchY = touchY;
                    return;
                }
            }

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
                    this.cancelAllGestures();
                } else {
                    // Keep scrolling the list
                    if (!this.gestureModeDecided && !isAtTop) {
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

    /**
     * iOS: the list is dragged by its own pan, which never stops: the sheet and the list share what the finger moves.
     * The list is kept where it is while the sheet moves (it is at its top to let the sheet move), and the sheet leaves what it cannot move to the list.
     * A target of that pan gets every change, even when the touch events of the view are cancelled by the scroll view.
     */
    private attachScrollPanIOS(scrollView: UIScrollView) {
        if (this.iosPanScrollView === scrollView) {
            return;
        }
        this.detachScrollPanIOS();
        const owner = new WeakRef(this);
        const Target = (NSObject as any).extend(
            {
                handlePan(recognizer: UIPanGestureRecognizer) {
                    owner.get()?.onScrollPanIOS(recognizer);
                }
            },
            {
                name: 'PersistentBottomSheetPanTarget',
                exposedMethods: { handlePan: { returns: interop.types.void, params: [interop.types.id] } }
            }
        );
        this.iosPanTarget = Target.new();
        this.iosPanScrollView = scrollView;
        scrollView.panGestureRecognizer.addTargetAction(this.iosPanTarget, 'handlePan');
    }

    private detachScrollPanIOS() {
        if (this.iosPanScrollView && this.iosPanTarget) {
            this.iosPanScrollView.panGestureRecognizer.removeTargetAction(this.iosPanTarget, 'handlePan');
        }
        this.iosPanTarget = null;
        this.iosPanScrollView = null;
    }

    private onScrollPanIOS(recognizer: UIPanGestureRecognizer) {
        const scrollView = this.iosPanScrollView;
        if (!scrollView || !this.gestureEnabled) {
            return;
        }
        const state = recognizer.state;
        const translation = recognizer.translationInView(scrollView).y;
        const pan = this.iosPan;
        if (state === UIGestureRecognizerState.Began) {
            // what the list already followed of the finger is taken back to know where it was
            pan.lastTranslation = translation;
            pan.previousOffset = scrollView.contentOffset.y + translation;
            pan.sheetMoved = false;
            pan.blocked = this.animating || this.steps.length < 2;
            return;
        }
        if (state === UIGestureRecognizerState.Changed) {
            const dy = translation - pan.lastTranslation;
            pan.lastTranslation = translation;
            if (pan.blocked || !dy) {
                pan.previousOffset = scrollView.contentOffset.y;
                return;
            }
            const inset = scrollView.adjustedContentInset;
            const top = -inset.top;
            const position = -this.translationY;
            const offset = pan.previousOffset;
            let sheetMove = 0;
            let newOffset: number = null;
            if (dy < 0) {
                // finger up: the sheet rises while the list is at its top, what it cannot rise is for the list
                if (offset <= top + 0.5) {
                    sheetMove = Math.min(-dy, this.translationMaxOffset - position);
                    newOffset = top + (-dy - sheetMove);
                }
            } else {
                // finger down: the list goes back to its top, then the sheet goes down
                const listMove = Math.min(dy, Math.max(0, offset - top));
                const rest = dy - listMove;
                if (rest > 0 && position > 0) {
                    sheetMove = -Math.min(rest, position);
                    newOffset = top;
                }
            }
            if (sheetMove) {
                pan.sheetMoved = true;
                this.translationY = this.constrainY(this.translationY - sheetMove);
                this.applyTrData(this.computeTranslationData(false));
            }
            if (newOffset !== null && (sheetMove || pan.sheetMoved)) {
                scrollView.contentOffset = CGPointMake(scrollView.contentOffset.x, newOffset);
            }
            pan.previousOffset = scrollView.contentOffset.y;
            return;
        }
        if (state === UIGestureRecognizerState.Ended || state === UIGestureRecognizerState.Cancelled || state === UIGestureRecognizerState.Failed) {
            if (pan.sheetMoved) {
                pan.sheetMoved = false;
                const velocity = recognizer.velocityInView(scrollView).y;
                // the list does not go on with what is left of the finger
                scrollView.scrollEnabled = false;
                setTimeout(() => (scrollView.scrollEnabled = true), 0);
                this.computeAndAnimateEndGestureAnimation(-(this.translationY + this.dragToss * velocity));
            }
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
        const trData = this.computeTranslationData(false);
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
            // on iOS cancel() never settles play(), so the cancelled call never reaches its finally block
            this.animation = null;
            this.animating = false;
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
        let animation: Animation = null;
        try {
            animation = new Animation(params);
            this.animation = animation;
            await animation.play();
        } catch (err) {
            console.error('BottomSheet animation cancelled', err);
        } finally {
            // otherwise a newer call has taken over
            if (this.animation === animation) {
                // a cancelled animation can still write its own target when its CAAnimation starts,
                // and a hidden layer (app in background) never starts one: commit the end position
                this.applyTrData(trData);
                if (__ANDROID__) {
                    // With a SurfaceView under the window (a map), Android crops the window to what
                    // its views covered at the last layout: a translation is no layout, so once the
                    // sheet moved, views where it no longer is would stay cut off without one.
                    this.nativeViewProtected?.requestLayout();
                }
                this.isScrollEnabled = true;
                this.animating = false;
                this.panGestureHandler.enabled = this.stepIndex !== 0;
                this.animation = null;
                this.notify({ eventName: 'animated', position, duration });
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
