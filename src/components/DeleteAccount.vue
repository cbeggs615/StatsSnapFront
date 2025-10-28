<template>
  <div class="delete-account-modal">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="delete-account-card">
      <div class="modal-header">
        <h2>Delete Account</h2>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>

      <form @submit.prevent="handleDelete" class="delete-form">
        <div class="warning-message">
          <strong>Warning:</strong> This action cannot be undone. All your tracked teams and stats will be permanently deleted.
        </div>

        <div class="form-field">
          <label for="del-password">Confirm Password</label>
          <div class="password-input-wrapper">
            <input id="del-password" :type="showPassword ? 'text' : 'password'" v-model="password" required />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div class="actions">
          <button type="button" @click="$emit('close')" class="cancel-button">Cancel</button>
          <button type="submit" class="delete-button">Delete Account</button>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">Account deleted successfully. You are now logged out.</div>
      </form>
    </div>
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
        this.error = 'Unable to connect to the server. Please check your connection and try again.';
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
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  cursor: pointer;
}

.delete-account-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-left: 4px solid #d50a0a;
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  text-align: left;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 0 32px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
  padding-bottom: 20px;
}

h2 {
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0;
  text-shadow: none;
  letter-spacing: -0.02em;
}

.close-button {
  background: none;
  border: none;
  font-size: 32px;
  font-weight: 300;
  color: #999999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-button:hover {
  color: #d50a0a;
}

.delete-form {
  padding: 0 32px 32px 32px;
}

.warning-message {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-left: 4px solid #f39c12;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #856404;
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

.actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.cancel-button {
  background: #ffffff;
  color: #666666;
  border: 1px solid #d1d1d1;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex: 1;
}

.cancel-button:hover {
  background: #f8f9fa;
  border-color: #999999;
}

.delete-button {
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
  flex: 1;
}

.delete-button:hover {
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

@media (max-width: 768px) {
  .delete-account-card {
    width: 95vw;
    max-height: 85vh;
  }

  .modal-header {
    padding: 20px 20px 0 20px;
    margin-bottom: 20px;
    padding-bottom: 16px;
  }

  .delete-form {
    padding: 0 20px 20px 20px;
  }

  h2 {
    font-size: 20px;
  }

  .actions {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
