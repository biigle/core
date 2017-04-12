<sorting-tab v-cloak :volume-id="volumeId" :image-ids="imageIds" v-on:loading="toggleLoading" v-on:update="updateSortingSequence" inline-template>
    <div class="sorting-tab">
        <div class="sorting-tab__buttons">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Sort ascending" :class="{active: isSortedAscending}" v-on:click="sortAscending"><span class="glyphicon glyphicon-sort-by-attributes" aria-hidden="true"></span></button>
                <button type="button" class="btn btn-default" title="Sort descending" :class="{active: isSortedDescending}" v-on:click="sortDescending"><span class="glyphicon glyphicon-sort-by-attributes-alt" aria-hidden="true"></span></button>
            </div>
            <div class="btn-group pull-right" role="group">
                <button type="button" class="btn btn-default" title="Reset sorting" v-on:click="reset"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
            </div>
        </div>

        <div class="list-group sorter-list-group">
            <component :is="sorter.component" :active-sorter="activeSorter" v-on:select="handleSelect" v-for="sorter in sorters"></component>
        </div>
    </div>
</sorting-tab>
