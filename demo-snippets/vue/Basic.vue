<template>
    <Page>
        <ActionBar>
            <Label text="Basic Drawer" />
        </ActionBar>

        <BottomSheet v-model="stepIndex" :steps="[56, 156, 456]" scrollViewId="scrollView" backdropColor="#00000088" backgroundColor="purple">
            <StackLayout backgroundColor="red">
                <Label text="This is the main content" />
            </StackLayout>
            <gridlayout ~bottomSheet backgroundColor="yellow" rows="56, 100, 300" width="100%">
                <stacklayout row="0" orientation="horizontal">
                    <button text="My Profile" class="button" @tap="stepIndex = 0" />
                    <button text="Settings" class="button" @tap="stepIndex = 1" />
                    <button text="Rate Us" class="button" @tap="stepIndex = 2" />
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
                <ListView :items="items" row="2" id="scrollView" colWidth="50%" rowHeight="100">
                    <v-template>
                        <gridlayout rows="*, auto" :backgroundColor="item.color" class="item">
                            <stacklayout row="1">
                                <label row="1" :text="item.name" class="title" />
                                <label row="1" :text="item.color" class="subtitle" />
                            </stacklayout>
                        </gridlayout>
                    </v-template>
                </ListView>
            </gridlayout>
        </BottomSheet>
    </Page>
</template>

<script lang="typescript">
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
            items,
            stepIndex:0
        };
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
