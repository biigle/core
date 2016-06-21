@if($recentTransect)
    <div class="panel panel-info">
        <div class="panel-heading">Most recently edited transect</div>
        <div class="panel-body dashboard__hot-thumbnail">
            <figure class="image-thumbnail">
                <a href="{{ route('transect', $recentTransect->id) }}" title="Show transect {{$recentTransect->name}}">
                    @if ($recentTransectImage && File::exists($recentTransectImage->thumbPath))
                        <img src="{{ url('api/v1/images/'.$recentTransectImage->id.'/thumb') }}">
                    @else
                        <img src="{{ asset(config('thumbnails.empty_url')) }}">
                    @endif
                    <figcaption class="caption">
                        {{ $recentTransect->name }}
                    </figcaption>
                </a>
            </figure>
        </div>
    </div>
@endif
