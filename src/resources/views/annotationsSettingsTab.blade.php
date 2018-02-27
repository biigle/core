@can ('add-annotations', $volume)
    <component :is="plugins.exampleAnnotations" :settings="settings" inline-template>
        <div class="sidebar-tab__section">
            <power-button :active="isShown" title-off="Show example annotations" title-on="Hide example annotations" v-on:on="show" v-on:off="hide">Example Annotations</power-button>
        </div>
    </component>
@endcan
