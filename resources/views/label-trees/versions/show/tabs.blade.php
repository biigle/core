<ul class="nav nav-tabs project-tabs">
    <li role="presentation" @if ($activeTab === 'labels') class="active" @endif>
        <a href="{{route('label-trees', $tree->id)}}" title="Show the labels of this label tree"><i class="fa fa-tags"></i> Labels <span class="badge" id="label-trees-labels-count">{{$tree->labels()->count()}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'projects') class="active" @endif>
        <a href="{{route('label-tree-projects', $tree->id)}}" title="Show the projects that belong to this label tree"><i class="fa fa-folder"></i> Projects <span class="badge" id="label-trees-projects-count">{{$tree->projects()->count()}}</span></a>
    </li>
    @mixin('labelTreesShowTabs')
    @if ($version->doi)
        <li class="pull-right">
            <a href="https://doi.org/{{$version->doi}}" title="DOI: {{$version->doi}}">
                DOI: <strong>{{$version->doi}}</strong>
            </a>
        </li>
    @else
        @can('update', $version)
            <li id="label-tree-version-doi" class="pull-right">
                <a v-if="doiSaved" v-cloak v-bind:href="doiUrl" v-bind:title="doiTitle">
                    DOI: <strong v-text="doi"></strong>
                </a>
                <span v-else class="form-inline">
                    <input type="text" class="form-control" name="doi" id="doi" placeholder="Set a DOI..." v-model="doi" v-on:keyup.enter="saveDoi" title="Insert a DOI for this label tree version and press enter">
                </span>
            </li>
        @endcan
    @endif
</ul>
