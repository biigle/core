<sidebar-tab name="labels" icon="tags" title="Toggle label list 𝗧𝗮𝗯">
    <labels-tab inline-template>
        <label-trees :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
    </labels-tab>
</sidebar-tab>
