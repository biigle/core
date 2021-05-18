<template>
<dropdown>
    <div class="input-group">
        <input class="form-control" type="text" v-model="internalValue" :placeholder="placeholder">
        <div class="input-group-btn">
            <button type="button" class="btn btn-default dropdown-toggle"><i class="fa fa-calendar"></i></button>
        </div>
    </div>
    <template slot="dropdown">
        <li>
            <date-picker v-model="internalValue" icon-control-left="fa fa-chevron-left" icon-control-right="fa fa-chevron-right"/>
        </li>
    </template>
</dropdown>
</template>

<script>
import DatePicker from 'uiv/dist/DatePicker';
import Dropdown from 'uiv/dist/Dropdown';

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
