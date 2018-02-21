<sidebar-tab name="annotation-modes" icon="th" title="Annotation modes">
    <annotation-modes-tab v-on:attach-h5="handleAttachAllSelected" v-on:change="handleAnnotationModeChange" inline-template>
        <div class="annotation-modes-tab">
            <div class="sidebar-tab__section">
                <h5 title="Cycle through all annotations">Volume Label Review<br><small>cycle through annotations</small></h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: isVolareActive}" v-on:click="startVolare" title="Start cycling through all annotations">on</button>
                    <button type="button" class="btn btn-default" :class="{active: !isVolareActive}" v-on:click="resetMode" title="Stop cycling through all annotations 𝗘𝘀𝗰">off</button>
                </div>
                <div class="btn-group">
                    @can('add-annotation', $image)
                        <button class="btn btn-default" :disabled="!isVolareActive" v-on:click="emitAttachLabel" title="Attach the current h5 to the selected annotation 𝗘𝗻𝘁𝗲𝗿"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                    @endcan
                </div>
            </div>

            <div class="sidebar-tab__section">
                <h5 title="Cycle through image sections">Lawnmower Mode<br><small>cycle through image sections</small></h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" :class="{active: isLawnmowerActive}" v-on:click="startLawnmower" title="Start cycling through image sections">on</button>
                    <button type="button" class="btn btn-default" :class="{active: !isLawnmowerActive}" v-on:click="resetMode" title="Stop cycling through image sections 𝗘𝘀𝗰">off</button>
                </div>
            </div>
            <div class="sidebar-tab__section">
                <h5 title="Randomly sample annotations">Random Sampling<br><small>randomly sample annotations</small></h5>
            </div>

            <div class="sidebar-tab__section">
                <h5 title="Regularly sample annotations">Regular Sampling<br><small>regularly sample annotations</small></h5>
            </div>
        </div>
    </annotation-modes-tab>
</sidebar-tab>
