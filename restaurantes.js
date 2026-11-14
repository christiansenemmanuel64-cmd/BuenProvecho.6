// restaurantes.js: todo lo relacionado con la base de datos y el storage
import { supabase } from './supabaseClient.js';

export const FOTO_VACIA = 'https://placehold.co/300x400?text=Sin+Foto';

function verificar(error, texto) {
  if (error) throw new Error(texto + ': ' + error.message);
}

export async function obtenerRestaurantesBD() {
  const { data, error } = await supabase.from('restaurantes').select('*').order('created_at', { ascending: false });
  verificar(error, 'No se pudo cargar el catálogo');
  return data;
}

export async function obtenerRestauranteBD(id) {
  const { data, error } = await supabase.from('restaurantes').select('*').eq('id', id).single();
  verificar(error, 'No se pudo cargar el restaurante');
  return data;
}

export async function crearRestauranteBD(datos) {
  const { error } = await supabase.from('restaurantes').insert([datos]);
  verificar(error, 'No se pudo guardar');
}

// Con RLS, si no sos el dueño Supabase NO da error: simplemente no toca ninguna fila.
// Por eso se pide .select() y se comprueba que haya cambiado algo.
export async function actualizarRestauranteBD(id, datos) {
  const { data, error } = await supabase.from('restaurantes').update(datos).eq('id', id).select();
  verificar(error, 'No se pudo actualizar');
  if (!data.length) throw new Error('No tenés permiso para editar esta reseña');
}

export async function eliminarRestauranteBD(id) {
  const { data, error } = await supabase.from('restaurantes').delete().eq('id', id).select();
  verificar(error, 'No se pudo eliminar');
  if (!data.length) throw new Error('No tenés permiso para eliminar esta reseña');
}

export async function subirFoto(archivo) {
  const ext = archivo.name.split('.').pop();
  const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('fotos').upload(ruta, archivo);
  verificar(error, 'No se pudo subir la foto');
  return supabase.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
}

export async function obtenerComentariosBD() {
  const { data, error } = await supabase.from('comentarios').select('*').order('created_at', { ascending: true });
  verificar(error, 'No se pudieron cargar los comentarios');
  return data;
}

export async function crearComentarioBD(restaurante_id, texto, user_email) {
  const { error } = await supabase.from('comentarios').insert([{ restaurante_id, texto, user_email }]);
  verificar(error, 'No se pudo comentar');
}
