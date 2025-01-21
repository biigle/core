<form v-on:submit.prevent="findName">
    <div class="row">
        <div class="col-xs-12 help-block">
            Import labels from <a href="http://marinespecies.org" target="_blank">WoRMS</a>. First, choose a color for the new label. Then search the WoRMS item based on the scientific name. Last, select the item you want to import from the search results.
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <input type="color" class="form-control" title="Label color" v-model="selectedColor" />
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Get a random color" v-on:click="refreshColor"><span class="fa fa-sync-alt" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <input type="text" class="form-control" placeholder="Label name" title="WoRMS label name" v-model="selectedName" />
                <span class="input-group-btn">
                    <button class="btn btn-success" type="submit" title="Find a label from WoRMS" :disabled="hasNoName || null"><span class="fa fa-search fa-fw" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-6">
            <div class="btn-group btn-group-justified">
                <div class="btn-group">
                    <button type="button" class="btn btn-default" v-on:click="toggleUnaccepted" :class="unacceptedButtonClass" title="Include unaccepted items from WoRMS in the results">
                        unaccepted
                    </button>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-default" v-on:click="toggleRecursive" :class="recursiveButtonClass" title="Recursively import all parent labels from WoRMS (if they don't already exist)">
                        recursive
                    </button>
                </div>
            </div>
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <typeahead class="typeahead--block" placeholder="Label parent" :disabled="hasNoLabels" title="Parent label" :items="labels" :value="selectedParent" v-on:select="selectLabel" ></typeahead>
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Reset parent" v-on:click="resetParent" v-bind:disabled="hasNoParent || null"><span class="fa fa-times fa-fw" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-12" v-if="hasSearched">
            <ul class="list-group list-group-restricted">
                <worms-result-item
                    v-for="result in results"
                    :key="result.aphia_id"
                    :item="result"
                    :recursive="recursive"
                    :parent="parent"
                    :labels="labels"
                    v-on:select="importItem"
                    ></worms-result-item>
                <li class="list-group-item text-muted" v-if="hasSearched && !hasResults">
                    No results from WoRMS search
                </li>
            </ul>
        </div>
    </div>
</form>
