// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para procesar campos JSON en las solicitudes
app.use((req, res, next) => {
  // Convertir los campos JSON a String antes de guardarlos
  if (req.body && req.body.datos && typeof req.body.datos === 'object') {
    req.body.datos = JSON.stringify(req.body.datos);
  }
  if (req.body && req.body.productos && typeof req.body.productos === 'object') {
    req.body.productos = JSON.stringify(req.body.productos);
  }
  next();
});

// Función para procesar resultados JSON
function procesarResultados(rows) {
  return rows.map(row => {
    // Convertir campos JSON a objetos
    if (row.datos && typeof row.datos === 'string') {
      try {
        row.datos = JSON.parse(row.datos);
      } catch (e) {
        console.error('Error al parsear JSON de datos:', e);
        row.datos = {};
      }
    }
    if (row.productos && typeof row.productos === 'string') {
      try {
        row.productos = JSON.parse(row.productos);
      } catch (e) {
        console.error('Error al parsear JSON de productos:', e);
        row.productos = [];
      }
    }
    return row;
  });
}

// Inicializar base de datos
async function initDatabase() {
  try {
    // Crear tablas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clientes (
        dni TEXT PRIMARY KEY,
        nombres TEXT,
        apellidos TEXT,
        datos TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS vendedores (
        dni TEXT PRIMARY KEY,
        nombres TEXT,
        apellidos TEXT,
        datos TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ventas (
        id TEXT PRIMARY KEY,
        cliente_dni TEXT,
        vendedor_dni TEXT,
        fecha TEXT,
        productos TEXT,
        total REAL
      )
    `);

    // Crear índices
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_cliente_dni ON ventas (cliente_dni)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_vendedor_dni ON ventas (vendedor_dni)`);

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

// Rutas API para clientes
app.get('/api/clientes', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM clientes');
    res.json(procesarResultados(result.rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clientes/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const result = await db.execute('SELECT * FROM clientes WHERE dni = ?', [dni]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(procesarResultados(result.rows)[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { dni, nombres, apellidos, datos } = req.body;
    await db.execute(
      'INSERT INTO clientes (dni, nombres, apellidos, datos) VALUES (?, ?, ?, ?)',
      [dni, nombres, apellidos, typeof datos === 'object' ? JSON.stringify(datos) : datos]
    );
    res.status(201).json({ message: 'Cliente creado exitosamente' });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clientes/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const { nombres, apellidos, datos } = req.body;
    await db.execute(
      'UPDATE clientes SET nombres = ?, apellidos = ?, datos = ? WHERE dni = ?',
      [nombres, apellidos, typeof datos === 'object' ? JSON.stringify(datos) : datos, dni]
    );
    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clientes/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    await db.execute('DELETE FROM clientes WHERE dni = ?', [dni]);
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas API para vendedores
app.get('/api/vendedores', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM vendedores');
    res.json(procesarResultados(result.rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vendedores/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const result = await db.execute('SELECT * FROM vendedores WHERE dni = ?', [dni]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }
    res.json(procesarResultados(result.rows)[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vendedores', async (req, res) => {
  try {
    const { dni, nombres, apellidos, datos } = req.body;
    await db.execute(
      'INSERT INTO vendedores (dni, nombres, apellidos, datos) VALUES (?, ?, ?, ?)',
      [dni, nombres, apellidos, typeof datos === 'object' ? JSON.stringify(datos) : datos]
    );
    res.status(201).json({ message: 'Vendedor creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vendedores/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    const { nombres, apellidos, datos } = req.body;
    await db.execute(
      'UPDATE vendedores SET nombres = ?, apellidos = ?, datos = ? WHERE dni = ?',
      [nombres, apellidos, typeof datos === 'object' ? JSON.stringify(datos) : datos, dni]
    );
    res.json({ message: 'Vendedor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vendedores/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    await db.execute('DELETE FROM vendedores WHERE dni = ?', [dni]);
    res.json({ message: 'Vendedor eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas API para ventas
app.get('/api/ventas', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM ventas');
    res.json(procesarResultados(result.rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ventaResult = await db.execute('SELECT * FROM ventas WHERE id = ?', [id]);
    
    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    const venta = procesarResultados(ventaResult.rows)[0];
    
    // Obtener cliente y vendedor relacionados
    const [clienteResult, vendedorResult] = await Promise.all([
      db.execute('SELECT * FROM clientes WHERE dni = ?', [venta.cliente_dni]),
      db.execute('SELECT * FROM vendedores WHERE dni = ?', [venta.vendedor_dni])
    ]);
    
    const cliente = clienteResult.rows.length > 0 ? procesarResultados(clienteResult.rows)[0] : null;
    const vendedor = vendedorResult.rows.length > 0 ? procesarResultados(vendedorResult.rows)[0] : null;
    
    res.json({
      venta,
      cliente,
      vendedor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ventas', async (req, res) => {
  try {
    const { id, cliente_dni, vendedor_dni, fecha, productos, total } = req.body;
    await db.execute(
      'INSERT INTO ventas (id, cliente_dni, vendedor_dni, fecha, productos, total) VALUES (?, ?, ?, ?, ?, ?)',
      [id, cliente_dni, vendedor_dni, fecha, typeof productos === 'object' ? JSON.stringify(productos) : productos, total]
    );
    res.status(201).json({ message: 'Venta creada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_dni, vendedor_dni, fecha, productos, total } = req.body;
    await db.execute(
      'UPDATE ventas SET cliente_dni = ?, vendedor_dni = ?, fecha = ?, productos = ?, total = ? WHERE id = ?',
      [cliente_dni, vendedor_dni, fecha, typeof productos === 'object' ? JSON.stringify(productos) : productos, total, id]
    );
    res.json({ message: 'Venta actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM ventas WHERE id = ?', [id]);
    res.json({ message: 'Venta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  await initDatabase();
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});