<div class="panel panel-default transect-images-panel" data-ng-controller="ImagesController" data-confirmation="Do you really want to delete the image :img? All annotations will be lost!" data-success="The image was deleted." data-ng-class="{'panel-warning': data.addingNewImages}">
    <div class="panel-heading">
        Transect images
        <span class="pull-right">
            {{-- put image filter toggle here --}}
            <button class="btn btn-default btn-xs" title="Add new images" data-ng-click="toggleAddingNewImage()" data-ng-class="{active: data.addingNewImages}"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
        </span>
    </div>
    <div class="panel-body ng-cloak" data-ng-if="data.addingNewImages">
        <form role="form" class="form-inline" data-ng-submit="addNewImages()">
            <div class="form-group">
                <label>Filename(s):&nbsp;</label>
                <input type="text" class="form-control" name="filename" id="images" placeholder="1.jpg, 2.jpg, 3.jpg" data-ng-model="data.filenames" required>
            </div>
            <button type="submit" class="btn btn-success">Add image(s)</button>
            <span class="help-block">Mutliple images may be added by submitting the image filenames as comma separated values.</span>
        </form>
    </div>
    <ul class="list-group images-list">
        <li data-ng-repeat="image in data.newImages track by image.id" class="ng-cloak list-group-item list-group-item-success">
            <button type="button" class="close" title="Delete image #@{{image.id}} (@{{image.filename}})" data-ng-click="deleteImage(image.id, image.filename)"><span aria-hidden="true">&times;</span></button>
            <span class="text-muted">#@{{image.id}}</span> @{{image.filename}}
        </li>
        @foreach ($images as $id => $filename)
            <li id="transect-image-{{$id}}" class="list-group-item">
                <button type="button" class="close" title="Delete image #{{$id}}" onclick="$biigleTransectsEditDeleteImage({{$id}}, '{{$filename}}')"><span>&times;</span></button>
                <span class="text-muted">#{{$id}}</span> {{$filename}}
            </li>
        @endforeach
    </ul>
</div>
