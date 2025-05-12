<sidebar-tab :disabled="isInRelabelStep || null" name="label-list" icon="list" title="Label list" class="sidebar__tab--nopad">
    <label-list
        :labels="labels"
        v-on:select="handleSelectedLabel"
        v-on:deselect="handleDeselectedLabel"
        ></label-list>
</sidebar-tab>
