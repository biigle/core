<sidebar-tab name="settings" icon="cog" title="Toggle the settings tab">
    <settings-tab v-cloak v-on:change="handleSettingsChange" v-on:attach-label="handleAttachAllSelected" inline-template>
        <div class="settings-tab">
            <h4>Settings</h4>

            <div class="settings-tab__section">
                <screenshot-button inline-template>
                    <button class="btn btn-default" :title="screenshotTitle" :disabled="!screenshotSupported" v-on:click="capture"><span class="glyphicon glyphicon-camera" aria-hidden="true"></span> Capture screenshot</button>
                </screenshot-button>
            </div>

            <div class="settings-tab__section">
                <label title="Set the opacity of annotations on the map">Annotation opacity (<span v-text="annotationOpacity"></span>)</label>
                <input type="range" min="0" max="1" step="0.1" v-model="annotationOpacity">
            </div>

            <div class="settings-tab__section">
                <label title="Cycle through all annotations">Volare<br><small>Cycle through annotations</small></label>
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

            <div class="settings-tab__section">
                <label title="Cycle through image sections">Lawnmower mode<br><small>Cycle through image sections</small></label>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: isLawnmowerActive}" v-on:click="startLawnmower" title="Start cycling through image sections">on</button>
                    <button type="button" class="btn btn-default" :class="{active: !isLawnmowerActive}" v-on:click="resetCycleMode" title="Stop cycling through image sections 𝗘𝘀𝗰">off</button>
                </div>
            </div>

            <div class="settings-tab__section">
                <label>Mouse position</label>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: mousePosition}" v-on:click="showMousePosition" title="Show mouse position">show</button>
                    <button type="button" class="btn btn-default" :class="{active: !mousePosition}" v-on:click="hideMousePosition" title="Hide mouse position">hide</button>
                </div>
            </div>

            @foreach ($modules->getMixins('annotationsSettingsTab') as $module => $nestedMixins)
                @include($module.'::annotationsSettingsTab', ['mixins' => $nestedMixins])
            @endforeach

        </div>
    </settings-tab>
</sidebar-tab>
