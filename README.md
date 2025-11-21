# 🏭 Assembly Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Sistema completo de gestión de ensamblaje de productos industriales con control de calidad, trazabilidad y administración de usuarios.

[Características](#-características-principales) • [Instalación](#-instalación) • [Uso](#-uso) • [Documentación](#-documentación)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características Principales](#-características-principales)
- [Tecnologías](#-tecnologías-utilizadas)
- [Requisitos del Sistema](#-requisitos-del-sistema)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Seguridad](#-seguridad)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**Assembly Management System** es una aplicación web full-stack diseñada para gestionar procesos de ensamblaje industrial de productos. El sistema permite el control completo de inventarios, trazabilidad de componentes, gestión de líneas de producción y administración de usuarios con diferentes niveles de acceso.

### Problema que Resuelve

- ✅ Elimina el uso de hojas de cálculo dispersas
- ✅ Centraliza la información de producción en tiempo real
- ✅ Proporciona trazabilidad completa de cada ensamblaje
- ✅ Reduce errores humanos mediante validaciones automáticas
- ✅ Facilita la toma de decisiones con dashboards en tiempo real

---

## ✨ Características Principales

### 🔐 Sistema de Autenticación Robusto
- **JWT (JSON Web Tokens)** con cookies httpOnly
- **Control de acceso basado en roles (RBAC)**
- Soporte para múltiples fuentes de usuarios (Usuarios/Operadores)
- Migración automática de contraseñas legacy a bcrypt
- Sesiones seguras con expiración configurable

### 📊 Dashboard Interactivo
- KPIs en tiempo real
- Top 10 ensamblajes por módulo
- Estadísticas de producción
- Sistema de alertas contextual
- Gráficos y visualizaciones

### 🔧 Gestión de Componentes
Módulos especializados para cada tipo de componente:
- **Collar A y B** - Gestión de collares tipo A y B
- **Crimp A y B** - Control de crimps y terminales
- **Hose** - Administración de mangueras
- **Sleeve Guard** - Protectores y guardas
- **Packaging** - Empaquetado y presentación

### 📦 Carga Masiva de Datos
- Importación de Excel con validación automática
- Plantilla predefinida descargable
- Validación de duplicados y formatos
- Asignación automática de folios
- Reporte detallado de errores

### 👥 Administración de Usuarios
- CRUD completo de usuarios
- Gestión de roles y permisos
- Auditoría de acciones
- Bloqueo de usuarios no autorizados

### 📱 Diseño Responsivo
- Interfaz adaptable a todos los dispositivos
- Modo claro/oscuro
- Componentes reutilizables con Tailwind CSS
- Experiencia de usuario optimizada

---

## 🛠️ Tecnologías Utilizadas

### Frontend
```
Next.js 15.0        → Framework React con SSR
React 19            → Biblioteca de UI
Tailwind CSS 3.4    → Framework de estilos
Lucide React        → Iconos
XLSX (SheetJS)      → Procesamiento de Excel
```

### Backend
```
Next.js API Routes  → Endpoints REST
JWT (jsonwebtoken)  → Autenticación
bcryptjs            → Hashing de contraseñas
mssql (tedious)     → Driver SQL Server
```

### Base de Datos
```
Microsoft SQL Server 2019+
```

### DevOps & Deployment
```
Git                 → Control de versiones
Node.js 18.17+      → Runtime
npm/yarn            → Gestor de paquetes
```

---

## 📋 Requisitos del Sistema

### Requisitos Mínimos

| Componente | Requisito |
|------------|-----------|
| **Node.js** | v18.17.0 o superior |
| **SQL Server** | 2019 o superior |
| **RAM** | 4 GB mínimo |
| **Disco** | 500 MB espacio libre |
| **Navegador** | Chrome 90+, Firefox 88+, Edge 90+ |

### Dependencias de Sistema

#### Windows
```bash
# SQL Server Express (si no tienes SQL Server)
# Descargar desde: https://www.microsoft.com/sql-server/sql-server-downloads
```

#### Linux/Mac
```bash
# Instalar SQL Server para Linux
# Documentación: https://learn.microsoft.com/sql/linux/
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/assembly-management.git
cd assembly-management
```

### 2. Instalar Dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar Base de Datos

#### Crear la Base de Datos

```sql
CREATE DATABASE Gates;
GO

USE Gates;
GO
```

#### Ejecutar Scripts de Tablas

```sql
-- Tabla Usuarios
CREATE TABLE Usuarios (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Correo NVARCHAR(255) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Nombre NVARCHAR(255) NOT NULL,
    Rol NVARCHAR(50) NOT NULL,
    Nomina NVARCHAR(50),
    CreadoEn DATETIME DEFAULT GETDATE(),
    ActualizadoEn DATETIME DEFAULT GETDATE()
);

-- Tabla Operadores
CREATE TABLE Operadores (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Correo NVARCHAR(255) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Nombre NVARCHAR(255) NOT NULL,
    Nomina NVARCHAR(50),
    CreadoEn DATETIME DEFAULT GETDATE()
);

-- Tabla Job
CREATE TABLE Job (
    Folio INT PRIMARY KEY IDENTITY(1,1),
    JOB NVARCHAR(255) NOT NULL,
    Item NVARCHAR(255),
    Linea NVARCHAR(255),
    QtyTot INT,
    QtyReal INT,
    Fecha DATE,
    Estatus BIT DEFAULT 0
);

-- Tablas de módulos de ensamblaje
CREATE TABLE Corte (
    IdCorte INT PRIMARY KEY IDENTITY(1,1),
    JobFolio INT FOREIGN KEY REFERENCES Job(Folio),
    FechaInicio DATETIME,
    FechaFin DATETIME,
    Cantidad INT,
    OperadorId INT,
    Observaciones NVARCHAR(MAX)
);

-- ... (más tablas según documentación de arquitectura)
```

#### Crear Usuario Administrador Inicial

```sql
INSERT INTO Usuarios (Correo, Password, Nombre, Rol, Nomina)
VALUES (
    'admin@assembly.com',
    '$2a$10$XYZ...', -- Hash bcrypt de tu contraseña
    'Administrador',
    'admin',
    'ADM001'
);
```

### 4. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# === CONFIGURACIÓN DE BASE DE DATOS ===
SQL_SERVER=localhost\SQLEXPRESS
SQL_INSTANCE=
SQL_PORT=1433
SQL_DATABASE=Gates

# Autenticación SQL Server
SQL_AUTH=sql
SQL_USER=sa
SQL_PASSWORD=tu_password_aqui

# Seguridad de conexión
SQL_ENCRYPT=false
SQL_TRUST_CERT=true

# === CONFIGURACIÓN JWT ===
JWT_SECRET=tu_clave_secreta_muy_larga_y_compleja_aqui_min_32_caracteres

# === CONFIGURACIÓN DE ENTORNO ===
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

⚠️ **IMPORTANTE**: 
- Nunca subas el archivo `.env.local` a Git
- Usa contraseñas seguras en producción
- Cambia `JWT_SECRET` por una clave única

---

## ⚙️ Configuración

### Configuración de SQL Server

#### Habilitar Autenticación SQL

```sql
-- En SQL Server Management Studio (SSMS)
-- 1. Abrir propiedades del servidor
-- 2. Security → SQL Server and Windows Authentication mode
-- 3. Reiniciar servicio SQL Server
```

#### Configurar SQL Server para Conexiones TCP/IP

```bash
# 1. Abrir SQL Server Configuration Manager
# 2. SQL Server Network Configuration → Protocols
# 3. Habilitar TCP/IP
# 4. Reiniciar servicio
```

### Configuración de Next.js

Archivo `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  // Configuración adicional según necesidades
};

module.exports = nextConfig;
```

---

## 🎮 Uso

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# El sistema estará disponible en:
# http://localhost:3000
```

### Producción

```bash
# Build del proyecto
npm run build

# Iniciar en producción
npm start
```

### Scripts Disponibles

```bash
npm run dev          # Modo desarrollo con hot-reload
npm run build        # Compilar para producción
npm start            # Ejecutar build de producción
npm run lint         # Verificar código con ESLint
```

---

## 📁 Estructura del Proyecto

```
assembly-management/
├── src/
│   ├── app/                          # Rutas y páginas de Next.js
│   │   ├── (protected)/              # Rutas protegidas
│   │   │   ├── admin/
│   │   │   │   └── usuarios/         # Gestión de usuarios
│   │   │   └── assembly/
│   │   │       ├── dashboard/        # Dashboard principal
│   │   │       ├── new/              # Crear ensamblaje
│   │   │       ├── collar-a/         # Módulo Collar A
│   │   │       ├── collar-b/         # Módulo Collar B
│   │   │       ├── crimp-a/          # Módulo Crimp A
│   │   │       ├── crimp-b/          # Módulo Crimp B
│   │   │       ├── hose/             # Módulo Hose
│   │   │       ├── packaging/        # Módulo Packaging
│   │   │       └── sleeve-guard/     # Módulo Sleeve Guard
│   │   ├── api/                      # API Routes
│   │   │   ├── admin/
│   │   │   │   └── users/            # CRUD usuarios
│   │   │   ├── assembly/             # Operaciones de ensamblaje
│   │   │   ├── auth/                 # Autenticación
│   │   │   │   ├── login/
│   │   │   │   └── logout/
│   │   │   ├── collar-a/             # API Collar A
│   │   │   ├── collar-b/             # API Collar B
│   │   │   ├── crimp-a/              # API Crimp A
│   │   │   ├── crimp-b/              # API Crimp B
│   │   │   ├── dashboard/
│   │   │   │   └── summary/          # Datos dashboard
│   │   │   ├── db/
│   │   │   │   └── ping/             # Health check DB
│   │   │   ├── hose/                 # API Hose
│   │   │   ├── packaging/            # API Packaging
│   │   │   └── sleeve/               # API Sleeve Guard
│   │   ├── login/                    # Página de login
│   │   ├── layout.js                 # Layout principal
│   │   ├── page.tsx                  # Home page
│   │   └── globals.css               # Estilos globales
│   ├── components/                   # Componentes reutilizables
│   │   ├── AlertSystem.jsx           # Sistema de alertas
│   │   ├── GlobalTopbar.jsx          # Barra superior global
│   │   ├── InteractiveKPICard.jsx    # Cards de KPI
│   │   ├── ThemeToggleGlobal.jsx     # Toggle tema claro/oscuro
│   │   └── UserFormModal.jsx         # Modal de formularios
│   ├── lib/
│   │   ├── auth.js                   # Lógica JWT
│   │   └── db.js                     # Cliente base de datos
│   └── utils/
│       └── cookies.js                # Utilidades de cookies
├── middleware.js                     # Middleware de autenticación
├── public/                           # Archivos estáticos
├── .env.local                        # Variables de entorno (no incluir en Git)
├── .gitignore
├── next.config.js                    # Configuración Next.js
├── package.json
├── tailwind.config.js                # Configuración Tailwind
└── README.md
```

---

## 🔌 API Endpoints

### Autenticación

#### `POST /api/auth/login`
Autenticar usuario y obtener token JWT.

**Request:**
```json
{
  "correo": "usuario@example.com",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "ok": true,
  "source": "Usuarios",
  "user": {
    "id": 1,
    "correo": "usuario@example.com",
    "nombre": "Juan Pérez",
    "rol": "admin",
    "nomina": "EMP001"
  }
}
```

**Response (403):**
```json
{
  "error": "Tu usuario no tiene permisos para acceder a este sistema"
}
```

#### `POST /api/auth/logout`
Cerrar sesión del usuario.

**Response (200):**
```json
{
  "ok": true,
  "message": "Sesión cerrada exitosamente"
}
```

### Administración de Usuarios

#### `GET /api/admin/users`
Obtener lista de todos los usuarios.

**Headers:**
```
Cookie: session=<jwt_token>
```

**Response (200):**
```json
{
  "users": [
    {
      "Id": 1,
      "Correo": "admin@example.com",
      "Nombre": "Administrador",
      "Rol": "admin",
      "Nomina": "ADM001",
      "CreadoEn": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### `POST /api/admin/users`
Crear nuevo usuario.

**Request:**
```json
{
  "correo": "nuevo@example.com",
  "password": "contraseña123",
  "nombre": "Nuevo Usuario",
  "rol": "operador",
  "nomina": "OP001"
}
```

#### `PUT /api/admin/users/[id]`
Actualizar usuario existente.

#### `DELETE /api/admin/users/[id]`
Eliminar usuario.

### Dashboard

#### `GET /api/dashboard/summary`
Obtener resumen de datos para el dashboard.

**Response (200):**
```json
{
  "topAssemblies": {
    "corte": [...],
    "acabado": [...],
    "crimpA": [...],
    "crimpB": [...]
  },
  "kpis": {
    "totalJobs": 150,
    "completedJobs": 120,
    "activeLines": 8,
    "efficiency": 85.5
  }
}
```

### Gestión de Ensamblajes

#### `POST /api/assembly`
Crear nuevo ensamblaje.

#### `PUT /api/assembly/[id]`
Actualizar ensamblaje existente.

#### `DELETE /api/assembly/[id]`
Eliminar ensamblaje.

### Health Check

#### `GET /api/db/ping`
Verificar conectividad con la base de datos.

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🏭 Módulos del Sistema

### 1. Dashboard Principal
- Visualización de KPIs en tiempo real
- Top 10 ensamblajes por módulo
- Sistema de alertas y notificaciones
- Acceso rápido a todos los módulos

### 2. Collar A y Collar B
- Gestión de inventario de collares
- Control de calidad
- Trazabilidad de lotes
- Reportes de producción

### 3. Crimp A y Crimp B
- Administración de crimps y terminales
- Control de especificaciones técnicas
- Validación de medidas
- Historial de uso

### 4. Hose (Mangueras)
- Catálogo de mangueras
- Control de longitudes
- Gestión de proveedores
- Alertas de stock mínimo

### 5. Sleeve Guard (Protectores)
- Inventario de guardas y protectores
- Asignación a ensamblajes
- Control de compatibilidad
- Reportes de consumo

### 6. Packaging (Empaquetado)
- Gestión de material de empaque
- Control de presentaciones
- Etiquetado y codificación
- Rastreo de embarques

### 7. Administración de Usuarios
- Creación y edición de usuarios
- Asignación de roles
- Control de permisos
- Auditoría de acciones

### 8. Carga Masiva de Excel
- Importación de datos en lote
- Validación automática de formatos
- Reporte de errores detallado
- Plantilla descargable

---

## 🔒 Seguridad

### Autenticación JWT

El sistema utiliza JSON Web Tokens para manejar sesiones:

```javascript
// Estructura del token JWT
{
  "sub": "1",              // ID del usuario
  "correo": "user@example.com",
  "nombre": "Usuario",
  "rol": "admin",
  "nomina": "EMP001",
  "src": "Usuarios",       // Tabla origen
  "iat": 1705320000,       // Emitido en
  "exp": 1705348800        // Expira en (8 horas)
}
```

### Protección de Rutas

El middleware valida todas las rutas protegidas:

```javascript
// middleware.js
export const config = {
  matcher: [
    '/assembly/:path*',
    '/admin/:path*',
  ]
};
```

### Cookies Seguras

```javascript
// Cookies httpOnly para prevenir XSS
session: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 8 * 60 * 60 // 8 horas
}
```

### Hashing de Contraseñas

```javascript
// bcrypt con 10 rounds
const hashedPassword = await bcrypt.hash(password, 10);
```

### Control de Acceso Basado en Roles (RBAC)

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso completo al sistema |
| **supervisor** | Gestión de ensamblajes y reportes |
| **operador** | Acceso limitado a módulos asignados |
| **viewer** | Solo lectura |

### Mejores Prácticas Implementadas

✅ Validación de entrada en todos los endpoints  
✅ Sanitización de datos SQL (parametrized queries)  
✅ Headers de seguridad HTTP  
✅ Rate limiting en endpoints críticos  
✅ Logs de auditoría  
✅ Encriptación de datos sensibles  

---

## 🚀 Deployment

### Deployment en SmarterASP.NET

#### 1. Preparar el Proyecto

```bash
# Build del proyecto
npm run build

# Verificar que .next/standalone existe
```

#### 2. Configurar Variables de Entorno

En el panel de SmarterASP.NET:
- Configurar connection string de SQL Server
- Agregar JWT_SECRET
- Configurar NEXT_PUBLIC_API_URL

#### 3. Subir Archivos

```bash
# Archivos a subir vía FTP:
.next/
public/
package.json
next.config.js
```

#### 4. Configurar IIS

- Application Pool: .NET Core
- Versión: .NET 8.0+
- Pipeline Mode: Integrated

### Deployment en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
```

### Deployment en servidor propio (Linux)

```bash
# Instalar Node.js y PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clonar y configurar
git clone <repo>
cd assembly-management
npm install
npm run build

# Iniciar con PM2
pm2 start npm --name "assembly" -- start
pm2 save
pm2 startup
```

### Configuración de SSL

```bash
# Certbot para Let's Encrypt (gratuito)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

---

## 🐛 Troubleshooting

### Error: ENOTFOUND SQL Server

**Problema:** No se puede conectar a SQL Server

**Solución:**
```env
# Usar localhost en lugar del nombre de la máquina
SQL_SERVER=localhost\SQLEXPRESS
# o
SQL_SERVER=127.0.0.1
```

### Error: Login failed for user 'sa'

**Problema:** Credenciales incorrectas o autenticación no habilitada

**Solución:**
1. Verificar usuario y contraseña
2. Habilitar autenticación mixta en SQL Server
3. Reiniciar servicio SQL Server

### Error 500 después del deployment

**Problema:** Variables de entorno no configuradas

**Solución:**
1. Verificar que todas las variables de `.env.local` estén en producción
2. Verificar permisos de archivos
3. Revisar logs del servidor

### Las cookies no se están enviando

**Problema:** Configuración de sameSite o secure incorrecta

**Solución:**
```javascript
// En desarrollo
secure: false
sameSite: 'lax'

// En producción
secure: true
sameSite: 'lax'
```

### Error al cargar Excel

**Problema:** Formato de archivo incorrecto

**Solución:**
1. Descargar plantilla desde el sistema
2. Verificar que las columnas coincidan exactamente
3. Revisar formato de fechas (DD/MM/YYYY)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

### 1. Fork del Proyecto

```bash
# Hacer fork en GitHub y clonar tu fork
git clone https://github.com/tu-usuario/assembly-management.git
```

### 2. Crear una Rama

```bash
git checkout -b feature/nueva-funcionalidad
```

### 3. Hacer Cambios

```bash
# Hacer tus cambios y commits
git add .
git commit -m "feat: agregar nueva funcionalidad X"
```

### 4. Push y Pull Request

```bash
git push origin feature/nueva-funcionalidad
# Crear Pull Request en GitHub
```

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formateo, sin cambios de código
refactor: refactorización de código
test: agregar o modificar tests
chore: tareas de mantenimiento
```

### Code Style

- ESLint configurado para Next.js
- Prettier para formateo automático
- Tailwind CSS para estilos

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2024 [Tu Empresa/Nombre]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Autores

- **Tu Nombre** - *Desarrollo Inicial* - [GitHub](https://github.com/tu-usuario)

---

## 🙏 Agradecimientos

- Next.js Team por el increíble framework
- Vercel por el hosting y deployment
- Comunidad Open Source
- [Otros contribuidores]

---

## 📞 Contacto

- **Empresa:** Tu Empresa S.A. de C.V.
- **Website:** https://tuempresa.com
- **Email:** contacto@tuempresa.com
- **LinkedIn:** [Tu LinkedIn](https://linkedin.com/in/tu-perfil)

---

<div align="center">

### ⭐ Si este proyecto te fue útil, considera darle una estrella

**Hecho con ❤️ por [Tu Nombre/Empresa]**

</div>