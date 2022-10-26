<ul class="nav nav-tabs project-tabs">
    <li role="presentation" @if ($activeTab === 'volumes') class="active" @endif>
        <a href="{{route('project', $project->id)}}" title="Show the volumes attached to the project"><i class="fa fa-folder"></i> Volumes <span class="badge" id="project-volumes-count">{{$project->volumes()->count()}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'label-trees') class="active" @endif>
        <a href="{{route('project-label-trees', $project->id)}}" title="Show the label trees attached to the project"><i class="fa fa-tags"></i> Label Trees <span class="badge" id="project-label-trees-count">{{$project->labelTrees()->count()}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'members') class="active" @endif>
        <a href="{{route('project-members', $project->id)}}" title="Show the members of the project"><i class="fa fa-users"></i> Members <span class="badge" id="project-members-count">{{$project->users()->count()}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'charts') class="active" @endif>
        <a href="{{route('project-charts', $project->id)}}" title="Show charts of the project"><i class="fa fa-chart-bar"></i> Charts</a>
    </li>
    @mixin('projectsShowTabs')
</ul>
