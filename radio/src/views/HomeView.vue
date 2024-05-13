<template>
  <v-container>
    <h1 class="title">Homepage</h1>
    <v-text-field v-model="searchQuery" label="Cerca per nome" outlined dense @input="searchRadios"
      clearable></v-text-field>
    <v-row>
      <v-col cols="12" sm="6" md="4" lg="3" v-for="radio in filteredRadios" :key="radio.id">
        <v-card class="radio-card" flat tile>
          <v-tooltip bottom>
            <template #activator="{ on }">
              <div v-bind="on" class="radio-name">{{ getShortenedName(radio) }}</div>
            </template>
            <span>{{ radio.name }}</span>
          </v-tooltip>
          <v-img :src="radio.favicon || defaultImage" class="card-image" :alt="radio.name" />
          <div class="radio-info">
            <div class="song-info" v-if="radio.playing && radio.song">
              <div class="song-name">{{ radio.song.title }}</div>
              <div class="artist-name">{{ radio.song.artist }}</div>
            </div>
          </div>
          <div class="controls">
            <v-btn @click="togglePlayPause(radio)" :color="radio.playing ? 'error' : 'primary'" small outlined>
              {{ radio.playing ? 'Pause' : 'Play' }}
            </v-btn>
            <v-btn @click="toggleFavorite(radio)" small icon>
              <v-icon :color="radio.favorite ? 'red' : 'grey'">
                {{ radio.favorite ? 'mdi-heart' : 'mdi-heart-outline' }}
              </v-icon>
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Hls from 'hls.js';
import defaultImage from '../assets/radio.jpg';

export default {
  name: 'HomeView',
  data() {
    return {
      radios: [],
      filteredRadios: [],
      searchQuery: '',
      defaultImage,
    }
  },
  methods: {
    async fetchRadios() {
      try {
        const response = await fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=100&countrycode=IT&hidebroken=true&order=clickcount&reverse=true');
        const data = await response.json();
        return data.filter(radio => radio.countrycode === 'IT').map(radio => ({
          ...radio,
          favorite: false,
          showControls: false,
          playing: false,
          audioPlayer: new Audio(),
        }));
      } catch (error) {
        console.error('Error fetching radios:', error);
        throw error;
      }
    },
    async getRadios() {
      try {
        this.radios = await this.fetchRadios();
        this.retrieveFavorites();
      } catch (error) {
        console.error('Error fetching radios:', error);
      }
    },
    async fetchSongInfo(radio) {
      const apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(radio.artist)}/${encodeURIComponent(radio.title)}`;
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.lyrics) {
          radio.song = {
            title: radio.title,
            artist: radio.artist,
            lyrics: data.lyrics
          };
        } else {
          console.error('Lyrics not found');
        }
      } catch (error) {
        console.error('Error fetching song info:', error);
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
          return;
        }
      } else {
        radio.audioPlayer.src = audioUrl;
      }
      try {
        await radio.audioPlayer.play();
        await this.fetchSongInfo(radio); // Attendiamo che le informazioni sulla canzone vengano ottenute
        radio.playing = true;
      } catch (error) {
        console.error('Error playing audio:', error);
        if (error.name === 'NotAllowedError') {
          console.error('Please ensure that the audio playback is allowed in your browser settings.');
        }
      }
    },

    searchRadios() {
      if (this.searchQuery.trim() === '') {
        this.filteredRadios = this.radios;
      } else {
        this.filteredRadios = this.radios.filter(radio =>
          radio.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
    },
    pauseRadio(radio) {
      radio.audioPlayer.pause();
      radio.playing = false;
    },
    async togglePlayPause(radio) {
      if (radio.playing) {
        this.pauseRadio(radio);
      } else {
        // Ferma la riproduzione di tutte le radio nella HomeView
        this.$emit('stopAllRadios');
        this.pauseAllRadios();
        this.playRadio(radio);
      }
    },
    pauseAllRadios() {
      this.radios.forEach(radio => {
        if (radio.playing) {
          this.pauseRadio(radio);
        }
      });
    },
    toggleFavorite(radio) {
      radio.favorite = !radio.favorite;
      if (!radio.favorite) {
        this.removeFavorite(radio);
      } else {
        this.saveFavorites();
      }
    },
    saveFavorites() {
      const favorites = this.radios.map(radio => ({ changeuuid: radio.changeuuid, favorite: radio.favorite }));
      localStorage.setItem('favorites', JSON.stringify(favorites));
    },
    removeFavorite(radio) {
      let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
      favorites = favorites.filter(fav => fav.changeuuid !== radio.changeuuid);
      localStorage.setItem('favorites', JSON.stringify(favorites));
    },
    retrieveFavorites() {
      const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
      this.radios.forEach(radio => {
        const fav = favorites.find(f => f.changeuuid === radio.changeuuid);
        radio.favorite = fav ? fav.favorite : false;
      });
    },
    getShortenedName(radio) {
      if (radio.name.length > 20) {
        return radio.name.substring(0, 20) + '...';
      } else {
        return radio.name;
      }
    },
  },
  created() {
    this.getRadios().then(() => {
      // Mostra tutte le radio all'avvio
      this.filteredRadios = this.radios;
    });
  },
  beforeRouteLeave(to, from, next) {
    // Pausa la riproduzione della radio quando si lascia la HomeView
    this.pauseAllRadios();
    next();
  }
}
</script>

<style scoped>
.radio-card {
  max-width: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  margin-bottom: 20px;
  transition: box-shadow 0.3s;
}

.radio-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
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
  font-size: 1.4em;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.song-name {
  font-size: 1.1em;
  color: #555;
  margin-bottom: 10px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
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

.title {
  font-family: 'Roboto', sans-serif;
  font-size: 2em;
  color: #2c3e50;
  margin-bottom: 20px;
}
</style>
