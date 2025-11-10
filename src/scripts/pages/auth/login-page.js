import StoryApi from '../../data/api';
import { saveUserToken } from '../../utils/auth';

export default class LoginPage {
async render() {
    return `
      <section class="container">
        <div class="auth-page">
          <h1>Login</h1>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="email-input">Email</label>
              <input type="email" id="email-input" name="email" required>
            </div>
            <div class="form-group">
              <label for="password-input">Password</label>
              <input type="password" id="password-input" name="password" required minlength="8">
            </div>
            <button type="submit" class="button-primary">Login</button>
          </form>
          <p id="error-message" class="error-message"></p>
          <p class="auth-switch">Belum punya akun? <a href="#/register">Register di sini</a></p>
        </div>
        </section>
    `;
  }

    async afterRender() {
        const loginForm = document.getElementById('login-form');
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');
        const errorMessage = document.getElementById('error-message');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.textContent = '';
            const submitButton = loginForm.querySelector('button');
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';

            try {
                const response = await StoryApi.login(
                    emailInput.value,
                    passwordInput.value,
                );

                if (response.error) {
                    throw new Error(response.message);
                }

                // Simpan token ke session storage
                saveUserToken(response.loginResult.token);

                // Redirect ke halaman utama
                window.location.hash = '#/';
                window.location.reload(); 

            } catch (error) {
                console.error(error);
                errorMessage.textContent = `Login Gagal: ${error.message}`;
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        });
    }
}