<h3>Label Trees</h3>
<h4>
    <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}">About Label Trees</a>
</h4>
<p>
    Learn what label trees are and how you can manage them.
</p>
<h4>
    <a href="{{route('manual-tutorials', ['label-trees', 'manage-labels'])}}">Manage Labels</a>
</h4>
<p>
    Larn how to create, modify or delete labels of a label tree.
</p>
@foreach ($modules->getMixins('labelTreesManual') as $module => $nestedMixins)
    @include($module.'::labelTreesManual')
@endforeach
