<div class="col-xs-12">
    <p>
        <?php $count = Biigle\Project::where('creator_id', $shownUser->id)->count(); ?>
        @if ($count > 0)
            Created <strong>{{$count}}</strong> {{$count === 1 ? 'project' : 'projects'}} ({{ round($count / Biigle\Project::count() * 100, 2)}} %).
        @else
            Created no projects yet.
        @endif
    </p>
</div>
