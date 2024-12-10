const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');

dotenv.config();

const app = express();
app.use(express.json());

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Middleware para validar JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Agregar datos del usuario al request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// **Ruta raíz para pruebas**
app.get('/', (req, res) => {
  res.send('API de productos está funcionando');
});

// **Ver todos los productos** (Accesible para usuarios y administradores)
app.get('/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Crear producto** (Solo administradores)
app.post('/productos', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') { // Cambié 'perfil' por 'rol'
    return res.status(403).json({ message: 'Acceso denegado: solo los administradores pueden crear productos' });
  }

  const { nombre, descripcion, precio, categoria } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion, precio, categoria]
    );
    res.status(201).json({ message: 'Producto creado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Ver un solo producto** (Accesible para usuarios y administradores)
app.get('/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM productos WHERE id_producto = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Actualizar producto** (Solo administradores)
app.put('/productos/:id', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') { // Cambié 'perfil' por 'rol'
    return res.status(403).json({ message: 'Acceso denegado: solo los administradores pueden actualizar productos' });
  }

  const { id } = req.params;
  const { nombre, descripcion, precio, categoria } = req.body;

  try {
    const result = await pool.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, categoria = $4 WHERE id_producto = $5 RETURNING *',
      [nombre, descripcion, precio, categoria, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// **Eliminar producto** (Solo administradores)
app.delete('/productos/:id', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') { // Cambié 'perfil' por 'rol'
    return res.status(403).json({ message: 'Acceso denegado: solo los administradores pueden eliminar productos' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM productos WHERE id_producto = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado', producto: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar producto:', err.message);
    res.status(500).json({ message: 'Error de base de datos', error: err.message });
  }
});

// Iniciar el servidor en el puerto 3001
app.listen(3001, () => {
  console.log('API de productos escuchando en puerto 3001');
});
