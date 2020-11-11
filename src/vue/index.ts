const PBSPlugin = {
    install(Vue) {
        Vue.registerElement('BottomSheet', () => require('../index').PersistentBottomSheet, {
            model: {
                prop: 'stepIndex',
                event: 'stepIndexChange',
            },
        });
    },
};

export default PBSPlugin;
