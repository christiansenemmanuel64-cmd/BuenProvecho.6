// auth.js: todo lo relacionado con la sesión
import { supabase } from './supabaseClient.js';

export async function obtenerUsuario() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? session.user : null;
}

export async function registrarse(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function iniciarSesion(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function escucharCambiosDeSesion(callback) {
  // setTimeout evita bloqueos al llamar a Supabase dentro de este evento
  supabase.auth.onAuthStateChange((_evento, session) => {
    setTimeout(() => callback(session ? session.user : null), 0);
  });
}
