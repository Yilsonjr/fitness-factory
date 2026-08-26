import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _messages = signal<ToastMessage[]>([]);
  readonly messages = this._messages.asReadonly();

  success(title: string, message: string): void {
    this.add('success', title, message);
  }

  error(title: string, message: string): void {
    this.add('error', title, message);
  }

  info(title: string, message: string): void {
    this.add('info', title, message);
  }

  warning(title: string, message: string): void {
    this.add('warning', title, message);
  }

  dismiss(id: string): void {
    this._messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private add(tone: ToastTone, title: string, message: string): void {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: ToastMessage = { id, tone, title, message };
    this._messages.update((messages) => [...messages, toast]);
    globalThis.setTimeout(() => this.dismiss(id), 4500);
  }
}
