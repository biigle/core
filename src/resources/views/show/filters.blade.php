<filter-tab v-cloak :volume-id="volumeId" :image-ids="imageIds" v-on:loading="toggleLoading" v-on:update="updateFilterSequence" inline-template>
    <div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default" title="Show only images matching the filter rules" data-ng-class="{active: isFilterMode('filter')}" data-ng-click="setFilterMode('filter')"><span class="glyphicon glyphicon-filter" aria-hidden="true"></span></button>
            <button type="button" class="btn btn-default" title="Show all images but flag those matching the filter rules" data-ng-class="{active: isFilterMode('flag')}" data-ng-click="setFilterMode('flag')"><span class="glyphicon glyphicon-flag" aria-hidden="true"></span></button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default" title="Clear all filter rules" data-ng-click="resetFiltering()" data-ng-disabled="!active()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
        </div>

        <form class="form-inline" v-on:submit.prevent="addRule">
            <div class="form-group">
                <select class="form-control" v-model="negate" required>
                    <option :value="false">has</option>
                    <option :value="true">has no</option>
                </select>
            </div>
            <div class="form-group">
                <select class="form-control" v-model="selectedFilterId" required>
                    <option v-for="filter in filters" :value="filter.id" v-text="filter.label"></option>
                </select>
            </div>
            <div v-if="hasSelectComponent">
                <component :is="selectComponent" :volume-id="volumeId" v-on:select="addRule"></component>
            </div>
            <button type="submit" class="btn btn-default">Add</button>
        </form>
        <h3>Filter rules:</h3>
        <ul class="list-group">
            <li v-cloak v-for="(rule, index) in rules" class="list-group-item">
                <span v-if="index > 0">and</span> <component :is="rule.id + 'List'" :rule="rule"></component> <button type="button" class="close pull-right" title="Remove this rule" v-on:click="removeRule(index)"><span aria-hidden="true">&times;</span></button>
            </li>
            <li v-if="!hasRules" class="list-group-item text-muted">No filter rules</li>
        </ul>
    </div>
</filter-tab>
