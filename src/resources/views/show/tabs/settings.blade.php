<sidebar-tab name="settings" icon="cog" title="Toggle the settings tab">
    <settings-tab v-cloak v-on:change="handleSettingsChange" inline-template>
        <div class="settings-tab">
            <h4>Settings</h4>

            <div class="settings-tab__section">
                <label title="Set the opacity of annotations on the map">Annotation opacity (<span v-text="annotationOpacity"></span>)</label>
                <input type="range" min="0" max="1" step="0.01" v-model="annotationOpacity">
            </div>

        </div>
    </settings-tab>
</sidebar-tab>
