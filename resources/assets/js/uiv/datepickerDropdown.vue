<template>
<dropdown>
    <div class="input-group">
        <input class="form-control" type="text" v-model="internalValue" :placeholder="placeholder" :required="required">
        <div class="input-group-btn">
            <button type="button" class="btn btn-default dropdown-toggle"><i class="fa fa-calendar"></i></button>
        </div>
    </div>
    <template #dropdown>
        <li>
            <date-picker
                v-model="internalValue"
                icon-control-left="fa fa-chevron-left"
                icon-control-right="fa fa-chevron-right"
                :limit-from="limitFrom"
                :limit-to="limitTo"
                :week-starts-with="1"
                />
        </li>
    </template>
</dropdown>
</template>

<script>
import {DatePicker, Dropdown} from 'uiv';

export default {
    props: {
        placeholder: {
            type: String,
            default: '',
        },
        value: {
            type: String,
            default: '',
        },
        limitFrom: {
            type: Date,
            default: null,
        },
        limitTo: {
            type: Date,
            default: null,
        },
        required: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        dropdown: Dropdown,
        datePicker: DatePicker,
    },
    data() {
        return {
            internalValue: '',
        };
    },
    watch: {
        internalValue(value) {
            this.$emit('input', value);
        },
        value(value) {
            this.internalValue = value;
        },
    },
    created() {
        this.internalValue = this.value;
    },
};
</script>
