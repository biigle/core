<ul class="nav nav-tabs project-tabs">
    <li role="presentation" @if ($activeTab === 'labels') class="active" @endif>
        <a href="{{route('label-trees', $tree->id)}}" title="Show the labels of this label tree"><i class="fa fa-tags"></i> Labels <span class="badge" id="labels-count">{{readable_number($tree->labels()->count())}}</span></a>
    </li>
    {{-- <li role="presentation" @if ($activeTab === 'label-trees') class="active" @endif>
        <a href="{{route('project-label-trees', $project->id)}}" title="Show the label trees attached to the project"><i class="fa fa-tags"></i> Label Trees <span class="badge" id="project-label-trees-count">{{readable_number($project->labelTrees()->count())}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'members') class="active" @endif>
        <a href="{{route('project-members', $project->id)}}" title="Show the members of the project"><i class="fa fa-users"></i> Members <span class="badge" id="project-members-count">{{readable_number($project->users()->count())}}</span></a>
    </li> --}}
    @mixin('labelTreesShowTabs')
</ul>
