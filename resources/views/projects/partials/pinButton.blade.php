<form class="inline-block-form" action="{{url("api/v1/projects/{$project->id}/pin")}}" method="POST">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <input type="hidden" name="_redirect" value="{{ route('project', $project->id) }}">
    @if ($isPinned)
        <input type="hidden" name="_method" value="DELETE">
        <button class="btn btn-default" type="submit" title="Unpin this project from the dashboard">Unpin</button>
    @elseif ($canPin)
        <button class="btn btn-default" type="submit" title="Pin this project to the dashboard">Pin</button>
    @else
        <button class="btn btn-default" type="button" disabled title="You cannot pin more than three projects to the dashboard">Pin</button>
    @endif
</form>
