@if($recentVolume)
    <div id="volume-dashboard-hot-box-right" class="panel panel-info">
        <div class="panel-heading">Most recently edited volume</div>
        <div class="panel-body dashboard__hot-thumbnail">
            <a href="{{route('volume', $recentVolume->id)}}" title="Show volume {{$recentVolume->name}}">
                <volume-thumbnail class="volume-thumbnail" v-bind:tid="{{$recentVolume->id}}" uri="{{ thumbnail_url() }}" format="{{config('thumbnails.format')}}">
                    @if ($recentVolume->thumbnail)
                        <img src="{{ thumbnail_url($recentVolume->thumbnail->uuid) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    @else
                        <img src="{{ asset(config('thumbnails.empty_url')) }}">
                    @endif
                    <figcaption slot="caption">{{$recentVolume->name}}</figcaption>
                </volume-thumbnail>
            </a>
        </div>
    </div>
@endif
