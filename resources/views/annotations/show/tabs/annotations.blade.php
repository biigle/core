<sidebar-tab name="annotations" icon="map-marker-alt" title="Annotations" class="sidebar__tab--nopad" :highlight="hasAnnotationFilter">
    <annotations-tab
        :annotations="filteredAnnotations"
        :all-annotations="annotations"
        :total-annotation-count="annotationCount"
        :selected-annotations="selectedAnnotations"
        :can-detach-others="@can('forceEditIn', $volume) true @else false @endcan"
        :has-active-filter="hasAnnotationFilter"
        :own-user-id="{{$user->id}}"
        :annotations-hidden-by-filter="annotationsHiddenByFilter"
        v-on:select="handleSelectAnnotation"
        v-on:deselect="handleDeselectAnnotation"
        v-on:focus="focusAnnotation"
        v-on:detach="handleDetachAnnotationLabel"
        v-on:select-filter="handleFilter"
        v-on:unselect-filter="resetFilter"
        ></annotations-tab>
</sidebar-tab>

@push('scripts')
<script type="text/html" id="annotations-tab-template">
    <div class="annotations-tab">
        <div class="annotations-tab__header">
            <filters
                 :has-active-filter="hasActiveFilter"
                 :annotations="allAnnotations"
                 v-on:select="emitSelectFilter"
                 v-on:unselect="emitUnselectFilter"
                ></filters>
            <div v-if="annotationsHiddenByFilter" class="text-info">
                Some annotations are hidden by a filter.
            </div>
            <div class="text-muted">
                Total
                <span
                    class="pull-right badge"
                    v-text="annotationBadgeCount"
                ></span>
            </div>
        </div>
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
                 v-on:focus="emitFocus"
                 ></label-item>
        </ul>
        <div class="annotations-tab__plugins">
            @mixin('annotationsAnnotationsTab')
        </div>
    </div>
</script>
@endpush
