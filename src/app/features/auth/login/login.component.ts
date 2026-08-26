import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgOptimizedImage],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <img class="logo" ngSrc="/logo.png" width="120" height="120" alt="Fitness Factory" priority />
          <h1>Fitness Factory</h1>
          <p>Ingresa a tu cuenta</p>
        </div>

        @if (errorMsg()) {
          <div class="error-banner" role="alert" aria-live="assertive">
            {{ errorMsg() }}
          </div>
        }

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input 
            id="email"
            type="email" 
            [(ngModel)]="email" 
            name="email"
            autocomplete="email"
            placeholder="correo@ejemplo.com"
            (keyup.enter)="onLogin()"
            [disabled]="loading()"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            id="password"
            type="password" 
            [(ngModel)]="password" 
            name="password"
            autocomplete="current-password"
            placeholder="••••••••"
            (keyup.enter)="onLogin()"
            [disabled]="loading()"
          />
        </div>

        <button 
          class="btn-login" 
          (click)="onLogin()" 
          [disabled]="loading() || !email || !password"
        >
          @if (loading()) {
            <span class="spinner" aria-hidden="true"></span> Ingresando…
          } @else {
            Ingresar
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary, #0f172a);
      padding: 1rem;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg-card, #1e293b);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      box-shadow: var(--shadow-login);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      width: 4.5rem;
      height: 4.5rem;
      margin-bottom: 1rem;
      object-fit: contain;
      border-radius: var(--radius-xl);
    }

    .login-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary, #f1f5f9);
      margin: 0 0 0.25rem;
    }

    .login-header p {
      color: var(--text-secondary, #94a3b8);
      font-size: 0.9rem;
      margin: 0;
    }

    .error-banner {
      background: var(--color-danger-subtle);
      border: 1px solid var(--color-danger-subtle);
      color: var(--color-danger-text);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary, #94a3b8);
      margin-bottom: 0.5rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-input, #0f172a);
      border: 1px solid var(--border, #334155);
      border-radius: 8px;
      color: var(--text-primary, #f1f5f9);
      font-size: 0.95rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

      .form-group input:focus-visible {
        outline: none;
        border-color: var(--primary, #3b82f6);
        box-shadow: var(--shadow-focus);
      }

    .form-group input::placeholder {
      color: var(--text-muted, #475569);
    }

    .btn-login {
      width: 100%;
      padding: 0.85rem;
      background: var(--primary, #3b82f6);
      color: var(--text-on-primary);
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

      .btn-login:hover:not(:disabled) {
        background: var(--primary-hover, #2563eb);
      }

      .btn-login:focus-visible {
        outline: none;
        box-shadow: var(--shadow-focus);
      }

    .btn-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async onLogin() {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.errorMsg.set('');

    const { error } = await this.auth.login(this.email, this.password);

    if (error) {
      this.errorMsg.set(error);
      this.loading.set(false);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
