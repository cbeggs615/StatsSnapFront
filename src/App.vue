<template>
  <div id="app">
    <div class="top-bar">
      <h1 class="logo-title">
        <span class="capital-s">S</span><span class="small-caps">TAT</span><span class="capital-s">S</span><span class="small-caps">NAP</span>
      </h1>
      <div v-if="loggedIn" class="account-info">
        <span class="welcome">Welcome, <span class="username">{{ username }}</span></span>
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
      <div class="auth-toggle-section">
        <button @click="showRegister = !showRegister" class="auth-toggle-button">
          {{ showRegister ? 'Back to Sign In' : 'Create Account' }}
        </button>
      </div>
      <RegisterForm v-if="showRegister" @register-success="onRegisterSuccess" />
    </div>
    <div v-else>
      <DeleteAccount v-if="showDelete" :username="username" @account-deleted="onAccountDeleted" @close="showDelete = false" />
      <div class="main-content">
        <div class="dashboard-section">
          <DashboardView ref="dashboardView" :username="username" />
        </div>
        <div class="form-section">
          <FavoriteTeamForm :username="username" @team-added="onTeamAdded" />
        </div>
      </div>
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
@import url('https://fonts.googleapis.com/css2?family=BentonSans:wght@400;600;700&display=swap');
body {
  background: #f7f7f7;
  min-height: 100vh;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: center;
  color: #222222;
  min-height: 100vh;
}
.logo-title {
  font-family: 'Impact', 'Franklin Gothic Bold', 'Trebuchet MS Bold', 'Arial Black', sans-serif;
  font-size: 40px;
  font-weight: 900;
  font-style: italic;
  margin: 0;
  letter-spacing: -0.5px;
  color: #ffffff;
  text-shadow: none;
  display: flex;
  align-items: baseline;
  line-height: 1;
  text-transform: uppercase;
}

.capital-s {
  font-size: 40px;
  font-weight: 900;
}

.small-caps {
  font-size: 30px;
  font-weight: 900;
}
button {
  background: #d50a0a;
  color: #ffffff;
  border: 1px solid #d50a0a;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 10px 0;
  font-family: inherit;
}
button:hover {
  background: #b71c1c;
  border-color: #b71c1c;
  transform: none;
}
.success {
  color: #1b5e20;
  font-weight: 600;
}
.error {
  color: #d50a0a;
  font-weight: 600;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: #d50a0a;
  border-bottom: 1px solid #b71c1c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.account-info {
  display: flex;
  align-items: center;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 14px;
}
.welcome {
  margin-right: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.username {
  color: #ffffff;
  font-weight: 700;
  text-transform: none;
  letter-spacing: normal;
}
.card {
  background: #ffffff;
  color: #222222;
  border: 1px solid #e5e5e5;
  border-left: 4px solid #d50a0a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 32px;
  margin: 24px auto;
  max-width: 480px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: left;
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
  background: #ffffff;
  border: 1px solid #e5e5e5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  min-width: 140px;
  z-index: 10;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}
.dropdown-menu button {
  background: none;
  color: #222222;
  border: none;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  text-transform: none;
  letter-spacing: normal;
  margin: 0;
}
.dropdown-menu button:hover {
  background: #f8f9fa;
  color: #d50a0a;
}

.account-btn {
  background: none;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0;
}

.account-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.7);
}
.main-content {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  align-items: flex-start;
  box-sizing: border-box;
}

.dashboard-section {
  flex: 1; /* Takes up the remaining space after form section */
  min-width: 0; /* Allows flex item to shrink below content size */
  margin-right: 8px; /* Reduced margin */
  box-sizing: border-box;
  overflow: hidden; /* Prevent overflow */
}

.form-section {
  flex: 0 0 350px; /* Fixed width of 350px */
  max-width: 350px;
  margin-left: 8px; /* Reduced margin */
  margin-top: 96px; /* Align with first team position */
  box-sizing: border-box;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    gap: 20px;
  }

  .dashboard-section {
    flex: none;
    width: 100%;
    margin-right: 0; /* Reset margin for mobile */
  }

  .form-section {
    flex: none;
    width: 100%;
    max-width: 600px;
    margin: 0 auto; /* Center the form and reset all margins */
  }
}

.auth-toggle-section {
  text-align: center;
  margin: 20px auto;
  max-width: 400px;
}

.auth-toggle-button {
  background: #ffffff;
  color: #d50a0a;
  border: 1px solid #d50a0a;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  min-width: 160px;
}

.auth-toggle-button:hover {
  background: #d50a0a;
  color: #ffffff;
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
  .main-content {
    padding: 10px;
    gap: 16px;
  }
}
</style>
