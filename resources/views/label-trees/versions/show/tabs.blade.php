@extends('label-trees.show.tabs')

@section('tabs-right')
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
@endsection
