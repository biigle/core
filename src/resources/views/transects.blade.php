<button class="btn btn-default" title="Go to the annotator when clicking an image" data-annotator-url="{{ route('annotate', '') }}" data-ng-controller="AnnotatorButtonController" data-ng-click="activate()" data-ng-class="{active:selected}"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button>

@section('scripts')
<script src="{{ asset('vendor/annotations/scripts/transects.js') }}"></script>
@append
