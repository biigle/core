<div id="label-trees-labels">
    <div class="row">
        <div class="col-xs-6">
            <div v-cloak class="panel panel-default">
                <label-tree class="label-tree--panel" name="{{$tree->name}}" :labels="labels" :show-title="false" :collapsible="false" :editable="editable" v-on:save="saveLabel" v-on:delete="deleteLabel" v-on:select="selectLabel" v-on:deselect="deselectLabel"></label-tree>
            </div>
        </div>
        @can('create-label', $tree)
            <div class="col-xs-6">
                <loader class="label-tree-labels-loader" :active="loading"></loader>
                <tabs v-cloak>
                    <tab title="New label">
                        <manual-label-form inline-template="" :labels="labels" :color="selectedColor" :parent="selectedLabel" :name="selectedName" v-on:color="selectColor" v-on:parent="selectLabel" v-on:name="selectName" v-on:submit="createLabel">
                            @include('label-trees.show.labels.manualLabelForm')
                        </manual-label-form>
                    </tab>
                    @if (config('biigle.offline_mode'))
                        <tab title="WoRMS label import" disabled="true"></tab>
                    @else
                        <tab title="WoRMS label import">
                            <worms-label-form inline-template="" :labels="labels" :color="selectedColor" :parent="selectedLabel" :name="selectedName" v-on:color="selectColor" v-on:parent="selectLabel" v-on:name="selectName" v-on:submit="createLabel" v-on:load-start="startLoading" v-on:load-finish="finishLoading">
                                @include('label-trees.show.labels.wormsLabelForm')
                            </worms-label-form>
                        </tab>
                    @endif
                </tabs>
            </div>
        @endcan
    </div>
</div>
