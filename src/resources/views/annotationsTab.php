<sidebar-tab :disabled="isInRelabelStep" name="annotations" icon="list" title="Annotations" class="sidebar__tab--nopad">
    <annotations-tab
        :annotation-labels="annotationLabels"
        :changed-annotations="changedAnnotations"
        v-on:select="handleSelectedLabel"
        v-on:deselect="handleDeselectedLabel"
        inline-template
        >
            <div class="annotations-tab">
                <div class="annotations-tab__header">
                    <div class="text-muted">Total
                        <span
                            class="pull-right badge"
                            v-text="annotationBadgeCount"
                        ></span>          
                    </div> 
                </div>
                <ul class="annotations-tab__list list-unstyled" ref="scrollList">
                    <label-item
                         v-for="item in labels"
                         :key="item.id"
                         :label="item.label"
                         :count="item.count"
                         :is-selected="isSelected(item)"
                         v-on:select="handleSelectedLabel"
                         v-on:deselect="handleDeselectedLabel"
                         ></label-item>
                </ul>
            </div>
    </annotations-tab>
</sidebar-tab>
