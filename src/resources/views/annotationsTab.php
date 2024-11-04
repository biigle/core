<sidebar-tab name="annotations" icon="list" title="Annotations" class="sidebar__tab--nopad">
    <annotations-tab
        :files-data="filesData"
        :total-annotation-count="annotationCount"
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
                         v-for="item in labelItems"
                         :key="item.id"
                         :label="item.label"
                         :annotations="item.annotations"
                         :is-selected="selectedLabel && item.id == selectedLabel.id"
                         v-on:select="handleSelectedLabel"
                         v-on:deselect="handleDeselectedLabel"
                         ></label-item>
                </ul>
            </div>
    </annotations-tab>
</sidebar-tab>
