<template>
  <div v-if="visible" class="change-password-modal">
    <div class="change-password-overlay" @click="$emit('close')"></div>
    <div class="change-password-card">
      <div class="modal-header">
        <h2>Change Password</h2>
        <button @click="$emit('close')" class="close-button">×</button>
      </div>

      <form @submit.prevent="handleChangePassword" class="change-password-form">
        <div class="form-field">
          <label for="currentPassword">Current Password</label>
          <div class="password-input-wrapper">
            <input
              id="currentPassword"
              v-model="currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              @click="showCurrentPassword = !showCurrentPassword"
              class="password-toggle"
            >
              {{ showCurrentPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label for="newPassword">New Password</label>
          <div class="password-input-wrapper">
            <input
              id="newPassword"
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="password-toggle"
            >
              {{ showNewPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label for="confirmPassword">Confirm New Password</label>
          <div class="password-input-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="password-toggle"
            >
              {{ showConfirmPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">{{ success }}</div>

        <div class="form-actions">
          <button type="submit" :disabled="loading" class="change-password-btn">
            {{ loading ? 'Changing...' : 'Change Password' }}
          </button>
          <button type="button" @click="$emit('close')" class="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { API_BASE } from '../utils/apiConfig.js'

export default {
  name: 'ChangePasswordModal',
  props: {
    visible: { type: Boolean, required: true },
    username: { type: String, required: true }
  },
  data() {
    return {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    async handleChangePassword() {
      this.error = '';
      this.success = '';

      // Client-side validation
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'New passwords do not match.';
        return;
      }

      this.loading = true;

      try {
        const response = await fetch(`${API_BASE}/PasswordAuth/changePassword`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            currentPass: this.currentPassword,
            newPass: this.newPassword
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          this.success = 'Password changed successfully!';
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';

          // Close modal after a short delay to show success message
          setTimeout(() => {
            this.$emit('close');
          }, 1500);
        } else {
          this.error = data.error || 'Failed to change password. Please try again.';
        }
      } catch (e) {
        console.error('Error changing password:', e);
        this.error = 'Network error. Please check your connection and try again.';
      } finally {
        this.loading = false;
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // Reset form when modal opens
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
        this.error = '';
        this.success = '';
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.change-password-modal {
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

.change-password-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  cursor: pointer;
}

.change-password-card {
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
  margin-bottom: 32px;
  padding-bottom: 20px;
}

.modal-header h2 {
  font-family: 'BentonSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Arial, sans-serif;
  font-size: 28px;
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

.change-password-form {
  padding: 0 32px 32px 32px;
}

.form-field {
  margin-bottom: 24px;
}

.form-field label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-field input {
  width: 100%;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e5e5e5;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #ffffff;
  box-sizing: border-box;
}

.form-field input:focus {
  outline: none;
  border-color: #d50a0a;
}

.password-toggle {
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
  z-index: 1;
}

.password-toggle:hover {
  color: #d50a0a;
}

.error {
  background: #fee;
  color: #c33;
  padding: 12px;
  margin: 16px 0;
  border: 1px solid #fcc;
  font-size: 14px;
  font-weight: 500;
}

.success {
  background: #efe;
  color: #363;
  padding: 12px;
  margin: 16px 0;
  border: 1px solid #cfc;
  font-size: 14px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.change-password-btn {
  flex: 1;
  background: #d50a0a;
  color: #ffffff;
  border: none;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.change-password-btn:hover:not(:disabled) {
  background: #b8090a;
}

.change-password-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.cancel-btn {
  flex: 1;
  background: #ffffff;
  color: #666666;
  border: 2px solid #e5e5e5;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cancel-btn:hover {
  background: #f5f5f5;
  border-color: #d50a0a;
  color: #d50a0a;
}

@media (max-width: 600px) {
  .change-password-card {
    width: 95vw;
    max-height: 90vh;
  }

  .modal-header {
    padding: 20px 20px 0 20px;
    margin-bottom: 20px;
    padding-bottom: 16px;
  }

  .modal-header h2 {
    font-size: 24px;
  }

  .change-password-form {
    padding: 0 20px 20px 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .change-password-btn,
  .cancel-btn {
    padding: 14px 20px;
    font-size: 14px;
  }
}
</style>
