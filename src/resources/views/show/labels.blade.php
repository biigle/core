<labels-tab v-cloak :volume-id="volumeId" inline-template>
<label-trees :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
</labels-tab>
