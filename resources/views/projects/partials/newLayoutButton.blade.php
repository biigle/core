<form method="POST" action="{{ url('api/v1/users/my/settings') }}" style="display: inline-block;">
    <input type="hidden" name="project_overview_v1" value="0">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <div class="form-group">
        <button type="submit" class="btn btn-info" title="Switch to the new layout of the project overview">New layout</button>
    </div>
</form>
