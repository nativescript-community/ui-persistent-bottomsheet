import PBSComp from './component';

const PBSPlugin = {
    install(Vue) {
        Vue.registerElement('BottomSheet', () => require('../index').PersistentBottomSheet, {
            component: PBSComp,
        });
    },
};

export default PBSComp;
