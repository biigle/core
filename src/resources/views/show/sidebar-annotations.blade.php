<sidebar-tab name="annotations" icon="map-marker-alt" title="Annotations" class="sidebar__tab--nopad">
    <annotations-tab
        :annotations="annotations"
        v-on:select="selectAnnotation"
        v-on:deselect="deselectAnnotation"
        v-on:detach="detachAnnotationLabel"
        inline-template>
        <div class="annotations-tab">
            <ul class="annotations-tab__list list-unstyled" ref="scrollList">
                <label-item
                    v-for="item in labelItems"
                    :key="item.id"
                    :label="item.label"
                    :annotations="item.annotations"
                    :can-detach-others="@can('forceEditIn', $video) true @else false @endcan"
                    :own-user-id="{{$user->id}}"
                    v-on:select="handleSelect"
                    v-on:detach="emitDetach"
                    ></label-item>
            </ul>
        </div>
    </annotations-tab>
</sidebar-tab>
