{{ load:../../tools/readme/edit-warning.md }}
{{ template:title }}
{{ template:badges }}
{{ template:description }}

| <img src="https://raw.githubusercontent.com/nativescript-community/ui-persistent-bottomsheet/master/images/demo-ios.gif" height="500" /> | <img src="https://raw.githubusercontent.com/nativescript-community/ui-persistent-bottomsheet/master/images/demo-android.gif" height="500" /> |
| --- | ----------- |
| iOS Demo | Android Demo |

{{ template:toc }}

## Installation
Run the following command from the root of your project:

`ns plugin add {{ pkg.name }}`

## Configuration
For gestures to work, make sure to add the following code block inside the main application file (e.g. app.ts):

```typescript
import { install } from '@nativescript-community/ui-persistent-bottomsheet';
install();
```

## API

### Properties

| Property            | Default                           | Type                        | Description                                             |
| ------------------- | --------------------------------- | --------------------------- | ------------------------------------------------------- |
| bottomSheet          | `undefined`                       | `View`                      | View containing the content for the bottomsheet    |
| gestureEnabled       | `true`                            | `boolean`                   | Boolean setting if swipe gestures are enabled           |
| stepIndex            | `0`                            | `number`                   | the index of current step (mutable)           |
| steps            | `[70]`                            | `number[]`                   | the different available steps           |
| backdropColor        | `new Color('rgba(0, 0, 0, 0.7)')` | `Color`                     | The color of the backdrop behind the drawer             |



### Methods

| Name         | Return | Description                                     |
| ------------ | ------ | ----------------------------------------------- |
| install()    | `void` | Install gestures                                |

## Usage in Angular
Import the module into your project.

```typescript
import { PBSModule } from "@nativescript-community/ui-persistent-bottomsheet/angular";

@NgModule({
    imports: [
        PBSModule
    ]
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})

export class AppModule { }
```

Then in your component add the following:

```xml
<BottomSheet>
    <StackLayout backgroundColor="white">
      <Label text="This is the main content"></Label>
    </StackLayout>
    <GridLayout bottomSheet backgroundColor="white" height="70">
      <Label text="This is the side drawer content"></Label>
    </GridLayout>

   
</BottomSheet>
```
For a more complete example, look in the `demo-ng` directory.

## Usage in Vue

Register the plugin in your `app.js`.

```typescript
import BottomSheetPlugin from '@nativescript-community/ui-persistent-bottomsheet/vue';
Vue.use(BottomSheetPlugin);
```

Add this at the top of your webpack config file:
```javascript
const NsVueTemplateCompiler = require('nativescript-vue-template-compiler');

NsVueTemplateCompiler.registerElement('BottomSheet', () => require('@nativescript-community/ui-persistent-bottomsheet').BottomSheet, {
    model: {
        prop: 'stepIndex',
        event: 'stepIndexChange'
    }
});
```

Then in your component add the following:

```xml
<BottomSheet>
    <StackLayout backgroundColor="white">
      <Label text="This is the main content" />
    </StackLayout>
    <GridLayout ~bottomSheet backgroundColor="white" height="70">
      <Label text="This is the side drawer content" />
    </GridLayout>

</BottomSheet>
```
For a more complete example, look in the `demo-vue` directory.

## Usage in Svelte

Register the plugin in your `app.ts`.

```typescript
import BottomSheetElement from '@nativescript-community/ui-persistent-bottomsheet/svelte';
BottomSheetElement.register();
```

Then in your component, add the following:

```xml
<bottomsheet>
    <stacklayout  backgroundColor="white">
      <Label text="This is the main content" />
    </stacklayout>
    <gridlayout prop:bottomSheet backgroundColor="white" height="70">
      <Label text="This is the side drawer content" />
    </gridlayout>

</bottomsheet>
```
For a more complete example, look in the `demo-svelte` directory.

## Usage in React

Register the plugin in your `app.ts`.

```typescript
import BottomSheetElement from '@nativescript-community/ui-persistent-bottomsheet/react';
BottomSheetElement.register();
```

Then in your component, add the following:
```ts
import { BottomSheet } from "@nativescript-community/ui-persistent-bottomsheet/react"
```

```xml
<BottomSheet>
  <stackLayout backgroundColor="white">
    <label text="This is the main content" />
  </stackLayout>
  <gridLayout nodeRole="bottomSheet" backgroundColor="white" height="70">
    <label text="This is the side drawer content" />
  </gridLayout>

</BottomSheet>
```
For a more complete example, look in the `demo-react` directory.


## Demos
This repository includes Angular, Vue.js, and Svelte demos. In order to run these execute the following in your shell:
```shell
$ git clone https://github.com/@nativescript-community/ui-persistent-bottomsheet
$ cd ui-drawer
$ npm run i
$ npm run setup
$ npm run build && npm run build.angular
$ cd demo-ng # or demo-vue or demo-svelte or demo-react
$ ns run ios|android
```

{{ load:../../tools/readme/demos-and-development.md }}
{{ load:../../tools/readme/questions.md }}
