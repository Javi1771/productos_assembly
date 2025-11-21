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
