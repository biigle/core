<sidebar-tab name="settings" icon="cog" title="Toggle the settings tab">
    <settings-tab v-cloak v-on:change="handleSettingsChange" v-on:attach-label="handleAttachAllSelected" inline-template>
        <div class="settings-tab">
            <h4>Settings</h4>

            <div class="settings-tab__section">
                <label title="Set the opacity of annotations on the map">Annotation opacity (<span v-text="annotationOpacity"></span>)</label>
                <input type="range" min="0" max="1" step="0.01" v-model="annotationOpacity">
            </div>

            <div class="settings-tab__section">
                <div class="form-group">
                    <label title="Cycle through all annotations">Cycle through annotations <small>(Volare)</small></label>
                    <div class="btn-group">
                        <button type="button" class="btn btn-default" :class="{active: isVolareActive}" v-on:click="startVolare" title="Start cycling through all annotations">on</button>
                        <button type="button" class="btn btn-default" :class="{active: !isVolareActive}" v-on:click="resetCycleMode" title="Stop cycling through all annotations 𝗘𝘀𝗰">off</button>
                    </div>
                    <div class="btn-group">
                        @can('add-annotation', $image)
                            <button class="btn btn-default" :disabled="!isVolareActive" v-on:click="emitAttachLabel" title="Attach the current label to the selected annotation 𝗘𝗻𝘁𝗲𝗿"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                        @endcan
                    </div>
                </div>
                <p class="help-text">Use the annotation filter to cycle through annotations with certain properties.</p>
            </div>

            <div class="settings-tab__section">
                <div class="form-group">
                    <label title="Cycle through image sections">Cycle through image sections <small>(Lawnmower mode)</small></label>
                    <div class="btn-group">
                        <button type="button" class="btn btn-default" :class="{active: isLawnmowerActive}" v-on:click="startLawnmower" title="Start cycling through image sections">on</button>
                        <button type="button" class="btn btn-default" :class="{active: !isLawnmowerActive}" v-on:click="resetCycleMode" title="Stop cycling through image sections 𝗘𝘀𝗰">off</button>
                    </div>
                </div>
            </div>

        </div>
    </settings-tab>
</sidebar-tab>
