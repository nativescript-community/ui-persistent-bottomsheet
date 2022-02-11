// needs to be the compiler of the node-modules of the demo app!
const NsVueTemplateCompiler = require('../demo-vue/node_modules/nativescript-vue-template-compiler');


console.log('registering  bottomsheet for vue compilier');
NsVueTemplateCompiler.registerElement('BottomSheet', () => require('@nativescript-community/ui-persistent-bottomsheet').PersistentBottomSheet, {
    model: {
        prop: 'stepIndex',
        event: 'stepIndexChange'
    }
});
module.exports = (env) => {};
