<template>
  <div class="favorite-radios">
    <v-container fluid>
      <h2>Radio Preferite</h2>
      <v-row justify="center">
        <v-col v-for="radio in favoriteRadios" :key="radio.id" cols="12" sm="6" md="4" lg="3">
          <v-card class="radio-card" flat tile>
            <v-img :src="radio.favicon || defaultImage" class="card-image" :alt="radio.name" />
            <div class="radio-info">
              <v-card-title class="radio-name">{{ radio.name }}</v-card-title>
              <div class="controls">
                <v-btn @click="togglePlayPause(radio)" :color="radio.playing ? 'error' : 'primary'" small>
                  {{ radio.playing ? 'Pause' : 'Play' }}
                </v-btn>
                <div class="heart-container" @click="toggleFavorite(radio)">
                  <div :class="['heart', { 'liked': radio.favorite }]"></div>
                </div>
                <div v-if="radio.playing" class="sound-wave">
                  <div class="bar" v-for="bar in 4" :key="bar"></div>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import Hls from 'hls.js';
import defaultImage from '../assets/radio.jpg';

export default {
  name: 'FavoriteRadios',
  data() {
    return {
      favoriteRadios: [],
      defaultImage,
    }
  },
  methods: {
    async fetchRadios() {
      try {
        const response = await fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=100&countrycode=IT&hidebroken=true&order=clickcount&reverse=true');
        const data = await response.json();
        const allRadios = data.filter(radio => radio.countrycode === 'IT').map(radio => ({
          ...radio,
          favorite: true,
          showControls: false,
          playing: false,
          audioPlayer: new Audio(),
        }));
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const favoriteRadios = allRadios.filter(radio => favorites.some(fav => fav.changeuuid === radio.changeuuid && fav.favorite));
        return favoriteRadios;
      } catch (error) {
        console.error('Error fetching favorite radios:', error);
        throw error;
      }
    },
    async getFavoriteRadios() {
      try {
        this.favoriteRadios = await this.fetchRadios();
      } catch (error) {
        console.error('Error fetching favorite radios:', error);
      }
    },
    async togglePlayPause(radio) {
      try {
        if (radio.playing) {
          this.pauseRadio(radio);
        } else {
          this.$emit('stopAllRadios');
          this.pauseAllRadios();
          await this.playRadio(radio);
        }
      } catch (error) {
        console.error('Error toggling play/pause:', error);
      }
    },
    async playRadio(radio) {
      const audioUrl = radio.url_resolved || radio.url;
      if (audioUrl.includes('m3u8')) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(audioUrl);
          hls.attachMedia(radio.audioPlayer);
        } else {
          console.error('HLS is not supported in this browser.');
        }
      } else {
        radio.audioPlayer.src = audioUrl;
      }
      await radio.audioPlayer.play();
      radio.playing = true;
    },
    pauseRadio(radio) {
      radio.audioPlayer.pause();
      radio.playing = false;
    },
    pauseAllRadios() {
      this.favoriteRadios.forEach(radio => {
        if (radio.playing) {
          this.pauseRadio(radio);
        }
      });
    },
    toggleFavorite(radio) {
      radio.favorite = !radio.favorite;
      if (!radio.favorite) {
        this.removeFavorite(radio);
      }
    },
    removeFavorite(radio) {
      let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
      favorites = favorites.filter(fav => fav.changeuuid !== radio.changeuuid);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      this.getFavoriteRadios();
    },
  },
  created() {
    this.getFavoriteRadios();
  },
  beforeUnmount() {
    this.pauseAllRadios();
  },
}
</script>

<style scoped>
.favorite-radios {
  padding: 20px;
}

.radio-card {
  max-width: 350px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.card-image {
  height: 200px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.radio-info {
  padding: 10px;
}

.radio-name {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 10px;
}

.heart-container {
  display: inline-block;
  cursor: pointer;
  margin-left: 5px;
}

.heart {
  width: 20px;
  height: 18px;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="%23C1C1C1"/></svg>') center no-repeat;
  background-size: 100%;
}

.heart.liked {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" fill="%23FF0000"/></svg>');
}

.sound-wave {
  display: flex;
  align-items: center;
}

.bar {
  width: 4px;
  height: 100%;
  margin: 0 2px;
  background-color: #333;
  animation: pulse 0.8s infinite ease-in-out alternate;
}

.bar:nth-child(1) {
  animation-delay: 0s;
}

.bar:nth-child(2) {
  animation-delay: 0.1s;
}

.bar:nth-child(3) {
  animation-delay: 0.2s;
}

.bar:nth-child(4) {
  animation-delay: 0.3s;
}

@keyframes pulse {
  0% {
    transform: scaleY(0.1);
  }

  100% {
    transform: scaleY(1);
  }
}
</style>
