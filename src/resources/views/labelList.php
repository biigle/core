<sidebar-tab :disabled="isInRelabelStep" name="annotations" icon="list" title="Label list" class="sidebar__tab--nopad">
    <label-list
        :labels="labels"
        v-on:select="handleSelectedLabel"
        v-on:deselect="handleDeselectedLabel"
        inline-template
        >
            <div class="annotations-tab--largo">
                <div class="annotations-tab__header--largo">
                    <div class="text-muted">Total
                        <span
                            class="pull-right badge"
                            v-text="annotationBadgeCount"
                        ></span>          
                    </div> 
                </div>
                <ul class="annotations-tab__list--largo list-unstyled" ref="scrollList">
                    <label-item
                         v-for="item in labels"
                         :key="item.id"
                         :label="item"
                         v-on:select="handleSelectedLabel"
                         v-on:deselect="handleDeselectedLabel"
                         ></label-item>
                </ul>
            </div>
    </label-list>
</sidebar-tab>
