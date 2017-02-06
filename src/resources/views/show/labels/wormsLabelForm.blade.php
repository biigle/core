<form v-on:submit.prevent="findName">
    <div class="row">
        <div class="col-xs-12 help-block">
            Import labels from <a href="http://marinespecies.org" target="_blank">WoRMS</a>. First, choose a color for the new label. Then search the WoRMS item based on the scientific name. Last, select the item you want to import from the search results.
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <input type="color" class="form-control" title="Label color" v-model="selectedColor" />
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Get a random color" v-on:click="refreshColor"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <input type="text" class="form-control" placeholder="Label name" title="WoRMS label name" v-model="selectedName" />
                <span class="input-group-btn">
                    <button class="btn btn-success" type="submit" title="Find a label from WoRMS" :disabled="hasNoName"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-6 form-group">
            <button type="button" class="btn btn-default btn-block" v-on:click="toggleRecursive" :class="recursiveButtonClass" title="Recursively import all parent labels from WoRMS (if they don't already exist)">
                Recursive
            </button>
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <typeahead class="typeahead--block" placeholder="Label parent" :disabled="hasNoLabels" title="Parent label" :items="labels" :value="selectedParent" v-on:select="selectLabel" ></typeahead>
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Reset parent" v-on:click="resetParent" v-bind:disabled="hasNoParent"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-12" v-if="hasSearched">
            <ul class="list-group list-group-restricted">
                <worms-result-item v-for="result in results" :item="result" :recursive="recursive" :parent="parent" :labels="labels" v-on:select="importItem" inline-template>
                    <li class="list-group-item" :class="classObject">
                        <small class="text-muted" v-text="classification"></small>
                        <div class="clearfix">
                            <span class="pull-right">
                                <button class="btn btn-default btn-xs" v-on:click.prevent="select" :title="buttonTitle" :disabled="selected"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                            </span>
                            <span v-text="item.rank"></span>: <a :href="item.url" target="_blank" title="Show WoRMS page" v-text="item.name"></a>
                        </div>
                    </li>
                </worms-result-item>
                <li class="list-group-item text-muted" v-if="hasSearched && !hasResults">
                    No results from WoRMS search
                </li>
            </ul>
        </div>
    </div>
</form>
