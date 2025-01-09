<sidebar-tab name="settings" icon="cog" title="Settings" :highlight="highlightSettingsTab">
    <settings-tab v-cloak :image="image" v-on:change="handleSettingsChange" inline-template>
        <div class="annotator-tab">
            <div class="sidebar-tab__section">
                <button v-if="crossOrigin" class="btn btn-default" title="Screenshots are not available for remote images without cross-origin resource sharing" disabled="disabled" ><span class="fa fa-camera" aria-hidden="true"></span> Capture screenshot</button>
                <screenshot-button v-else inline-template>
                    <button class="btn btn-default" title="Get a screenshot of the visible area 𝗣" v-on:click="capture"><span class="fa fa-camera" aria-hidden="true"></span> Capture screenshot</button>
                </screenshot-button>
            </div>

            <div class="sidebar-tab__section">
                <h5 title="Set the opacity of annotations on the map">Annotation Opacity (<span v-text="annotationOpacity"></span>)</h5>
                <input type="range" min="0" max="1" step="0.1" v-model="annotationOpacity" onmouseup="this.blur()">
            </div>

            <div class="sidebar-tab__section">
                <h5 title="Set the number of caches images ">Cached Images (<span v-text="cachedImagesCount"></span>)</h5>
                <input type="range" min="1" max="50" step="1" v-model="cachedImagesCount" onmouseup="this.blur()">
            </div>

            <div class="sidebar-tab__section">
                <power-toggle :active="progressIndicator" title-off="Show progress indicator" title-on="Hide progress indicator" v-on:on="showProgressIndicator" v-on:off="hideProgressIndicator">Progress Indicator</power-toggle>
            </div>

            <div class="sidebar-tab__section">
                <power-toggle :active="minimap" title-off="Show minimap" title-on="Hide minimap" v-on:on="showMinimap" v-on:off="hideMinimap">Minimap</power-toggle>
            </div>

            <div class="sidebar-tab__section">
                <power-toggle :active="mousePosition" title-off="Show mouse position" title-on="Hide mouse position" v-on:on="showMousePosition" v-on:off="hideMousePosition">Mouse Position</power-toggle>
            </div>

            <div class="sidebar-tab__section">
                <power-toggle :active="zoomLevel" title-off="Show zoom level" title-on="Hide zoom level" v-on:on="showZoomLevel" v-on:off="hideZoomLevel">Zoom Level</power-toggle>
            </div>

            <div class="sidebar-tab__section">
                <power-toggle :active="scaleLine" title-off="Show scale line" title-on="Hide scale line" v-on:on="showScaleLine" v-on:off="hideScaleLine">Scale Line</power-toggle>
            </div>

            <div class="sidebar-tab__section">
                <power-toggle :active="labelTooltip" title-off="Show label tooltip" title-on="Hide label tooltip" v-on:on="showLabelTooltip" v-on:off="hideLabelTooltip">Label Tooltip</power-toggle>
            </div>

            <div class="sidebar-tab__section">
                <power-toggle :active="measureTooltip" title-off="Show measure tooltip" title-on="Hide measure tooltip" v-on:on="showMeasureTooltip" v-on:off="hideMeasureTooltip">Measure Tooltip</power-toggle>
            </div>

            @mixin('annotationsSettingsTab')
        </div>
    </settings-tab>
</sidebar-tab>
