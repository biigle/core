<div class="panel panel-default">
    <div class="panel-heading">
        Volume information
    </div>
    <div class="panel-body">
        @if (session('saved'))
            <div class="alert alert-success" role="alert">
                The volume information was successfully updated.
            </div>
        @endif
        @if (session('reread'))
            <div class="alert alert-success" role="alert">
                The volume {{$type}}s are reprocessed.
            </div>
        @endif
        <form role="form" method="POST" action="{{ url('api/v1/volumes/'.$volume->id) }}">
            <div class="row">
                <div class="form-group col-xs-6{{ $errors->has('name') ? ' has-error' : '' }}">
                    <label for="name">Name</label>
                    <input type="text" class="form-control" name="name" id="name" value="{{ old('name', $volume->name) }}" placeholder="My volume" required>
                    @if($errors->has('name'))
                        <span class="help-block">{{ $errors->first('name') }}</span>
                    @endif
                </div>
                <div class="form-group col-xs-6">
                    <label for="media_type">Media Type</label>
                    <span class="form-control" id="media_type" readonly><i class="fa @if ($volume->isImageVolume()) fa-image @else fa-film @endif"></i> {{ucfirst($type)}} Volume</span>
                </div>
            </div>
            <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
                <label for="url">URL</label>
                @if (config('biigle.offline_mode'))
                    <input type="text" class="form-control" name="url" id="url" value="{{ old('url', $volume->url) }}" placeholder="local://images/volume" required>
                @else
                    <input type="text" class="form-control" name="url" id="url" value="{{ old('url', $volume->url) }}" placeholder="https://my-domain.tld/volume" required>
                @endif
                <p class="help-block">
                    @if (config('biigle.offline_mode'))
                      The volume directory on the BIIGLE server (e.g. <code>local://files/volume</code>).
                   @else
                      The volume directory of a <a href="{{route('manual-tutorials', ['volumes', 'remote-volumes'])}}">remote volume</a> (e.g. <code>https://my-domain.tld/volume</code>) or on the BIIGLE server (e.g. <code>local://files/volume</code>).
                   @endif
                </p>
                @if($errors->has('url'))
                    <span class="help-block">{{ $errors->first('url') }}</span>
                @endif
            </div>
            <div class="row">
                <div class="form-group col-xs-12{{ $errors->has('handle') ? ' has-error' : '' }}">
                    <label for="handle">Handle or DOI</label>
                    <input type="text" class="form-control" name="handle" id="handle" value="{{ old('handle', $volume->handle) }}" placeholder="10.1000/xyz123">
                    @if($errors->has('handle'))
                        <span class="help-block">{{ $errors->first('handle') }}</span>
                    @endif
                </div>
            </div>
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="hidden" name="_method" value="PUT">
            <input type="hidden" name="_redirect" value="{{ route('volume-edit', $volume->id) }}">
            <input type="submit" class="btn btn-success" value="Save">
        </form>
    </div>
</div>

<div class="panel panel-default">
    <div class="panel-heading">
        Enabled annotation tools
    </div>
    <div class="panel-body">
        <p class="text-muted">
            Select which annotation tools should be available when annotating this volume. If none are selected, all tools will be available.
        </p>
        
        <form role="form" method="POST" action="{{ url('api/v1/volumes/'.$volume->id.'/annotation-tools') }}">
            <div class="row">
                <div class="col-sm-12">
                    <div class="annotation-tools-selector">
                        <div class="btn-group drawing-controls">
                        <!-- Point tool (Both - supports object tracking for video) -->
                        <div class="checkbox-control-button">
                            <input type="checkbox" name="tools[]" id="tool-point" value="point" @if (in_array('point', $volume->enabledAnnotationTools())) checked @endif>
                            <label for="tool-point" class="control-button" title="Draw a point">
                                <i class="icon icon-white icon-point"></i>
                            </label>
                        </div>
                        
                        <!-- Rectangle tool (Both) -->
                        <div class="checkbox-control-button">
                            <input type="checkbox" name="tools[]" id="tool-rectangle" value="rectangle" @if (in_array('rectangle', $volume->enabledAnnotationTools())) checked @endif>
                            <label for="tool-rectangle" class="control-button" title="Draw a rectangle">
                                <i class="icon icon-white icon-rectangle"></i>
                            </label>
                        </div>
                        
                        @if ($volume->isImageVolume())
                            <!-- Circle with Ellipse sub-control (Image only) -->
                            <div class="checkbox-control-button control-button-with-sub">
                                <input type="checkbox" name="tools[]" id="tool-circle" value="circle" @if (in_array('circle', $volume->enabledAnnotationTools())) checked @endif>
                                <label for="tool-circle" class="control-button" title="Draw a circle">
                                    <i class="icon icon-white icon-circle"></i>
                                </label>
                                <div class="control-button__sub-controls btn-group">
                                    <div class="checkbox-control-button">
                                        <input type="checkbox" name="tools[]" id="tool-ellipse" value="ellipse" @if (in_array('ellipse', $volume->enabledAnnotationTools())) checked @endif>
                                        <label for="tool-ellipse" class="control-button" title="Draw an ellipse">
                                            <i class="icon icon-white icon-ellipse"></i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- LineString with Measure sub-controls (Image only) -->
                            <div class="checkbox-control-button control-button-with-sub">
                                <input type="checkbox" name="tools[]" id="tool-linestring" value="linestring" @if (in_array('linestring', $volume->enabledAnnotationTools())) checked @endif>
                                <label for="tool-linestring" class="control-button" title="Draw a line string">
                                    <i class="icon icon-white icon-linestring"></i>
                                </label>
                                <div class="control-button__sub-controls btn-group">
                                    <div class="checkbox-control-button">
                                        <input type="checkbox" name="tools[]" id="tool-measure" value="measure" @if (in_array('measure', $volume->enabledAnnotationTools())) checked @endif>
                                        <label for="tool-measure" class="control-button" title="Measure a line string">
                                            <i class="fa fa-ruler"></i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        @endif
                        
                        @if ($volume->isVideoVolume())
                            <div class="checkbox-control-button">
                                <input type="checkbox" name="tools[]" id="tool-circle-video" value="circle" @if (in_array('circle', $volume->enabledAnnotationTools())) checked @endif>
                                <label for="tool-circle-video" class="control-button" title="Draw a circle">
                                    <i class="icon icon-white icon-circle"></i>
                                </label>
                            </div>
                        @endif

                        
                        @if ($volume->isVideoVolume())
                            <div class="checkbox-control-button">
                                <input type="checkbox" name="tools[]" id="tool-linestring-video" value="linestring" @if (in_array('linestring', $volume->enabledAnnotationTools())) checked @endif>
                                <label for="tool-linestring-video" class="control-button" title="Draw a line string">
                                    <i class="icon icon-white icon-linestring"></i>
                                </label>
                            </div>
                        @endif
                        
                        
                        <div class="checkbox-control-button control-button-with-sub">
                                <input type="checkbox" name="tools[]" id="tool-polygon" value="polygon" @if (in_array('polygon', $volume->enabledAnnotationTools())) checked @endif>
                                <label for="tool-polygon" class="control-button" title="Draw a polygon">
                                    <i class="icon icon-white icon-polygon"></i>
                                </label>
                                <div class="control-button__sub-controls btn-group">
                                    <div class="checkbox-control-button">
                                        <input type="checkbox" name="tools[]" id="tool-polygonbrush" value="polygonbrush" @if (in_array('polygonbrush', $volume->enabledAnnotationTools())) checked @endif>
                                        <label for="tool-polygonbrush" class="control-button" title="Draw a polygon using the brush tool">
                                            <i class="fa fa-paint-brush"></i>
                                        </label>
                                    </div>
                                    <div class="checkbox-control-button">
                                        <input type="checkbox" name="tools[]" id="tool-polygonEraser" value="polygonEraser" @if (in_array('polygonEraser', $volume->enabledAnnotationTools())) checked @endif>
                                        <label for="tool-polygonEraser" class="control-button" title="Modify selected polygons using the eraser tool">
                                            <i class="fa fa-eraser"></i>
                                        </label>
                                    </div>
                                    <div class="checkbox-control-button">
                                        <input type="checkbox" name="tools[]" id="tool-polygonFill" value="polygonFill" @if (in_array('polygonFill', $volume->enabledAnnotationTools())) checked @endif>
                                        <label for="tool-polygonFill" class="control-button" title="Modify selected polygons using the fill tool">
                                            <i class="fa fa-fill-drip"></i>
                                        </label>
                                    </div>
                                    @if ($volume->isImageVolume())
                                        <div class="checkbox-control-button">
                                            <input type="checkbox" name="tools[]" id="tool-magicwand" value="magicwand" @if (in_array('magicwand', $volume->enabledAnnotationTools())) checked @endif>
                                            <label for="tool-magicwand" class="control-button" title="Draw a polygon using the magic wand tool">
                                                <i class="fa fa-magic"></i>
                                            </label>
                                        </div>
                                        <div class="checkbox-control-button">
                                            <input type="checkbox" name="tools[]" id="tool-magicsam" value="magicsam" @if (in_array('magicsam', $volume->enabledAnnotationTools())) checked @endif>
                                            <label for="tool-magicsam" class="control-button" title="Draw a polygon using the magic SAM tool">
                                                <i class="fa fa-hat-wizard"></i>
                                            </label>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        
                        @if ($volume->isVideoVolume())
                            <div class="checkbox-control-button">
                                <input type="checkbox" name="tools[]" id="tool-wholeframe" value="wholeframe" @if (in_array('wholeframe', $volume->enabledAnnotationTools())) checked @endif>
                                <label for="tool-wholeframe" class="control-button" title="Mark the whole frame">
                                    <i class="icon icon-white icon-wholeframe"></i>
                                </label>
                            </div>
                        @endif
                    </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <input type="hidden" name="_redirect" value="{{ route('volume-edit', $volume->id) }}">
                    <input type="submit" class="btn btn-success" value="Save">
                </div>
                <div class="col-sm-6 text-right">
                    <button type="button" id="toggle-all-tools" class="btn btn-default" title="Select all tools">
                        <i class="fa fa-check"></i>
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggle-all-tools');
    const checkboxes = document.querySelectorAll('input[name="tools[]"]');
    
    function updateToggleButton() {
        const checkedCount = document.querySelectorAll('input[name="tools[]"]:checked').length;
        const totalCount = checkboxes.length;
        
        if (checkedCount === totalCount) {
            toggleButton.innerHTML = '<i class="fa fa-times"></i>';
            toggleButton.setAttribute('data-action', 'deselect');
            toggleButton.setAttribute('title', 'Deselect all tools');
        } else {
            toggleButton.innerHTML = '<i class="fa fa-check"></i>';
            toggleButton.setAttribute('data-action', 'select');
            toggleButton.setAttribute('title', 'Select all tools');
        }
    }
    
    toggleButton.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        const shouldCheck = action === 'select';
        
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = shouldCheck;
        });
        
        updateToggleButton();
    });
    
    // Update button state when individual checkboxes change
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', updateToggleButton);
    });
    
    // Initialize button state
    updateToggleButton();
});
</script>
