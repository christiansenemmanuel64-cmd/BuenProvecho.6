# Modelo de datos - BuenProvecho

| Dato | Control HTML | Tipo en la base de datos |
|---|---|---|
| Nombre del restaurante | `input type="text"` | text |
| Tipo de cocina | `select` | text |
| Puntuación (0 a 10) | `input type="number"` | numeric |
| Reseña (¿qué tal estuvo?) | `textarea` | text |
| Foto | `input type="file"` | text (URL de la imagen en Storage) |
| Reseñado por | se completa solo | text (email) |
| Fecha de carga | se completa sola | timestamptz |
