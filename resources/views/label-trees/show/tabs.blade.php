<ul class="nav nav-tabs project-tabs">
    <li role="presentation" @if ($activeTab === 'labels') class="active" @endif>
        <a href="{{route('label-trees', $tree->id)}}" title="Show the labels of this label tree"><i class="fa fa-tags"></i> Labels <span class="badge" id="label-trees-labels-count">{{$tree->labels()->count()}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'projects') class="active" @endif>
        <a href="{{route('label-tree-projects', $tree->id)}}" title="Show the projects that belong to this label tree"><i class="fa fa-folder"></i> Projects <span class="badge">{{$tree->projects()->count()}}</span></a>
    </li>
    @can('update', $tree)
        <li role="presentation" @if ($activeTab === 'members') class="active" @endif>
            <a href="{{route('label-tree-members', $tree->id)}}" title="Show the members that belong to this label tree"><i class="fa fa-users"></i> Members <span class="badge" id="label-trees-members-count">{{$tree->members()->count()}}</span></a>
        </li>
    @endcan
    @mixin('labelTreesShowTabs')
</ul>
