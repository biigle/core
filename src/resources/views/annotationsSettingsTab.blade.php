@can ('add-annotations', $volume)
    <component :is="plugins.exampleAnnotations" :settings="settings" inline-template>
        <div class="sidebar-tab__section">
            <h5>Example Annotations</h5>
            <div class="btn-group">
                <button type="button" class="btn btn-default" :class="{active: isShown}" v-on:click="show" title="Show example annotations">show</button>
                <button type="button" class="btn btn-default" :class="{active: !isShown}" v-on:click="hide" title="Don't show example annotations">hide</button>
            </div>
        </div>
    </component>
@endcan
