<template>
  <div class="delete-account-modal">
    <form @submit.prevent="handleDelete">
      <h2>Delete Account</h2>
      <div>
        <label for="del-password">Confirm Password:</label>
        <div class="password-input-wrapper">
          <input id="del-password" :type="showPassword ? 'text' : 'password'" v-model="password" required />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>
      <div class="actions">
        <button type="submit">Delete Account</button>
        <button type="button" @click="$emit('close')" class="cancel-btn">Cancel</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">Account deleted. You are now logged out.</div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'DeleteAccount',
  props: ['username'],
  data() {
    return {
      password: '',
      error: '',
      success: false,
      showPassword: false
    }
  },
  methods: {
    async handleDelete() {
      this.error = '';
      this.success = false;
      try {
        const response = await fetch('/api/PasswordAuth/deleteAccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const result = await response.json();
        if (result.success) {
          this.success = true;
          this.$emit('account-deleted');
        } else {
          this.error = result.error || 'Delete failed.';
        }
      } catch (e) {
        this.error = 'Network error: ' + (e.message || e);
        console.error('Network error during account deletion:', e);
      }
    }
  }
}
</script>

<style scoped>
.delete-account-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(60, 60, 60, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
form {
  max-width: 320px;
  margin: 0;
  padding: 28px 24px;
  border: 2px solid #2ca58d;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
  color: #0a2342;
  font-family: 'Montserrat', 'Oswald', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}
label {
  align-self: flex-start;
  color: #0a2342;
  font-weight: 700;
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
.password-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}
.toggle-password {
  position: absolute;
  right: 10px;
  top: 10px;
  background: none;
  border: none;
  color: #2ca58d;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0 6px;
}
.toggle-password:hover {
  color: #0a2342;
}
.actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.cancel-btn {
  background: #e5e7eb;
  color: #22223b;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cancel-btn:hover {
  background: #cbd5e1;
}
.error {
  color: #dc2626;
  font-weight: 500;
}
.success {
  color: #059669;
  font-weight: 500;
}
h2 {
  color: #2ca58d;
  font-family: 'Oswald', 'Montserrat', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 18px;
}
</style>
