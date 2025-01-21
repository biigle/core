<filter-tab
    v-cloak
    :volume-id="volumeId"
    :file-ids="fileIds"
    :show-filenames="showFilenames"
    :loading-filenames="loadingFilenames"
    :type="type"
    v-on:loading="toggleLoading"
    v-on:update="updateFilterSequence"
    v-on:enable-filenames="enableFilenames"
    v-on:disable-filenames="disableFilenames"
    ></filter-tab>

@push('scripts')
<script type="text/html" id="filter-tab-template">
    <div class="filter-tab">
        <div class="filter-tab__buttons">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Show only files matching the filter rules" :class="{active: inFilterMode}" v-on:click="activateFilterMode"><span class="fa fa-filter" aria-hidden="true"></span></button>
                <button type="button" class="btn btn-default" title="Show all files but flag those matching the filter rules" :class="{active: inFlagMode}" v-on:click="activateFlagMode"><span class="fa fa-flag" aria-hidden="true"></span></button>
            </div>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Use the 'and' operator for filter rules" :class="{active: usesAndOperator}" v-on:click="activateAndOperator">and</button>
                <button type="button" class="btn btn-default" title="Use the 'or' operator for filter rules" :class="{active: usesOrOperator}" v-on:click="activateOrOperator">or</button>
            </div>
            <div class="btn-group pull-right" role="group">
                <button type="button" class="btn btn-default" title="Clear all filter rules" v-on:click="reset"><span class="fa fa-times" aria-hidden="true"></span></button>
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
            <button v-else-if="selectedFilter" type="submit" class="btn btn-default pull-right" v-on:click="addRule(null)" :disabled="loading || null">Add rule</button>
            <div v-if="helpText" class="help-block" v-text="helpText"></div>
        </form>
        <ul class="list-group">
            <li v-cloak v-for="(rule, index) in rules" class="list-group-item">
                <span v-if="index > 0" v-text="operator"></span><span v-else v-text="typeText"></span> <component :is="getListComponent(rule)" :rule="rule" :type="type" v-on:refresh="refreshRule"></component> <button type="button" class="close" title="Remove this rule" v-on:click="removeRule(index)"><span aria-hidden="true">&times;</span></button>
            </li>
            <li v-if="!hasRules" class="list-group-item text-muted">No filter rules</li>
        </ul>

        <power-toggle :active="showFilenames" title="Show the filename of each file" v-on:on="enableFilenames" v-on:off="disableFilenames">Show filenames</power-toggle> <loader :active="loadingFilenames"></loader>
    </div>
</script>
@endpush
