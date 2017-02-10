<filter-tab v-cloak :volume-id="volumeId" :image-ids="imageIds" v-on:loading="toggleLoading" v-on:update="updateFilterSequence" inline-template>
    <div class="filter-tab">
        <div class="filter-tab__buttons">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Show only images matching the filter rules" :class="{active: inFilterMode}" v-on:click="activateFilterMode"><span class="glyphicon glyphicon-filter" aria-hidden="true"></span></button>
                <button type="button" class="btn btn-default" title="Show all images but flag those matching the filter rules" :class="{active: inFlagMode}" v-on:click="activateFlagMode"><span class="glyphicon glyphicon-flag" aria-hidden="true"></span></button>
            </div>
            <div class="btn-group pull-right" role="group">
                <button type="button" class="btn btn-default" title="Clear all filter rules" v-on:click="reset"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
            </div>
        </div>

        <form class="form clearfix" v-on:submit.prevent>
            <div class="filter-form__selects">
                <div class="form-group">
                    <select class="form-control" v-model="negate" required>
                        <option :value="false">has</option>
                        <option :value="true">has no</option>
                    </select>
                </div>
                <div class="form-group filter-select">
                    <select class="form-control" v-model="selectedFilterId" required>
                        <option v-for="filter in filters" :value="filter.id" v-text="filter.label"></option>
                    </select>
                </div>
            </div>
            <div v-if="hasSelectComponent" class="select-component">
                <component :is="selectComponent" :volume-id="volumeId" v-on:select="addRule"></component>
            </div>
            <button v-else v-if="selectedFilter" type="submit" class="btn btn-default pull-right" v-on:click="addRule">Add rule</button>
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
