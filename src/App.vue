<template>
  <div id="app">
    <div class="top-bar">
      <h1>StatsSnap</h1>
      <div v-if="loggedIn" class="account-info">
        <span class="welcome">Welcome, {{ username }}</span>
        <div class="dropdown"
          @mouseenter="openAccountMenu"
          @mouseleave="delayedCloseAccountMenu"
        >
          <button class="account-btn"
            @focus="openAccountMenu"
            @blur="delayedCloseAccountMenu"
          >Account ▾</button>
          <div v-if="showAccountMenu" class="dropdown-menu"
            @mouseenter="openAccountMenu"
            @mouseleave="delayedCloseAccountMenu"
          >
            <button @click="logout">Log Out</button>
            <button @click="showDelete = !showDelete">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!loggedIn">
      <LoginForm @login-success="onLoginSuccess" />
      <button @click="showRegister = !showRegister" style="margin-top: 10px;">
        {{ showRegister ? 'Hide' : 'Create Account' }}
      </button>
      <RegisterForm v-if="showRegister" @register-success="onRegisterSuccess" />
    </div>
    <div v-else>
      <DeleteAccount v-if="showDelete" :username="username" @account-deleted="onAccountDeleted" @close="showDelete = false" />
      <DashboardView ref="dashboardView" :username="username" />
      <FavoriteTeamForm :username="username" @team-added="onTeamAdded" />
    </div>
  </div>
</template>

<script>
import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'
import DeleteAccount from './components/DeleteAccount.vue'
import DashboardView from './components/DashboardView.vue'
import FavoriteTeamForm from './components/FavoriteTeamForm.vue'

export default {
  name: 'App',
  components: { LoginForm, RegisterForm, DeleteAccount, DashboardView, FavoriteTeamForm },
  data() {
    return {
      loggedIn: false,
      username: '',
      showRegister: false,
      showDelete: false,
      isAdmin: false,
      showAccountMenu: false,
      accountMenuCloseTimer: null
    }
  },
  methods: {
    async ensureUserRecord(username) {
      try {
        await fetch('/api/ItemTracking/addUserRecord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: username })
        });
      } catch (e) {
        console.error('Error ensuring UserRecord:', e);
      }
    },
    async onLoginSuccess(username) {
      this.loggedIn = true;
      this.username = username;
      this.showRegister = false;
      this.isAdmin = username === 'admin';
      await this.ensureUserRecord(username);
    },
    async onRegisterSuccess(username) {
      this.loggedIn = true;
      this.username = username;
      this.showRegister = false;
      this.isAdmin = username === 'admin';
      await this.ensureUserRecord(username);
    },
    logout() {
      this.loggedIn = false;
      this.username = '';
    },
    onAccountDeleted() {
      this.logout();
      this.showDelete = false;
    },
    onTeamAdded() {
      // Optionally refresh dashboard or show a message
      // For now, just log
      if (this.$refs.dashboardView) {
        this.$refs.dashboardView.loadTeams();
      }
      console.log('Team added and tracking started!');
    },
    openAccountMenu() {
      this.showAccountMenu = true;
      if (this.accountMenuCloseTimer) {
        clearTimeout(this.accountMenuCloseTimer);
        this.accountMenuCloseTimer = null;
      }
    },
    delayedCloseAccountMenu() {
      this.accountMenuCloseTimer = setTimeout(() => {
        this.showAccountMenu = false;
        this.accountMenuCloseTimer = null;
      }, 180); // 180ms delay for smoother UX
    },
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Oswald:wght@500;700&display=swap');
body {
  background: #0a2342;
  min-height: 100vh;
  margin: 0;
}
#app {
  font-family: 'Montserrat', 'Oswald', 'Inter', 'Avenir', Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: 40px;
  color: #fff;
}
h1 {
  font-family: 'Oswald', 'Montserrat', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 24px;
  letter-spacing: 2px;
  color: #2ca58d;
  text-shadow: 2px 2px 0 #0a2342, 0 4px 12px rgba(0,0,0,0.15);
}
button {
  background: #2ca58d;
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  cursor: pointer;
  margin: 10px 0;
  box-shadow: 0 2px 8px rgba(44, 165, 141, 0.15);
  transition: background 0.2s, transform 0.2s;
}
button:hover {
  background: #0a2342;
  color: #fff;
  transform: scale(1.05);
}
.success {
  color: #2ca58d;
  font-weight: 700;
}
.error {
  color: #e63946;
  font-weight: 700;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  background: #0a2342;
  border-bottom: 3px solid #2ca58d;
  box-shadow: 0 2px 12px rgba(44, 165, 141, 0.10);
}
.account-info {
  display: flex;
  align-items: center;
  color: #fff;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
}
.welcome {
  margin-right: 18px;
  font-size: 1.1rem;
  color: #2ca58d;
}
.card {
  background: #fff;
  color: #0a2342;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(44, 165, 141, 0.12);
  padding: 24px;
  margin: 18px auto;
  max-width: 480px;
  font-family: 'Montserrat', 'Oswald', sans-serif;
}
.dropdown {
  position: relative;
  display: inline-block;
  min-width: 120px;
}
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 110%;
  background: #fff;
  border: 2px solid #2ca58d;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(44, 165, 141, 0.18);
  min-width: 140px;
  z-index: 10;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dropdown-menu button {
  background: none;
  color: #0a2342;
  border: none;
  padding: 12px 24px;
  text-align: left;
  font-size: 1.05rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  font-weight: 700;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.2s, color 0.2s;
}
.dropdown-menu button:hover {
  background: #2ca58d;
  color: #fff;
}
@media (max-width: 600px) {
  #app {
    margin-top: 10px;
    padding: 0 8px;
  }
  .card {
    padding: 12px;
    max-width: 98vw;
  }
  h1 {
    font-size: 2rem;
  }
}
</style>
