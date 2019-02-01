<sidebar-tab name="settings" icon="cog" title="Settings">
    <settings-tab inline-template
        v-on:update="handleUpdatedSettings"
        >
            <div class="settings-tab">
                <div class="sidebar-tab__section">
                    <h5 title="Set the opacity of annotations">Annotation Opacity (<span v-text="annotationOpacity"></span>)</h5>
                    <input type="range" min="0" max="1" step="0.1" v-model="annotationOpacity">
                </div>
            </div>
    </settings-tab>
</sidebar-tab>
