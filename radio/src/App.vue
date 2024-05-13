<template>
  <nav>
    <router-link to="/" class="nav-link">Home</router-link> |
    <router-link to="/preferiti" class="nav-link">Preferiti</router-link> |
    <router-link to="/mappamondo" class="nav-link">Mappamondo</router-link>
  </nav>
  <router-view/>
</template>

<style>
#app {
  font-family: 'Roboto', sans-serif;
  text-align: center;
  color: #333;
}

nav {
  padding: 20px;
}

.nav-link {
  font-weight: bold;
  color: #555;
  text-decoration: none;
  padding: 5px 10px;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #007bff;
}

.router-link-exact-active {
  color: #007bff;
}
</style>
