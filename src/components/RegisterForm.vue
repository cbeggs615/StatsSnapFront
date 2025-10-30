<template>
  <form @submit.prevent="handleRegister" class="register-form">
    <h2>Create StatSnap Account</h2>
    <div class="form-field">
      <label for="reg-username">Username</label>
      <input id="reg-username" v-model="username" required />
    </div>
    <div class="form-field">
      <label for="reg-password">Password</label>
      <div class="password-input-wrapper">
        <input id="reg-password" :type="showPassword ? 'text' : 'password'" v-model="password" required />
        <button type="button" class="toggle-password" @click="showPassword = !showPassword">
          {{ showPassword ? 'Hide' : 'Show' }}
        </button>
      </div>
    </div>
    <button type="submit" class="submit-button">Create Account</button>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">Account created successfully! You can now sign in.</div>
  </form>
</template>

<script>
import { API_BASE } from '../utils/apiConfig.js'

export default {
  name: 'RegisterForm',
  data() {
    return {
      username: '',
      password: '',
      error: '',
      success: false,
      showPassword: false
    }
  },
  methods: {
    async handleRegister() {
      this.error = '';
      this.success = false;
      try {
        const response = await fetch(`${API_BASE}/PasswordAuth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const result = await response.json();
        if (result.user) {
          this.success = true;
          this.$emit('register-success', this.username);
          this.username = '';
          this.password = '';
        } else {
          this.error = result.error || 'Registration failed.';
        }
      } catch (e) {
        this.error = 'Unable to connect to the server. Please check your connection and try again.';
        console.error('Network error during registration:', e);
      }
    }
  }
}
</script>

<style scoped>
.register-form {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-left: 4px solid #d50a0a;
  padding: 32px;
  margin: 40px auto;
  max-width: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: left;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

h2 {
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 24px 0;
  text-shadow: none;
  letter-spacing: -0.02em;
}

.form-field {
  margin-bottom: 24px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

input {
  width: 100%;
  padding: 12px 16px;
  margin: 0;
  border: 1px solid #d1d1d1;
  background: #ffffff;
  font-size: 14px;
  font-family: inherit;
  color: #333333;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #d50a0a;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 60px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #666666;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.toggle-password:hover {
  color: #d50a0a;
}

.submit-button {
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
  margin: 16px 0 0 0;
  width: 100%;
}

.submit-button:hover {
  background: #b71c1c;
  border-color: #b71c1c;
}

.error {
  color: #d50a0a;
  font-size: 14px;
  padding: 12px;
  background: #ffebee;
  border-left: 4px solid #d50a0a;
  margin: 16px 0 0 0;
}

.success {
  color: #1b5e20;
  font-size: 14px;
  padding: 12px;
  background: #e8f5e8;
  border-left: 4px solid #4caf50;
  margin: 16px 0 0 0;
}

@media (max-width: 600px) {
  .register-form {
    margin: 20px auto;
    padding: 24px;
    max-width: 90vw;
  }
}
</style>
