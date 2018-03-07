<sidebar-tab name="settings" icon="cog" title="Settings">
    <settings-tab v-cloak v-on:change="handleSettingsChange" inline-template>
        <div class="annotator-tab">
            <div class="sidebar-tab__section">
                <screenshot-button inline-template>
                    <button class="btn btn-default" :title="screenshotTitle" :disabled="!screenshotSupported" v-on:click="capture"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span> Capture screenshot</button>
                </screenshot-button>
            </div>

            <div class="sidebar-tab__section">
                <h5 title="Set the opacity of annotations on the map">Annotation Opacity (<span v-text="annotationOpacity"></span>)</h5>
                <input type="range" min="0" max="1" step="0.1" v-model="annotationOpacity">
            </div>

            <div class="sidebar-tab__section">
                <power-button :active="minimap" title-off="Show minimap" title-on="Hide minimap" v-on:on="showMinimap" v-on:off="hideMinimap">Minimap</power-button>
            </div>

            <div class="sidebar-tab__section">
                <power-button :active="mousePosition" title-off="Show mouse position" title-on="Hide mouse position" v-on:on="showMousePosition" v-on:off="hideMousePosition">Mouse Position</power-button>
            </div>

            <div class="sidebar-tab__section">
                <power-button :active="zoomLevel" title-off="Show zoom level" title-on="Hide zoom level" v-on:on="showZoomLevel" v-on:off="hideZoomLevel">Zoom Level</power-button>
            </div>

            <div class="sidebar-tab__section">
                <power-button :active="scaleLine" title-off="Show scale line" title-on="Hide scale line" v-on:on="showScaleLine" v-on:off="hideScaleLine">Scale Line</power-button>
            </div>

            <div class="sidebar-tab__section">
                <power-button :active="annotationTooltip" title-off="Show annotation tooltip" title-on="Hide annotation tooltip" v-on:on="showAnnotationTooltip" v-on:off="hideAnnotationTooltip">Annotation Tooltip</power-button>
            </div>

            @mixin('annotationsSettingsTab')
        </div>
    </settings-tab>
</sidebar-tab>
