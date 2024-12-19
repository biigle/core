<div v-if="hasConflictingLabels" v-cloak class="panel panel-default" v-bind:class="panelClass">
    <div class="panel-body" v-bind:class="panelBodyClass">
        The following labels are in conflict with existing labels. Choose what information should be retained during the import by selecting it.
    </div>
    <table class="table">
        <thead>
            <tr>
                <th class="choosable-information" title="Choose import information for all labels" v-on:click="chooseAllImportInformation">Import label information</th>
                <th class="choosable-information" title="Choose existing information for all labels" v-on:click="chooseAllExistingInformation">Existing label information</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="label in conflictingLabels">
                <td>
                    <span v-if="hasLabelConflictingName(label)" class="choosable-information" title="Choose the import name for this label" v-on:click="chooseImportName(label)" v-bind:class="{chosen: label.conflicting_name_resolution === 'import'}">
                        Name: <span v-text="label.name"></span>
                    </span>
                    <span v-else class="text-muted" v-text="label.name"></span><br>
                    <span v-if="hasLabelConflictingParent(label)" class="choosable-information" title="Choose the import parent for this label" v-on:click="chooseImportParent(label)" v-bind:class="{chosen: label.conflicting_parent_resolution === 'import'}">
                        Parent: <span v-if="label.parent" v-text="label.parent.name"></span><span v-else class="text-muted">None</span>
                    </span>
                </td>
                <td>
                    <span v-if="hasLabelConflictingName(label)" class="choosable-information" title="Choose the existing name for this label" v-on:click="chooseExistingName(label)" v-bind:class="{chosen: label.conflicting_name_resolution === 'existing'}">
                        Name: <span v-text="label.conflicting_name"></span>
                    </span><br>
                    <span v-if="hasLabelConflictingParent(label)" class="choosable-information" title="Choose the existing parent for this label" v-on:click="chooseExistingParent(label)" v-bind:class="{chosen: label.conflicting_parent_resolution === 'existing'}">
                        Parent: <span v-if="label.conflicting_parent" v-text="label.conflicting_parent.name"></span><span v-else class="text-muted">None</span>
                    </span>
                </td>
                <td>
                    <i v-if="isLabelConflictResolved(label)" class="fa fa-check text-success" title="Conflict resolved"></i>
                    <i v-else class="fa fa-times text-danger" title="Unresolved conflict"></i>
                </td>
            </tr>
        </tbody>
    </table>
</div>
