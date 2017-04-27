<div id="image-panel" class="panel panel-default volume-images-panel" :class="classObject">
    <div class="panel-heading">
        Volume images
        <span class="pull-right">
            {{-- put image filter toggle here --}}
            <loader :active="loading"></loader>
            <button class="btn btn-default btn-xs" title="Add new images" v-on:click="toggleEditing" :class="{active: editing}"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
        </span>
    </div>
    <div class="panel-body" v-if="editing" v-cloak>
        <form role="form" class="form-inline" v-on:submit.prevent="submit">
            <div class="form-group" :class="{'has-error':hasError('images')}">
                <label>Filename(s):&nbsp;</label>
                <input type="text" class="form-control" name="filename" id="images" placeholder="1.jpg, 2.jpg, 3.jpg" v-model="filenames" required>
                <p class="help-block" v-text="getError('images')" v-if="hasError('images')"></p>
            </div>
            <button type="submit" class="btn btn-success" :disabled="loading">Add image(s)</button>
            <span class="help-block">Mutliple images may be added by submitting the image filenames as comma separated values.</span>
        </form>
    </div>
    <ul class="list-group images-list" v-cloak>
        <image-item v-for="image in orderedImages" key="image.id" :image="image" inline-template v-on:remove="handleRemove">
            <li class="list-group-item" :class="classObject">
                <button type="button" class="close" :title="title" v-on:click="remove" v-once><span aria-hidden="true">&times;</span></button>
                <span class="text-muted" v-once>#<span v-text="image.id"></span></span> <span v-text="image.filename"></span>
            </li>
        </image-item>
        <li class="list-group-item text-muted" v-if="!hasImages">This volume has no images. <a v-if="!editing" href="#" v-on:click.prevent="toggleEditing">Add some.</a></li>
    </ul>
</div>
