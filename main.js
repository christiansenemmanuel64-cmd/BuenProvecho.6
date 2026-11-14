// main.js: el coordinador. Conecta la pantalla con auth.js y restaurantes.js
import { obtenerUsuario, registrarse, iniciarSesion, cerrarSesion, escucharCambiosDeSesion } from './auth.js';
import {
  FOTO_VACIA, obtenerRestaurantesBD, obtenerRestauranteBD, crearRestauranteBD, actualizarRestauranteBD,
  eliminarRestauranteBD, subirFoto, obtenerComentariosBD, crearComentarioBD
} from './restaurantes.js';

let usuario = null;
const $ = (id) => document.getElementById(id);
const valor = (id) => $(id).value.trim();
const formRestaurante = $('form-restaurante');
const btnSubmit = $('btn-submit');
const btnCancelar = $('btn-cancelar');
const imagenFile = $('imagen-file');

function avisar(texto, tipo, nodo = $('mensaje')) {
  nodo.textContent = texto;
  nodo.className = 'mensaje ' + tipo;
}

function el(tag, clase, texto) {
  const nodo = document.createElement(tag);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

// ---------- Sesión ----------
function actualizarSesion() {
  $('form-section').hidden = !usuario;
  $('form-auth').hidden = !!usuario;
  $('sesion-activa').hidden = !usuario;
  $('usuario-email').textContent = usuario ? usuario.email : '';
}

$('form-auth').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await iniciarSesion(valor('auth-email'), $('auth-password').value);
    avisar('', 'ok', $('mensaje-auth'));
  } catch (err) {
    avisar('No se pudo iniciar sesión: ' + err.message, 'error', $('mensaje-auth'));
  }
});

$('btn-registro').addEventListener('click', async () => {
  if (!$('form-auth').reportValidity()) return;
  try {
    const data = await registrarse(valor('auth-email'), $('auth-password').value);
    avisar(data.session ? '¡Cuenta creada! Ya iniciaste sesión.' : 'Cuenta creada. Revisá tu correo para confirmarla.', 'ok', $('mensaje-auth'));
  } catch (err) {
    avisar('No se pudo crear la cuenta: ' + err.message, 'error', $('mensaje-auth'));
  }
});

$('btn-logout').addEventListener('click', () => cerrarSesion());

// ---------- Catálogo ----------
function crearTarjeta(restaurante, comentarios) {
  const card = el('article', 'card-restaurante');
  const img = el('img');
  img.src = restaurante.imagen_url || FOTO_VACIA;
  img.alt = 'Foto de ' + restaurante.nombre;
  img.onerror = () => { img.onerror = null; img.src = FOTO_VACIA; };
  const cuerpo = el('div', 'card-body');
  const info = el('div', 'card-header-info');
  info.append(el('span', 'badge-cocina', restaurante.cocina || 'General'), el('span', 'score', '★ ' + (restaurante.puntuacion ?? 0)));
  cuerpo.append(
    info,
    el('h3', 'card-title', restaurante.nombre),
    el('p', 'card-resena', restaurante.resena || ''),
    el('div', 'card-footer-author', 'Reseñado por: ' + (restaurante.user_email || 'Anónimo'))
  );

  // Editar y eliminar: solo para el dueño (la seguridad real la pone RLS en Supabase)
  if (usuario && usuario.email === restaurante.user_email) {
    const acciones = el('div', 'card-actions');
    const btnEditar = el('button', 'btn-action btn-edit', '✏️ Editar');
    btnEditar.onclick = () => prepararEdicion(restaurante.id);
    const btnEliminar = el('button', 'btn-action btn-delete', '🗑️ Eliminar');
    btnEliminar.onclick = () => eliminarRestaurante(restaurante.id);
    acciones.append(btnEditar, btnEliminar);
    cuerpo.append(acciones);
  }

  // Comentarios
  const bloque = el('div', 'card-comentarios');
  bloque.append(el('h4', undefined, `Comentarios (${comentarios.length})`));
  const lista = el('ul', 'lista-comentarios');
  comentarios.forEach((c) => {
    const li = el('li');
    li.append(el('strong', undefined, c.user_email + ': '), c.texto);
    lista.append(li);
  });
  bloque.append(lista);
  if (usuario) {
    const form = el('form', 'form-comentario');
    const campo = el('input');
    campo.placeholder = 'Escribí un comentario';
    campo.maxLength = 300;
    campo.required = true;
    const btn = el('button', 'btn-secundario', 'Comentar');
    btn.type = 'submit';
    form.append(campo, btn);
    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        await crearComentarioBD(restaurante.id, campo.value.trim(), usuario.email);
        await cargarRestaurantes();
      } catch (err) {
        avisar(err.message, 'error');
      }
    };
    bloque.append(form);
  } else {
    bloque.append(el('p', 'aviso', 'Iniciá sesión para comentar.'));
  }
  cuerpo.append(bloque);

  card.append(img, cuerpo);
  return card;
}

