<!-- ⚠️ This README has been generated from the file(s) "blueprint.md" ⚠️--><!-- ⚠️ This README has been generated from the file(s) "blueprint.md" ⚠️-->
<!--  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      DO NOT EDIT THIS READEME DIRECTLY! Edit "bluesprint.md" instead.
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -->
<h1 align="center">@nativescript-community/ui-persistent-bottomsheet</h1>
<p align="center">
		<a href="https://npmcharts.com/compare/@nativescript-community/ui-persistent-bottomsheet?minimal=true"><img alt="Downloads per month" src="https://img.shields.io/npm/dm/@nativescript-community/ui-persistent-bottomsheet.svg" height="20"/></a>
<a href="https://www.npmjs.com/package/@nativescript-community/ui-persistent-bottomsheet"><img alt="NPM Version" src="https://img.shields.io/npm/v/@nativescript-community/ui-persistent-bottomsheet.svg" height="20"/></a>
	</p>

<p align="center">
  <b>NativeScript plugin that allows you to easily add a persistent bottomsheet to your projects.</b></br>
  <sub><sub>
</p>

<br />


| <img src="https://raw.githubusercontent.com/nativescript-community/ui-persistent-bottomsheet/master/images/demo-ios.gif" height="500" /> | <img src="https://raw.githubusercontent.com/nativescript-community/ui-persistent-bottomsheet/master/images/demo-android.gif" height="500" /> |
| --- | ----------- |
| iOS Demo | Android Demo |


[](#table-of-contents)


[](#table-of-contents)

## Table of Contents

* [Installation](#installation)
* [Configuration](#configuration)
* [API](#api)
	* [Properties](#properties)
	* [Methods](#methods)
* [Usage in Angular](#usage-in-angular)
* [Usage in Vue](#usage-in-vue)
* [Usage in Svelte](#usage-in-svelte)
* [Usage in React](#usage-in-react)
* [Demos](#demos)
* [Demos and Development](#demos-and-development)
	* [Repo Setup](#repo-setup)
	* [Build](#build)
	* [Demos](#demos-1)
* [Contributing](#contributing)
	* [Update repo ](#update-repo-)
	* [Update readme ](#update-readme-)
	* [Update doc ](#update-doc-)
	* [Publish](#publish)
* [Questions](#questions)


[](#installation)


[](#installation)

## Installation
Run the following command from the root of your project:

`ns plugin add @nativescript-community/ui-persistent-bottomsheet`


[](#configuration)


[](#configuration)

## Configuration
For gestures to work, make sure to add the following code block inside the main application file (e.g. app.ts):

```typescript
import { install } from '@nativescript-community/ui-persistent-bottomsheet';
install();
```


[](#api)


[](#api)

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


[](#usage-in-angular)


[](#usage-in-angular)

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


[](#usage-in-vue)


[](#usage-in-vue)

## Usage in Vue

Register the plugin in your `app.js`.

```typescript
import BottomSheetPlugin from '~/components/drawer/vue';
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


[](#usage-in-svelte)


[](#usage-in-svelte)

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


[](#usage-in-react)


[](#usage-in-react)

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



[](#demos)


[](#demos)

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


[](#demos-and-development)


[](#demos-and-development)

## Demos and Development


### Repo Setup

The repo uses submodules. If you did not clone with ` --recursive` then you need to call
```
git submodule update --init
```

The package manager used to install and link dependencies must be `pnpm` or `yarn`. `npm` wont work.

To develop and test:
if you use `yarn` then run `yarn`
if you use `pnpm` then run `pnpm i`

**Interactive Menu:**

To start the interactive menu, run `npm start` (or `yarn start` or `pnpm start`). This will list all of the commonly used scripts.

### Build

```bash
npm run build.all
```

### Demos

```bash
npm run demo.[ng|react|svelte|vue].[ios|android]

npm run demo.svelte.ios # Example
```


[](#contributing)


[](#contributing)

## Contributing

### Update repo 

You can update the repo files quite easily

First update the submodules

```bash
npm run update
```

Then commit the changes
Then update common files

```bash
npm run sync
```
Then you can run `yarn|pnpm`, commit changed files if any

### Update readme 
```bash
npm run readme
```

### Update doc 
```bash
npm run doc
```

### Publish

The publishing is completely handled by `lerna` (you can add `-- --bump major` to force a major release)
Simply run 
```shell
npm run publish
```


[](#questions)


[](#questions)

## Questions

If you have any questions/issues/comments please feel free to create an issue or start a conversation in the [NativeScript Community Discord](https://nativescript.org/discord).