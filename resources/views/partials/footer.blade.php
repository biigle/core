<footer class="footer @if(isset($positionAbsolute) && $positionAbsolute) footer--absolute @endif">
    @mixin('footerItem')
    @if (isset($links) && is_array($links))
        @foreach($links as $link => $url)
            <a href="{{$url}}">{{$link}}</a>
        @endforeach
    @endif
</footer>
