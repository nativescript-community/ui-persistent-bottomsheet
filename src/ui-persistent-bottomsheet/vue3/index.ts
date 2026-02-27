const PBSPlugin = {
    install(app) {
        app.registerElement('BottomSheet', () => require('../index').PersistentBottomSheet, {
            model: {
                prop: 'stepIndex',
                event: 'stepIndexChange',
            },
            nodeOps: {
                insert(child, parent, atIndex) {
                    const parentView = parent.nativeView;
                    const childView = child.nativeView;
                    if (childView.nodeRole === 'bottomSheet') {
                        parentView.bottomSheet = childView;
                    } else {
                        parentView.addChild(childView);
                    }
                },
                remove(child, parent) {
                    const parentView = parent.nativeView;
                    const childView = child.nativeView;
                    if (parentView.bottomSheet === childView) {
                        parentView.bottomSheet = null;
                    } else {
                        parentView.removeChild(childView);
                    }
                },
            },
        });
    },
};

export default PBSPlugin;
