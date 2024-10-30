<sidebar-tab name="annotations" icon="list" title="Annotations" class="sidebar__tab--nopad">
    <annotations-tab
        :files-data="filesData"
        :total-annotation-count="annotationCount"
        :selected-annotations="selectedAnnotations"
        :shapes="shapes"
        v-on:select="handleSelectAnnotation"
        v-on:deselect="handleDeselectAnnotation"
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
                         :can-detach-others="canDetachOthers"
                         :own-user-id="ownUserId"
                         v-on:select="handleSelect"
                         ></label-item>
                </ul>
                <!-- <div class="annotations-tab__plugins">
                    @mixin('annotationsAnnotationsTab')
                </div> -->
            </div>
    </annotations-tab>
</sidebar-tab>
