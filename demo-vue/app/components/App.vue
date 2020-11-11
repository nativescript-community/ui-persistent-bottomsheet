<template>
    <Page>
        <ActionBar>
            <Label text="Vue.js Demo" />
        </ActionBar>
        <BottomSheet v-model="stepIndex" :steps="[56, 156, 456]" scrollViewId="scrollView" backdropColor="#88000000">
            <CartoMap row="1" zoom="8" @mapReady="onMapReady" />
            <gridlayout ~bottomSheet backgroundColor="white" rows="56, 100, 300">
                <stacklayout row="0" orientation="horizontal">
                    <button text="My Profile" class="button" @tap="stepIndex = 0" />
                    <button text="Settings" class="button" />
                    <button text="Rate Us" class="button" />
                    <button text="Support" class="button" />
                    <button text="Contact" class="button" />
                </stacklayout>
                <stacklayout row="1" orientation="horizontal">
                    <button text="My Profile" class="button" />
                    <button text="Settings" class="button" />
                    <button text="Rate Us" class="button" />
                    <button text="Support" class="button" />
                    <button text="Contact" class="button" />
                </stacklayout>
                <collectionView :items="items" row="2" id="scrollView" colWidth="50%" rowHeight="100">
                    <v-template>
                        <gridlayout rows="*, auto" :backgroundColor="item.color" class="item">
                            <stacklayout row="1">
                                <label row="1" :text="item.name" class="title" />
                                <label row="1" :text="item.color" class="subtitle" />
                            </stacklayout>
                        </gridlayout>
                    </v-template>
                </collectionView>
            </gridlayout>
        </BottomSheet>
    </Page>
</template>

<script lang="ts">
import { CartoMap } from '@nativescript-community/ui-carto/ui';
import { PersistentBottomSheet } from '@nativescript-community/ui-persistent-bottomsheet';
import { HTTPTileDataSource } from '@nativescript-community/ui-carto/datasources/http';
import { RasterTileLayer } from '@nativescript-community/ui-carto/layers/raster';

export default {
    data() {
        const items = [
            { index: 0, name: 'TURQUOISE', color: '#1abc9c' },
            { index: 1, name: 'EMERALD', color: '#2ecc71' },
            { index: 2, name: 'PETER RIVER', color: '#3498db' },
            { index: 3, name: 'AMETHYST', color: '#9b59b6' },
            { index: 4, name: 'WET ASPHALT', color: '#34495e' },
            { index: 5, name: 'GREEN SEA', color: '#16a085' },
            { index: 6, name: 'NEPHRITIS', color: '#27ae60' },
            { index: 7, name: 'BELIZE HOLE', color: '#2980b9' },
            { index: 8, name: 'WISTERIA', color: '#8e44ad' },
            { index: 9, name: 'MIDNIGHT BLUE', color: '#2c3e50' },
            { index: 10, name: 'SUN FLOWER', color: '#f1c40f' },
            { index: 11, name: 'CARROT', color: '#e67e22' },
            { index: 12, name: 'ALIZARIN', color: '#e74c3c' },
            { index: 13, name: 'CLOUDS', color: '#ecf0f1' },
            { index: 14, name: 'CONCRETE', color: '#95a5a6' },
            { index: 15, name: 'ORANGE', color: '#f39c12' },
            { index: 16, name: 'PUMPKIN', color: '#d35400' },
            { index: 17, name: 'POMEGRANATE', color: '#c0392b' },
            { index: 18, name: 'SILVER', color: '#bdc3c7' },
            { index: 19, name: 'ASBESTOS', color: '#7f8c8d' },
        ];
        return {
            stepIndex: 0,
            items,
        };
    },
    computed: {
        message() {
            return 'Blank {N}-Vue app';
        },
    },
    methods: {
        onMapReady(event) {
            const cartoMap = event.object;
            cartoMap.getOptions().setZoomGestures(true);
            cartoMap.getOptions().setWatermarkScale(0);
            console.log('onMapReady', cartoMap);
            const dataSource = new HTTPTileDataSource({
                minZoom: 2,
                subdomains: 'abc',
                maxZoom: 18,
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            });

            const rasterLayer = new RasterTileLayer({
                zoomLevelBias: 1,
                dataSource,
            });
            cartoMap.addLayer(rasterLayer);
            cartoMap.setFocusPos({ latitude: 45, longitude: 5 }, 0);
        },
    },
};
</script>

<style scoped lang="scss">
ActionBar {
    background-color: #42b883;
    color: white;
}

Button {
    background-color: #42b883;
    color: white;
}
</style>
