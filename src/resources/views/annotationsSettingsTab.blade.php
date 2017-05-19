@can ('add-annotations', $volume)
    <component :is="plugins.exampleAnnotations" :settings="settings" inline-template>
        <div class="settings-tab__section">
            <label>Example Annotations</label>
            <div class="btn-group">
                <button type="button" class="btn btn-default" :class="{active: isShown}" v-on:click="show" title="Show example annotations">show</button>
                <button type="button" class="btn btn-default" :class="{active: !isShown}" v-on:click="hide" title="Don't show example annotations">hide</button>
            </div>
        </div>
    </component>
@endcan
