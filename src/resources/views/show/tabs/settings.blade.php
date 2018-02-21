<sidebar-tab name="settings" icon="cog" title="Settings">
    <settings-tab v-cloak v-on:change="handleSettingsChange" inline-template>
        <div class="settings-tab">
            <h4>Settings</h4>

            <screenshot-button inline-template>
                <button class="btn btn-default" :title="screenshotTitle" :disabled="!screenshotSupported" v-on:click="capture"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span> Capture screenshot</button>
            </screenshot-button>

            <div class="sidebar-tab__section">
                <h5 title="Set the opacity of annotations on the map">Annotation Opacity (<span v-text="annotationOpacity"></span>)</h5>
                <input type="range" min="0" max="1" step="0.1" v-model="annotationOpacity">
            </div>

            <div class="sidebar-tab__section">
                <h5>Minimap</h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: minimap}" v-on:click="showMinimap" title="Show minimap">show</button>
                    <button type="button" class="btn btn-default" :class="{active: !minimap}" v-on:click="hideMinimap" title="Hide minimap">hide</button>
                </div>
            </div>

            <div class="sidebar-tab__section">
                <h5>Mouse Position</h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: mousePosition}" v-on:click="showMousePosition" title="Show mouse position">show</button>
                    <button type="button" class="btn btn-default" :class="{active: !mousePosition}" v-on:click="hideMousePosition" title="Hide mouse position">hide</button>
                </div>
            </div>

            <div class="sidebar-tab__section">
                <h5>Zoom Level</h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: zoomLevel}" v-on:click="showZoomLevel" title="Show zoom level">show</button>
                    <button type="button" class="btn btn-default" :class="{active: !zoomLevel}" v-on:click="hideZoomLevel" title="Hide zoom level">hide</button>
                </div>
            </div>

            <div class="sidebar-tab__section">
                <h5>Annotation Tooltip</h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: annotationTooltip}" v-on:click="showAnnotationTooltip" title="Show annotation tooltip">show</button>
                    <button type="button" class="btn btn-default" :class="{active: !annotationTooltip}" v-on:click="hideAnnotationTooltip" title="Hide annotation tooltip">hide</button>
                </div>
            </div>

            @mixin('annotationsSettingsTab')
        </div>
    </settings-tab>
</sidebar-tab>
