<span class="dropdown">
    <button type="button" class="btn btn-default">
        Version: <strong>{{$version->name}}</strong>
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
        <li><a href="{{route('label-trees', $masterTree->id)}}" title="Show latest version">latest</a></li>
        @foreach($masterTree->versions->sortByDesc('id') as $v)
            <?php if ($version->id === $v->id) continue; ?>
            <li><a href="{{route('label-tree-versions', [$masterTree->id, $v->id])}}" title="Show version {{$v->name}}">{{$v->name}}</a></li>
        @endforeach
    </ul>
</span>
@if ($version->doi)
    <a class="btn btn-default" href="https://doi.org/{{$version->doi}}" title="DOI: {{$version->doi}}">
        DOI: <strong>{{$version->doi}}</strong>
    </a>
@else
    @can('update', $version)
        <a v-if="doiSaved" v-cloak class="btn btn-default" v-bind:href="doiUrl" v-bind:title="doiTitle">
            DOI: <strong v-text="doi"></strong>
        </a>
        <span v-else class="form-inline">
            <input type="text" class="form-control" name="doi" id="doi" placeholder="Set a DOI..." v-model="doi" v-on:keyup.enter="saveDoi" title="Insert a DOI for this label tree version and press enter">
        </span>
    @endcan
@endif
