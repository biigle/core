<labels-tab
    v-cloak
    :volume-id="volumeId"
    :show-labels="showLabels"
    :loading-labels="loadingLabels"
    v-on:select="handleSelectedLabel"
    v-on:deselect="handleDeselectedLabel"
    v-on:enable-labels="enableLabels"
    v-on:disable-labels="disableLabels"
    inline-template
    >
    <div>
        <div class="form-group">
            <power-toggle
                title="Show the labels of each {{$type}}"
                :active="showLabels"
                v-on:on="enableLabels"
                v-on:off="disableLabels"
                >
                    Show labels of each {{$type}}
            </power-toggle>
            <loader :active="loadingLabels"></loader>
        </div>
        <label-trees
            :trees="labelTrees"
            :show-favourites="true"
            v-on:select="handleSelectedLabel"
            v-on:deselect="handleDeselectedLabel"
            v-on:clear="handleDeselectedLabel"
            ></label-trees>
    </div>
</labels-tab>
