import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';

import { PersistentBottomSheetComponent } from '@nativescript-community/ui-persistent-bottomsheet/angular';

import { BasicComponent } from './basic/basic.component';

export const COMPONENTS = [BasicComponent];
@NgModule({
    imports: [PersistentBottomSheetComponent],
    exports: [PersistentBottomSheetComponent],
    schemas: [NO_ERRORS_SCHEMA]
})
export class InstallModule {}

export function installPlugin() {}

export const demos = [{ name: 'Basic', path: 'basic', component: BasicComponent }];
