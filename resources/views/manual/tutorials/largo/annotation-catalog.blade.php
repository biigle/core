@extends('manual.base')

@section('manual-title', 'Annotation Catalog')

@section('manual-content')
<div class="row">
    <p class="lead">
        The annotation catalog shows you all annotations with a certain label.
    </p>
    <p class="text-center">
        <a href="{{asset('assets/images/manual/largo/largo_1.jpg')}}"><img src="{{asset('assets/images/manual/largo/largo_1.jpg')}}" width="100%"></a>
    </p>
    <p>
        The annotation catalog is similar to <a href="{{route('manual-tutorials', ['largo', 'largo'])}}">Largo</a>: It shows annotation thumbnails in a grid. But in contrast to Largo, the annotation catalog displays all annotations that are visible to you, independently from any project or volume. Each <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}">label tree</a> has an annotation catalog.
    </p>
    <p>
        To open the annotation catalog of a label tree, visit the label tree overview and open the <button class="btn btn-default btn-xs"><i class="fa fa-book"></i> Annotation catalog</button> tab. Now choose a label in the sidebar on the right. If there are any annotations to which the selected label is attached and you have access to, thumbnails will be displayed in the grid on the left. You can navigate the thumbnail grid in the same way than the image grid of the <a href="{{route('manual-tutorials', ['volumes', 'volume-overview'])}}">volume overview</a>. Click on an annotation thumbnail to open the image or video annotation tool in a new window and focus on the annotation.
    </p>
    <p>
        The annotation catalog is a great way to access all the information that has been gathered with annotations in BIIGLE. It can be used as a "species guide" to train researchers to recognize certain species or objects. This can help to improve the annotation speed and accuracy.
    </p>
</div>
@endsection
