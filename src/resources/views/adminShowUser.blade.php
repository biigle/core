<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-body">
            @if ($totalAnnotationLabels > 0)
                Attached <strong>{{ $totalAnnotationLabels }}</strong> {{ str_plural('label', $totalAnnotationLabels) }} ({{ round($relativeAnnotationLabels * 100, 2)}}&nbsp;%) to <strong>{{ $totalAnnotations }}</strong> {{ str_plural('annotation', $totalAnnotations) }} ({{ round($relativeAnnotations * 100, 2) }}&nbsp;%). That's an average of {{ $labelsPerAnnotation }} {{ str_plural('label', $labelsPerAnnotation) }} per annotation. Recent annotations:
            @else
                Created no annotations yet.
            @endif
        </div>
        <ul class="list-group user-stats-list-group">
            @foreach ($recentAnnotations as $annotation)
                <li class="list-group-item">{{ $annotation->created_at }} (<a href="{{ route('show-annotation', $annotation->id) }}">#{{ $annotation->id }}</a>)</li>
            @endforeach
        </ul>
    </div>
</div>
