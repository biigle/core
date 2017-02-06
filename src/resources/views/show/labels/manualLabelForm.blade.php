<form v-on:submit.prevent="submit">
    <div class="row">
        <div class="col-xs-12 help-block">
            To add a new label, choose a color, an optional parent label and a name.
        </div>
        <div class="col-xs-4 form-group">
            <div class="input-group">
                <input type="color" class="form-control" title="Label color" v-model="selectedColor" />
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Get a random color" v-on:click="refreshColor"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-4 form-group">
            <div class="input-group">
                <typeahead class="typeahead--block" placeholder="Label parent" :disabled="hasNoLabels" title="Parent label" :items="labels" :value="selectedParent" v-on:select="selectLabel" ></typeahead>
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Reset parent" v-on:click="resetParent" v-bind:disabled="hasNoParent"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-4 form-group">
            <div class="input-group">
                <input type="text" class="form-control" placeholder="Label name" title="New label name" v-model="selectedName" />
                <span class="input-group-btn">
                    <button class="btn btn-success" type="submit" title="Add the new label" v-bind:disabled="hasNoName"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
    </div>
</form>
