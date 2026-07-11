// ═══════════════════════════════════════════════════════════════════════
// ⚠️  NÃO REMOVER / NÃO "LIMPAR" — INFRAESTRUTURA (gerenciada fora do AI Studio).
//     Este é o PORTÃO DE SENHA do Backoffice. É USADO no App.tsx (case
//     BACKOFFICE). Se parecer "não usado", NÃO é — removê-lo deixa o painel
//     admin aberto a qualquer um. Deixe como está.
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';

/**
 * Portão de senha para o Backoffice.
 *
 * Nota de segurança: como o site é estático (sem backend de auth), a
 * verificação acontece no navegador. Guardamos apenas o hash SHA-256 da
 * senha — a senha em texto nunca fica no código. Isso protege contra
 * acesso casual/curioso, mas não é uma barreira contra um atacante
 * determinado que leia o bundle. Para proteção forte de verdade seria
 * preciso um backend.
 *
 * A senha pode ser trocada sem mexer no código, definindo a variável de
 * ambiente VITE_ADMIN_PASSWORD_HASH (o hash SHA-256, em hex minúsculo) no
 * painel do Vercel/Netlify. Se não definida, usa o hash padrão embutido.
 */

// Hash SHA-256 padrão da senha (hex). Sobrescrevível por VITE_ADMIN_PASSWORD_HASH.
const DEFAULT_ADMIN_HASH = '1c4e5effc9aefbf01c2b4ec491a0d56c67f290e6b0dc9bff2d9194cf5686208f';

const ADMIN_HASH = (
  import.meta.env.VITE_ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_HASH
).toLowerCase();

const SESSION_KEY = 'ra_admin_authed';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isAdminAuthed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function clearAdminAuth(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

interface AdminGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminGate: React.FC<AdminGateProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  // Se o hash não foi configurado, não há como proteger — libera com aviso no console.
  useEffect(() => {
    if (!ADMIN_HASH || ADMIN_HASH === '__ADMIN_HASH__') {
      console.warn(
        '[AdminGate] Senha não configurada (VITE_ADMIN_PASSWORD_HASH ou hash padrão). Acesso liberado.'
      );
      onSuccess();
    }
  }, [onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    setError(false);
    try {
      const hash = await sha256Hex(password);
      if (hash === ADMIN_HASH) {
        try {
          sessionStorage.setItem(SESSION_KEY, 'true');
        } catch {
          /* noop */
        }
        onSuccess();
      } else {
        setError(true);
        setPassword('');
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#050505] text-white px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-5"
        autoComplete="off"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-electrolize text-[var(--accent)] lowercase tracking-wide">
            fluxo /// acesso restrito
          </h1>
          <p className="text-[11px] text-white/40 lowercase">
            área de gestão. informe a senha para continuar.
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(false);
          }}
          placeholder="senha"
          autoFocus
          className={`w-full bg-transparent border ${
            error ? 'border-red-500' : 'border-white/20'
          } rounded-md px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors`}
        />

        {error && (
          <span className="text-[11px] text-red-500 lowercase">
            senha incorreta.
          </span>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={checking || !password}
            className="w-full py-3 rounded-md bg-[var(--accent)] text-black text-xs uppercase tracking-widest font-bold disabled:opacity-30 transition-opacity"
          >
            {checking ? 'verificando...' : 'entrar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
          >
            voltar ao site
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminGate;
