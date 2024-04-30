<template>
  <v-container>
    <h1>Homepage</h1>
  </v-container>
</template>

<script>


export default {
  name: 'HomeView',
  data() {
    return {
      radios: [],

    }
  },
  methods: {
    getRadios() {
      fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=100&countrycode=IT&hidebroken=true&order=clickcount&reverse=true')
        .then(response => response.json())
        .then(data => {
          this.radios = data;
          console.log(data);
        });

    },
  },
  created() {
    this.getRadios();
  },
}
</script>