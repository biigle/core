<component :is="plugins.exportArea" :settings="settings" inline-template>
    <div class="settings-tab__section">
        <label title="Opacity of the export area">Export Area Opacity (<span v-if="shown" v-text="opacity"></span><span v-else>hidden</span>)</label>
        <div class="form-group">
            <input type="range" min="0" max="1" step="0.1" v-model="opacityValue">
        </div>
        @can('update', $volume)
            <button class="btn btn-default" title="Edit the export area for this volume" v-on:click="toggleEditing" :class="{active:isEditing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> Edit</button>
            <button class="btn btn-default" title="Delete the export area for this volume" v-on:click="deleteArea" :disabled="!hasExportArea"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Delete</button>
        @endcan
    </div>
</component>
