@if($recentTransect)
    <div id="transect-dashboard-hot-box-right" class="panel panel-info">
        <div class="panel-heading">Most recently edited transect</div>
        <div class="panel-body dashboard__hot-thumbnail">
            <a href="{{route('transect', $recentTransect->id)}}" title="Show transect {{$recentTransect->name}}">
                <transect-thumbnail class="transect-thumbnail" tid="{{$recentTransect->id}}" uri="{{asset(config('thumbnails.uri'))}}" format="{{config('thumbnails.format')}}">
                    @if ($recentTransect->thumbnail)
                        <img src="{{ asset(config('thumbnails.uri').'/'.$recentTransect->thumbnail->uuid.'.'.config('thumbnails.format')) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    @else
                        <img src="{{ asset(config('thumbnails.empty_url')) }}">
                    @endif
                    <figcaption slot="caption">{{$recentTransect->name}}</figcaption>
                </transect-thumbnail>
            </a>
        </div>
    </div>
@endif
