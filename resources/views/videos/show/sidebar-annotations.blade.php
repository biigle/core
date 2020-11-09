<sidebar-tab
    name="annotations"
    icon="map-marker-alt"
    title="Annotations"
    class="sidebar__tab--nopad"
    :highlight="hasActiveAnnotationFilter"
    >
        <annotations-tab
            :annotations="filteredAnnotations"
            :selected-annotations="selectedAnnotations"
            :annotation-filters="annotationFilters"
            :can-detach-others="@can('forceEditIn', $volume) true @else false @endcan"
            :has-active-filter="hasActiveAnnotationFilter"
            :own-user-id="{{$user->id}}"
            v-on:select="selectAnnotation"
            v-on:deselect="deselectAnnotation"
            v-on:detach="detachAnnotationLabel"
            v-on:select-filter="setActiveAnnotationFilter"
            v-on:unselect-filter="resetAnnotationFilter"
            inline-template
            >
                <div class="annotations-tab">
                    <filters
                         :annotation-filters="annotationFilters"
                         :has-active-filter="hasActiveFilter"
                         v-on:select="emitSelectFilter"
                         v-on:unselect="emitUnselectFilter"
                        ></filters>
                    <ul class="annotations-tab__list list-unstyled" ref="scrollList">
                        <label-item
                             v-for="item in labelItems"
                             :key="item.id"
                             :label="item.label"
                             :annotations="item.annotations"
                             :can-detach-others="canDetachOthers"
                             :own-user-id="ownUserId"
                             v-on:select="handleSelect"
                             v-on:detach="emitDetach"
                             ></label-item>
                    </ul>
                </div>
        </annotations-tab>
</sidebar-tab>
