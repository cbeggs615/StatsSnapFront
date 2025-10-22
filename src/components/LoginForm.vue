<template>
  <form @submit.prevent="handleLogin">
    <h2>Login</h2>
    <div>
      <label for="username">Username:</label>
      <input id="username" v-model="username" required />
    </div>
    <div>
      <label for="password">Password:</label>
      <div class="password-input-wrapper">
        <input id="password" :type="showPassword ? 'text' : 'password'" v-model="password" required />
        <button type="button" class="toggle-password" @click="showPassword = !showPassword">
          {{ showPassword ? 'Hide' : 'Show' }}
        </button>
      </div>
    </div>
    <button type="submit">Login</button>
    <div v-if="error" class="error">{{ error }}</div>
  </form>
</template>

<script>
export default {
  name: 'LoginForm',
  data() {
    return {
      username: '',
      password: '',
      error: '',
      showPassword: false
    }
  },
  methods: {
    async handleLogin() {
      this.error = '';
      try {
        const response = await fetch('/api/PasswordAuth/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const result = await response.json();
        if (result.success) {
          this.$emit('login-success', this.username);
        } else {
          this.error = result.error || 'Login failed.';
        }
      } catch (e) {
        this.error = 'Network error.';
      }
    }
  }
}
</script>

<style scoped>
form {
  max-width: 340px;
  margin: 40px auto;
  padding: 24px;
  border: 2px solid #2ca58d;
  border-radius: 18px;
  background: #fff;
  color: #0a2342;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  box-shadow: 0 4px 16px rgba(44, 165, 141, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
}
h2 {
  font-family: 'Oswald', 'Montserrat', sans-serif;
  color: #2ca58d;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 18px;
}
label {
  color: #0a2342;
  font-weight: 700;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  align-self: flex-start;
}
input {
  width: 100%;
  padding: 10px;
  margin: 8px 0 16px 0;
  border: 1px solid #2ca58d;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  color: #0a2342;
  background: #f8fafc;
  text-align: left;
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
.error {
  color: #e63946;
  font-weight: 700;
  margin-top: 10px;
}
.password-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toggle-password {
  background: none;
  border: none;
  color: #2ca58d;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95em;
  padding: 0 6px;
}
.toggle-password:hover {
  color: #0a2342;
}
</style>
