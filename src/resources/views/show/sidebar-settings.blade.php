<sidebar-tab name="settings" icon="cog" title="Settings">
    <settings-tab inline-template
        v-on:update="handleUpdatedSettings"
        >
            <div class="annotator-tab settings-tab">

                <div class="sidebar-tab__section">
                    <h5 title="Set the opacity of annotations">Annotation Opacity (<span v-text="annotationOpacity"></span>)</h5>
                    <input type="range" min="0" max="1" step="0.1" v-model="annotationOpacity">
                </div>

                <div class="sidebar-tab__section">
                    <input type="number" min="0" step="0.5" v-model="autoplayDraw" class="form-control form-control--small" title="Time in seconds that the video should play after an annotation keyframe is drawn"> Play/pause while drawing
                </div>

                <div class="sidebar-tab__section">
                    <input type="number" min="0.25" max="4.0" step="0.25" v-model="playbackRate" class="form-control form-control--small" title="Video playback rate"> Playback rate
                </div>

                <div class="sidebar-tab__section">
                    <power-toggle :active="showMinimap" title-off="Show minimap" title-on="Hide minimap" v-on:on="handleShowMinimap" v-on:off="handleHideMinimap">Minimap</power-toggle>
                </div>

                <div class="sidebar-tab__section">
                    <power-toggle :active="showLabelTooltip" title-off="Show label tooltip" title-on="Hide label tooltip" v-on:on="handleShowLabelTooltip" v-on:off="handleHideLabelTooltip">Label Tooltip</power-toggle>
                </div>

                <div class="sidebar-tab__section">
                    <power-toggle :active="showMousePosition" title-off="Show mouse position" title-on="Hide mouse position" v-on:on="handleShowMousePosition" v-on:off="handleHideMousePosition">Mouse Position</power-toggle>
                </div>

            </div>
    </settings-tab>
</sidebar-tab>
