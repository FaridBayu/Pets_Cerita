import StoryApi from '../../data/api';

export default class RegisterPage {
async render() {
    return `
      <section class="container">
        <div class="auth-page">
          <h1>Register</h1>
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label for="name-input">Name</label>
              <input type="text" id="name-input" name="name" required>
            </div>
            <div class="form-group">
              <label for="email-input">Email</label>
              <input type="email" id="email-input" name="email" required>
            </div>
            <div class="form-group">
              <label for="password-input">Password</label>
              <input type="password" id="password-input" name="password" required minlength="8">
            </div>
            <button type="submit" class="button-primary">Register</button>
          </form>
          <p id="error-message" class="error-message"></p>
          <p id="success-message" class="success-message"></p>
          <p class="auth-switch">Sudah punya akun? <a href="#/login">Login di sini</a></p>
        </div>
        </section>
    `;
  }

    async afterRender() {
        const registerForm = document.getElementById('register-form');
        const nameInput = document.getElementById('name-input');
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.textContent = '';
            successMessage.textContent = '';
            const submitButton = registerForm.querySelector('button');
            submitButton.disabled = true;
            submitButton.textContent = 'Registering...';

            try {
                const response = await StoryApi.register(
                    nameInput.value,
                    emailInput.value,
                    passwordInput.value,
                );

                if (response.error) {
                    throw new Error(response.message);
                }

                successMessage.textContent = 'Registrasi berhasil! Silakan login.';
                registerForm.reset();

            } catch (error) {
                console.error(error);
                errorMessage.textContent = `Registrasi Gagal: ${error.message}`;
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Register';
            }
        });
    }
}