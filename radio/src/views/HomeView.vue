<template>
  <v-container>
    <h1>Homepage</h1>
    <v-row>
      <v-col cols="12" sm="6" md="4" lg="3" v-for="radio in radios" :key="radio.id">
        <v-card class="radio-card" flat tile>
          <v-img :src="radio.favicon || defaultImage" class="card-image" :alt="radio.name" />
          <div class="radio-info">
            <v-card-title class="radio-name">{{ radio.name }}</v-card-title>
            <div class="song-name" v-if="radio.playing && radio.song">{{ radio.song.title }}</div>
          </div>
          <div class="controls">
            <v-btn @click="togglePlayPause(radio)" :color="radio.playing ? 'error' : 'primary'" small>
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
      defaultImage,
    }
  },
  methods: {
    async fetchRadios() {
      const response = await fetch('https://nl1.api.radio-browser.info/json/stations/search?limit=100&countrycode=IT&hidebroken=true&order=clickcount&reverse=true');
      const data = await response.json();
      return data.filter(radio => radio.countrycode === 'IT').map(radio => ({
        ...radio,
        favorite: false,
        showControls: false,
        playing: false,
        audioPlayer: new Audio(),
      }));
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
      // Chiamata API per recuperare informazioni sulla canzone da Last.fm o altro servizio
      // Esempio di implementazione con Last.fm:
      const apiKey = '13720487addc32a8e3822f68791f5c29';
      const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(radio.artist)}&track=${encodeURIComponent(radio.title)}&format=json`;

      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const songInfo = data.track;
        radio.song = {
          title: songInfo.name,
          artist: songInfo.artist.name,
          duration: songInfo.duration,
          album: songInfo.album.title,
          // Altre informazioni sulla canzone da recuperare secondo necessità
        };
      } catch (error) {
        console.error('Error fetching song info:', error);
      }
    },
    async playRadio(radio) {
      // Logica per riprodurre la radio
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
      radio.audioPlayer.play()
        .then(() => {
          // Chiamata API per recuperare informazioni sulla canzone
          this.fetchSongInfo(radio);
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          if (error.name === 'NotAllowedError') {
            console.error('Please ensure that the audio playback is allowed in your browser settings.');
          }
        });
      radio.playing = true;
    },
    pauseRadio(radio) {
      radio.audioPlayer.pause();
      radio.playing = false;
    },
    togglePlayPause(radio) {
      if (radio.playing) {
        this.pauseRadio(radio);
      } else {
        this.pauseAllRadios(); // Pause all other radios
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
      this.$data.radios.forEach(radio => {
        const fav = favorites.find(f => f.changeuuid === radio.changeuuid);
        radio.favorite = fav ? fav.favorite : false;
      });
    },
  },
  created() {
    this.getRadios();
  },
}
</script>

<style scoped>
.radio-card {
  max-width: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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

.song-name {
  font-size: 1em;
  color: #777;
  margin-bottom: 10px;
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