async function cargarRestaurantes() {
  const grid = $('grid-restaurantes');
  try {
    const [restaurantes, comentarios] = await Promise.all([obtenerRestaurantesBD(), obtenerComentariosBD()]);
    if (!restaurantes.length) {
      grid.replaceChildren(el('p', 'vacio', 'Todavía no hay reseñas. ¡Publicá la primera!'));
      return;
    }
    grid.replaceChildren(...restaurantes.map((s) => crearTarjeta(s, comentarios.filter((c) => c.restaurante_id === s.id))));
  } catch (err) {
    grid.replaceChildren(el('p', 'vacio', err.message));
  }
}

// ---------- Crear, editar y eliminar ----------
async function eliminarRestaurante(id) {
  if (!confirm('¿Estás seguro de que querés eliminar esta reseña?')) return;
  try {
    await eliminarRestauranteBD(id);
    if ($('restaurante-id').value == id) cancelarEdicion();
    avisar('Restaurante eliminado con éxito.', 'ok');
    await cargarRestaurantes();
  } catch (err) {
    avisar(err.message, 'error');
  }
}

async function prepararEdicion(id) {
  try {
    const restaurante = await obtenerRestauranteBD(id);
    $('restaurante-id').value = restaurante.id;
    $('nombre').value = restaurante.nombre;
    $('cocina').value = restaurante.cocina;
    $('puntuacion').value = restaurante.puntuacion;
    $('resena').value = restaurante.resena;
    imagenFile.required = false;
    $('nombre-form').textContent = 'Editar reseña';
    btnSubmit.textContent = 'Guardar cambios';
    btnCancelar.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    avisar(err.message, 'error');
  }
}

function cancelarEdicion() {
  formRestaurante.reset();
  $('restaurante-id').value = '';
  imagenFile.required = true;
  $('nombre-form').textContent = 'Reseñar un restaurante';
  btnSubmit.textContent = 'Publicar reseña';
  btnCancelar.hidden = true;
}
btnCancelar.addEventListener('click', cancelarEdicion);

formRestaurante.addEventListener('submit', async (e) => {
  e.preventDefault();
  btnSubmit.disabled = true;
  try {
    const id = $('restaurante-id').value;
    const datos = {
      nombre: valor('nombre'),
      cocina: valor('cocina'),
      puntuacion: parseFloat(valor('puntuacion')),
      resena: valor('resena')
    };
    if (imagenFile.files[0]) datos.imagen_url = await subirFoto(imagenFile.files[0]);
    if (id) {
      await actualizarRestauranteBD(id, datos);
      avisar('¡Reseña actualizada con éxito!', 'ok');
    } else {
      datos.imagen_url = datos.imagen_url || FOTO_VACIA;
      datos.user_email = usuario.email;
      await crearRestauranteBD(datos);
      avisar('¡Restaurante guardado con éxito!', 'ok');
    }
    cancelarEdicion();
    await cargarRestaurantes();
  } catch (err) {
    avisar(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
  }
});

// ---------- Inicio ----------
usuario = await obtenerUsuario();
actualizarSesion();
await cargarRestaurantes();

escucharCambiosDeSesion(async (nuevo) => {
  if (nuevo?.id === usuario?.id) return; // sin cambios reales
  usuario = nuevo;
  actualizarSesion();
  cancelarEdicion();
  await cargarRestaurantes();
});
