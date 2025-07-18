<sidebar-tab name="labels" icon="tags" title="Label trees">
    <div class="labels-tab">
        <div class="labels-tab__trees">
            <label-trees
                :trees="labelTrees"
                :focus-input="focusInputFindlabel"
                :show-favourites="true"
                :selected-favourite-label="selectedFavouriteLabel"
                v-on:select="handleSelectedLabel"
                v-on:deselect="handleDeselectedLabel"
                v-on:clear="handleDeselectedLabel"
                ></label-trees>
        </div>
    </div>
</sidebar-tab>
