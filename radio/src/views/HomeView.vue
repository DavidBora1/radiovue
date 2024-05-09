<template>
  <div>
    <v-container>
      <v-row>
        <v-col v-for="radio in radios" :key="radio.id" cols="12" sm="6" md="4">
          <v-card>
            <v-img :src="radio.image || require('@/assets/radio.jpg')" aspect-ratio="16/9"></v-img>
            <v-card-title>{{ radio.name }}</v-card-title>
            <v-card-subtitle v-if="radio.song">{{ radio.song }}</v-card-subtitle>
            <v-card-actions>
              <v-btn @click="playRadio(radio)">Play</v-btn>
              <v-btn @click="toggleFavorite(radio)">
                <v-icon>{{ isFavorite(radio) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <audio ref="audio"></audio>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      radios: [],
      favorites: []
    };
  },
  methods: {
    async fetchRadios() {
      try {
        const response = await axios.get('https://de1.api.radio-browser.info/json/stations');
        this.radios = response.data;
      } catch (error) {
        console.error('Errore durante il recupero delle radio:', error);
      }
    },
    async fetchSongInfo(radio) {
      try {
        const response = await fetch('https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=YOUR_LAST_FM_API_KEY&artist=' + encodeURIComponent(radio.artist) + '&track=' + encodeURIComponent(radio.song) + '&format=json');
        const data = await response.json();

        if (data.track) {
          radio.song = data.track.name;
        }
      } catch (error) {
        console.error('Errore durante il recupero delle informazioni sulla canzone:', error);
      }
    },
    async playRadio(radio) {
      try {
        const streamUrl = radio.url;
        if (streamUrl) {
          if (this.$refs.audio) {
            this.$refs.audio.pause();
            this.$refs.audio.src = '';
          }
          this.$refs.audio.src = streamUrl;
          await this.$refs.audio.play();
        } else {
          console.error('URL dello streaming non disponibile per:', radio.name);
        }
      } catch (error) {
        console.error('Errore durante lo streaming dell\'audio:', error);
      }
    },
    toggleFavorite(radio) {
      if (this.isFavorite(radio)) {
        this.favorites = this.favorites.filter(fav => fav.id !== radio.id);
      } else {
        this.favorites.push(radio);
      }
    },
    isFavorite(radio) {
      return this.favorites.some(fav => fav.id === radio.id);
    }
  },
  mounted() {
    this.fetchRadios();
  }
};
</script>