<form method="POST" action="{{ url('api/v1/users/my/settings') }}" style="display: inline-block;">
    <input type="hidden" name="project_overview_v1" value="1">
    <input type="hidden" name="_redirect" value="{{route('project', $project->id)}}">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <div class="form-group">
        <button type="submit" class="btn btn-link" title="Switch to the old layout of the project overview">Old layout</button>
    </div>
</form>
