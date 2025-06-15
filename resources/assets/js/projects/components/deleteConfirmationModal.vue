<template>
    <div class="modal-overlay">
      <div class="modal">
        <h2>Delete Project</h2>
        <p>which Project do you want to delete?</p>
        <input v-model="inputValue" placeholder="Projectname..." />
        <ul>
              someProjects
        </ul>
        <button @click="confirm">Confirm</button>
        <button @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        inputValue: '', // Data property to hold the input value
      };
    },
    methods: {
      confirm() {
        console.log(this.inputValue); // Log the input value to the console
        this.$emit('confirm', this.inputValue); // Emit the input value on confirm
      },
    },
    mounted() {
  console.log('Modal mounted'); // DEBUG
}
  };
  </script>
 <style scoped>
 .modal-overlay {
   position: fixed;
   top: 0;
   left: 0;
   width: 100vw;
   height: 100vh;
   background: rgba(0, 0, 0, 0.5);
   display: flex;
   justify-content: center;
   align-items: center;
   z-index: 9999;
 }
 
 .modal {
   background: white;
   padding: 2rem;
   border-radius: 10px;
   max-width: 500px;
   width: 100%;
 }
 </style>