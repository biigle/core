@can('create', [Biigle\LabelTreeVersion::class, $tree])
    <dropdown menu-right>
        <button type="button" class="btn btn-default dropdown-toggle">
            Version: <strong>latest</strong>
            <span class="caret"></span>
        </button>
        <template #dropdown>
            <li><a href="{{route('create-label-tree-versions', $tree->id)}}" title="Create a new version of this label tree"><i class="fa fa-plus"></i> new version</a></li>
            @if ($tree->versions->isNotEmpty())
                <li class="divider"></li>
                @foreach($tree->versions->sortByDesc('id') as $version)
                    <li><a href="{{route('label-tree-versions', [$tree->id, $version->id])}}" title="Show version {{$version->name}}">{{$version->name}}</a></li>
                @endforeach
            @endif
        </template>
    </dropdown>
@else
    @if ($tree->versions->isNotEmpty())
        <dropdown menu-right>
            <button type="button" class="btn btn-default dropdown-toggle">
                Version: <strong>latest</strong>
                <span class="caret"></span>
            </button>
            <template #dropdown>
                @foreach($tree->versions->sortByDesc('id') as $version)
                    <li><a href="{{route('label-tree-versions', [$tree->id, $version->id])}}" title="Show version {{$version->name}}">{{$version->name}}</a></li>
                @endforeach
            </template>
        </dropdown>
    @else
        <button type="button" class="btn btn-default" disabled>
            Version: <strong>latest</strong>
        </button>
    @endif
@endcan
