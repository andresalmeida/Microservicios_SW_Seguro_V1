const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(bodyParser.json()); // Middleware para parsear JSON

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Ruta raíz para pruebas
app.get('/', (req, res) => {
  res.send('API de usuarios está funcionando');
});

// **Ruta para registrar usuarios**
app.post('/usuarios/registro', async (req, res) => {
  const { nombre, email, password, perfil } = req.body;

  try {
    // Encripta la contraseña
    const hashedPassword = await argon2.hash(password);

    // Inserta el usuario en la base de datos
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, perfil) VALUES ($1, $2, $3, $4) RETURNING id_usuario AS id, nombre, email, perfil AS rol, creado_en',
      [nombre, email, hashedPassword, perfil || 'usuario']
    );

    res.status(201).json({
      message: 'Usuario registrado con éxito',
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
});

// **Ruta para iniciar sesión**
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca al usuario en la base de datos
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Verifica la contraseña
    const isPasswordCorrect = await argon2.verify(user.password, password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Genera el token JWT
    const token = jwt.sign(
      { id: user.id_usuario, email: user.email, rol: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn: '7m' }
    );

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
});

// **Middleware para validar JWT**
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// **Ruta protegida: obtener el perfil del usuario autenticado**
app.get('/usuarios/perfil', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_usuario AS id, nombre, email, perfil AS rol FROM usuarios WHERE id_usuario = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
  }
});

// **Ruta protegida: obtener todos los usuarios (solo admin)**
app.get('/usuarios', authenticateJWT, async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: no tienes permisos de administrador' });
  }

  try {
    const result = await pool.query(
      'SELECT id_usuario AS id, nombre, email, perfil AS rol, creado_en FROM usuarios'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
});

// **Actualizar un usuario**
app.put('/usuarios/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, perfil } = req.body;

  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: no tienes permisos de administrador' });
  }

  try {
    const hashedPassword = password ? await argon2.hash(password) : null;

    // Generar consulta dinámica
    const fields = [];
    const values = [];
    if (nombre) {
      fields.push('nombre');
      values.push(nombre);
    }
    if (email) {
      fields.push('email');
      values.push(email);
    }
    if (hashedPassword) {
      fields.push('password');
      values.push(hashedPassword);
    }
    if (perfil) {
      fields.push('perfil');
      values.push(perfil);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos para actualizar' });
    }

    const query = `UPDATE usuarios SET ${fields.map((field, index) => `${field} = $${index + 1}`).join(', ')} WHERE id_usuario = $${fields.length + 1}`;
    values.push(id);

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
});

// **Eliminar un usuario**
app.delete('/usuarios/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: no tienes permisos de administrador' });
  }

  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
});


// **Iniciar el servidor**
app.listen(3000, () => {
  console.log('Microservicio Usuarios escuchando en el puerto 3000');
});
