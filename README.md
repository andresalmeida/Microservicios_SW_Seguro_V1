# Microservicios V1

Este repositorio contiene una implementación de microservicios para gestionar diferentes aspectos de un sistema, incluyendo productos, pedidos y envíos. Cada servicio es independiente y utiliza **Node.js**, **Express** y **PostgreSQL** como base de datos.

## **Descripción**

Este proyecto implementa cinco microservicios principales:
1. **Productos-service:** Gestión de productos.
2. **Pedidos-service:** Gestión de pedidos realizados por usuarios.
3. **Envíos-service:** Gestión de envíos relacionados con los pedidos.

Cada servicio es independiente y se comunica con la base de datos.

---

## **Servicios Disponibles**

### 1. **Usuarios-service**
- **Puerto:** `3000`
- **Descripción:** Permite crear, actualizar, eliminar y listar usuarios.

### 2. **Productos-service**
- **Puerto:** `3001`
- **Descripción:** Permite crear, actualizar, eliminar y listar productos.

### 3. **Carrito-service**
- **Puerto:** `3002`
- **Descripción:** Permite crear, actualizar, eliminar y listar carritos de compras.

### 4. **Pedidos-service**
- **Puerto:** `3003`
- **Descripción:** Gestión de pedidos realizados por usuarios.

### 5. **Envíos-service**
- **Puerto:** `3004`
- **Descripción:** Gestión de envíos relacionados con pedidos.

---

## **Requisitos**

- **Node.js** (v14 o superior)
- **PostgreSQL** (v12 o superior)
- **NPM** (v6 o superior)
- Variables de entorno configuradas en un archivo `.env`.

---

## **Instalación**

1. Clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd Microservicios
   ```
2. Instalar dependencias para cada servicio
   ```bash
   cd productos-service
   npm install
   cd ../pedidos-service
   npm install
   cd ../envios-service
   npm install
   ```
3. Correr en Docker:
   ```bash
   cd Microservicios
   docker-compose build
   docker-compose up
   ```
4. Verificar que los servicios estén corriendo
  - Usuarios-service: http://localhost:3000/
  - Productos-service: http://localhost:3001/
  - Carrito-service: http://localhost:3002/
  - Pedidos-service: http://localhost:3003/
  - Envíos-service: http://localhost:3004/

## Contribuciones
Si deseas contribuir, por favor:
1.	Haz un fork del proyecto.
2.	Crea una rama con tu funcionalidad (git checkout -b feature/nueva-funcionalidad).
3.	Haz commit de tus cambios (git commit -m 'Agrega nueva funcionalidad').
4.	Haz push a tu rama (git push origin feature/nueva-funcionalidad).
5.	Crea un Pull Request.


   
