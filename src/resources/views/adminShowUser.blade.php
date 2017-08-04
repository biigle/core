<div class="col-xs-12">
    <p>
        @if ($projectCount > 0)
            Created <strong>{{$projectCount}}</strong> {{$projectCount === 1 ? 'project' : 'projects'}} ({{ $projectPercent}} %).
        @else
            Created no projects yet.
        @endif
    </p>
</div>
