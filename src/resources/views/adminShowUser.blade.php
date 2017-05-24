<div class="col-xs-12">
    <p>
        <?php $count = Biigle\AnnotationLabel::where('user_id', $shownUser->id)->count(); ?>
        @if ($count > 0)
            <?php
                $annotationCount = Biigle\Annotation::join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                    ->where('annotation_labels.user_id', $shownUser->id)
                    ->distinct()
                    ->count('annotations.id');
                $average = round($count / $annotationCount, 2);
            ?>
            Attached <strong>{{$count}}</strong> {{$count === 1 ? 'label' : 'labels'}} ({{ round($count / Biigle\AnnotationLabel::count() * 100, 2)}} %) to <strong>{{$annotationCount}}</strong> {{$annotationCount === 1 ? 'annotation' : 'annotations'}} ({{ round($annotationCount / Biigle\Annotation::count() * 100, 2)}} %). That's an average of {{$average}} {{$average === 1.0 ? 'label' : 'labels'}} per annotation.
        @else
            Created no annotations yet.
        @endif
    </p>
</div>
