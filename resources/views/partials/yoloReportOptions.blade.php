<div v-cloak v-if="wantsCombination('ImageAnnotations', 'Yolo')" class="form-group" :class="{'has-error': errors.yolo_image_path}">
    <label for="yolo-image-path">Local image path</label>
    <input type="text" id="yolo-image-path" class="form-control" v-model="options.yolo_image_path" placeholder="/path/to/images">
    <div v-if="errors.yolo_image_path" class="help-block" v-text="getError('yolo_image_path')"></div>
    <div v-else class="help-block">
        {{$help}} If set, the report includes symbolic links to the images at this path.
    </div>
</div>
<div v-cloak v-if="wantsCombination('ImageAnnotations', 'Yolo')" class="form-group" :class="{'has-error': errors.yolo_train_split || errors.yolo_val_split || errors.yolo_test_split || !hasValidYoloSplit}">
    <label>Train/validation/test split</label>
    <div class="row">
        <div class="col-xs-4">
            <div class="input-group">
                <span class="input-group-addon">Train</span>
                <input type="number" class="form-control" v-model.number="options.yolo_train_split" step="0.05" min="0" max="1">
            </div>
        </div>
        <div class="col-xs-4">
            <div class="input-group">
                <span class="input-group-addon">Val</span>
                <input type="number" class="form-control" v-model.number="options.yolo_val_split" step="0.05" min="0" max="1">
            </div>
        </div>
        <div class="col-xs-4">
            <div class="input-group">
                <span class="input-group-addon">Test</span>
                <input type="number" class="form-control" v-model.number="options.yolo_test_split" step="0.05" min="0" max="1">
            </div>
        </div>
    </div>
    <div v-if="errors.yolo_train_split" class="help-block" v-text="getError('yolo_train_split')"></div>
    <div v-else-if="errors.yolo_val_split" class="help-block" v-text="getError('yolo_val_split')"></div>
    <div v-else-if="errors.yolo_test_split" class="help-block" v-text="getError('yolo_test_split')"></div>
    <div v-else-if="!hasValidYoloSplit" class="help-block">
        The splits must add up to 1 (currently @{{yoloSplitSum}}).
    </div>
    <div v-else class="help-block">
        Fractions of the images that are assigned to the training, validation and test sets.
    </div>
</div>
