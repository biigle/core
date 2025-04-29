<template>
    <div class="annotations-tab">
        <div class="annotations-tab__header">
            <filters
                :has-active-filter="hasActiveFilter"
                :annotations="allAnnotations"
                @select="emitSelectFilter"
                @unselect="emitUnselectFilter"
                ></filters>
            <div v-if="annotationsHiddenByFilter" class="text-info">
                Some annotations are hidden by a filter.
            </div>
            <div class="text-muted">
                Total <span class="pull-right badge">{{annotationBadgeCount}}</span>
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
                @select="handleSelect"
                @detach="emitDetach"
                ></label-item>
        </ul>
    </div>
</template>
<script>
import AnnotationsTab from '@/annotations/components/annotationsTab.vue';

/**
 * The specific implementation of the annotations tab for the video annotation tool.
 */
export default {
    extends: AnnotationsTab,
    emits: [
        'deselect',
        'select',
    ],
    methods: {
        handleSelect(annotation, shift) {
            if (annotation.isSelected && shift) {
                this.$emit('deselect', annotation);
            } else {
                this.$emit('select', annotation, annotation.startFrame, shift);
            }
        },
    },
};
</script>
