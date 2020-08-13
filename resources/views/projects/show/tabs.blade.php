<ul class="nav nav-tabs project-tabs">
    <li role="presentation" @if ($activeTab === 'volumes') class="active" @endif>
        <a href="{{route('project', $project->id)}}" title="Show the volumes attached to the project"><i class="fa fa-folder"></i> Volumes <span class="badge">{{readable_number($project->volumes()->count())}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'label-trees') class="active" @endif>
        <a href="{{route('project-label-trees', $project->id)}}" title="Show the label trees attached to the project"><i class="fa fa-tags"></i> Label Trees <span class="badge">{{readable_number($project->labelTrees()->count())}}</span></a>
    </li>
    <li role="presentation" @if ($activeTab === 'members') class="active" @endif>
        <a href="#" title="Show the members of the project"><i class="fa fa-users"></i> Members <span class="badge">{{readable_number($project->users()->count())}}</span></a>
    </li>
    @mixin('projectsShowV2Tabs')
</ul>
