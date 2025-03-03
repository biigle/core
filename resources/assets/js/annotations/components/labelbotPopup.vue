<template>
  <ul class="labelbot-labels">
    <li class="labelbot-labels-label" v-for="(label, index) in labelbotLabels" :key="index">
      <div v-if="index === 0" class="labelbot-labels-label__nameProgress" @click="selectLabel(label, index)">
        <!-- Progress bar -->
          <div ref="progressBar" class="labelbot-labels-label__progress-bar" :style="{ width: progressWidth + '%' }" @transitionend="closeLabelBOTPopup()"></div>
        <!-- Label name -->
        <div class="labelbot-labels-label__nameProgressColor">
          <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
          <span>{{ label.name }}</span>
        </div> 
      </div>
      <div v-else class="labelbot-labels-label__name" @click="selectLabel(label)">
        <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
        <span>{{ label.name }}</span>
      </div>
    </li>
    <li class="labelbot-labels-label">
      <input class="form-control" placeholder="type...">
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    labelbotLabels: {
      type: Array,
      required: true,
    },
    labelBOTIsOn: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    return {
      progressWidth: 0,
    };
  },
  watch: {
    labelbotLabels() {
      this.progressWidth = 0;
      if (this.labelbotLabels.length > 0) {
        setTimeout(() => this.progressWidth = 100, 10);
      }
    },
  },
  methods: {
    selectLabel(label, index) {
      // Top 1 label is already attached
      if (index !== 0) {
        this.$emit('update-labelbot-label', label);
      }
      this.closeLabelBOTPopup();
    },
    closeLabelBOTPopup() {
      this.$emit('delete-labelbot-labels');
    }
  },
};
</script>