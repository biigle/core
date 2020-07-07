<div id="label-trees-labels" class="panel panel-default" v-bind:class="classObject">
    <div class="panel-heading">
        Labels
        @can('create-label', $tree)
            <span class="pull-right">
                <loader :active="loading"></loader>
                <button class="btn btn-default btn-xs" title="Edit labels" v-on:click="toggleEditing" v-bind:class="{active: editing}"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    @can('create-label', $tree)
        <div v-if="editing" v-cloak class="panel-body panel-body--labels">
            <tabs>
                <tab header="Manual">
                    <manual-label-form inline-template="" :labels="labels" :color="selectedColor" :parent="selectedLabel" :name="selectedName" v-on:color="selectColor" v-on:parent="selectLabel" v-on:name="selectName" v-on:submit="createLabel">
                        @include('label-trees.show.labels.manualLabelForm')
                    </manual-label-form>
                </tab>
                @if (config('biigle.offline_mode'))
                    <tab header="WoRMS" disabled="true"></tab>
                @else
                    <tab header="WoRMS">
                        <worms-label-form inline-template="" :labels="labels" :color="selectedColor" :parent="selectedLabel" :name="selectedName" v-on:color="selectColor" v-on:parent="selectLabel" v-on:name="selectName" v-on:submit="createLabel" v-on:load-start="startLoading" v-on:load-finish="finishLoading">
                            @include('label-trees.show.labels.wormsLabelForm')
                        </worms-label-form>
                    </tab>
                @endif
            </tabs>
        </div>
    @endcan
    <label-tree class="label-tree--panel" name="{{$tree->name}}" :labels="labels" :show-title="false" :collapsible="false" :editable="editing && !loading" v-on:save="saveLabel" v-on:delete="deleteLabel" v-on:select="selectLabel" v-on:deselect="deselectLabel"></label-tree>
</div>
