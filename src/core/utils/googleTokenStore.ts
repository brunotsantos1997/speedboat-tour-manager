// src/core/utils/googleTokenStore.ts

/**
 * Armazena o token OAuth do Google apenas em memória.
 * Tokens OAuth expiram em ~1h e não devem persistir entre sessões.
 * sessionStorage é usado apenas como fallback para a mesma aba/sessão,
 * e é limpo no logout.
 */

const SESSION_KEY = 'g_at';

let _token: string | null = null;

export const googleTokenStore = {
  get(): string | null {
    if (_token) return _token;
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    _token = token;
    try {
      sessionStorage.setItem(SESSION_KEY, token);
    } catch {
      // sessionStorage indisponível (ex: modo privado restrito) — só memória
    }
  },

  clear(): void {
    _token = null;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignora
    }
    // garante remoção de qualquer versão antiga em localStorage
    try {
      localStorage.removeItem('google_access_token');
    } catch {
      // ignora
    }
  },
};
