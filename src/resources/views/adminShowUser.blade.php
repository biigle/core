<div class="col-xs-12">
    <p>
        <?php $count = Biigle\Volume::where('creator_id', $shownUser->id)->count(); ?>
        @if ($count > 0)
            Created <strong>{{$count}}</strong> {{$count === 1 ? 'volume' : 'volumes'}} ({{ round($count / Biigle\Volume::count() * 100, 2)}} %)
            <?php
                $imageCount = Biigle\Image::join('volumes', 'volumes.id', '=', 'images.volume_id')
                    ->where('volumes.creator_id', $shownUser->id)
                    ->count();
            ?>
            @if ($imageCount > 0)
                which {{$count === 1 ? 'contains' : 'contain'}} <strong>{{$imageCount}}</strong> {{$imageCount === 1 ? 'image' : 'images'}} ({{ round($imageCount / Biigle\Image::count() * 100, 2)}} %).
            @else
                which {{$count === 1 ? 'contains' : 'contain'}} no images.
            @endif
        @else
            Created no volumes yet.
        @endif
    </p>
</div>
