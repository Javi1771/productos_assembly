# Arquitectura del Sistema `productos_assembly`

```mermaid
graph TD


```


El sistema `productos_assembly` es una aplicación de pila completa (full-stack) construida con Next.js, que emplea una arquitectura cliente-servidor para gestionar procesos de ensamblaje de productos.

## 1. Arquitectura General

El sistema se compone de los siguientes elementos principales:

-   **Aplicación Next.js (Frontend & Backend API)**: Actúa como el punto de entrada principal, sirviendo tanto la interfaz de usuario como los endpoints de la API.
-   **Sistema de Autenticación y Autorización**: Protege el acceso a recursos y funcionalidades.
-   **Capa de Interacción con la Base de Datos**: Gestiona la persistencia de datos.
-   **Base de Datos MSSQL**: Almacena todos los datos del sistema.

### Interacciones Clave

El Frontend interactúa con el Backend API para obtener y enviar datos. El Middleware de Next.js intercepta solicitudes para aplicar controles de autenticación y autorización. El Backend API, a su vez, se comunica con la Base de Datos MSSQL a través de un cliente dedicado para realizar operaciones CRUD.

## 2. Interfaz de Usuario (Pantallas)

La interfaz de usuario del sistema `productos_assembly` está construida con **Next.js** y **React**, utilizando **Tailwind CSS** para el estilo. La organización de las "pantallas" sigue la estructura de enrutamiento basada en archivos de Next.js bajo `src/app`.

### Pantallas Principales

-   `src/app/page.tsx`: Página de inicio/aterrizaje.
-   `src/app/login/page.jsx`: Interfaz para la autenticación de usuarios.
-   `src/app/(protected)/admin/usuarios/page.jsx`: Gestión de usuarios por parte del administrador.
-   `src/app/(protected)/assembly/dashboard/page.jsx`: Panel de control para el proceso de ensamblaje.
-   `src/app/(protected)/assembly/new/page.jsx`: Formulario para la creación de nuevos ítems de ensamblaje.
-   `src/app/(protected)/assembly/[item]/{collar-a, collar-b, crimp-a, crimp-b, hose, packaging, sleeve-guard}/page.jsx`: Rutas dinámicas para detalles y gestión de tipos específicos de componentes de producto.

### Componentes Reutilizables (`src/components`)

Incluyen elementos como `AlertSystem.jsx`, `GlobalTopbar.jsx`, `InteractiveKPICard.jsx`, `ThemeToggleGlobal.jsx`, y `UserFormModal.jsx`, que contribuyen a la consistencia y modularidad de la UI.

### Interacción con el Backend

Las páginas y componentes del frontend interactúan con el backend a través de las rutas de la API de Next.js (ubicadas en `src/app/api/`) utilizando solicitudes HTTP estándar (e.g., `fetch` API) para recuperar y enviar datos.

## 3. Endpoints y Servicios API

La API del sistema `productos_assembly` está organizada de forma jerárquica bajo `src/app/api/` y ofrece funcionalidades para diversas áreas:

-   **`/api/admin/users`**: Gestión de usuarios (listar, crear, actualizar, eliminar) por ID.
-   **`/api/assembly`**: Funcionalidades generales de ensamblaje, incluyendo aprobación de ítems y gestión de adiciones (`[item]/adds/`).
-   **`/api/auth`**: Autenticación de usuarios (`login/`) y cierre de sesión (`logout/`).
-   **`/api/collar-a`,&#32;`/api/collar-b`,&#32;`/api/crimp-a`,&#32;`/api/crimp-b`,&#32;`/api/hose`,&#32;`/api/packaging`,&#32;`/api/sleeve`**: Endpoints específicos para la gestión de cada componente de producto (e.g., detalles, inventario).
-   **`/api/dashboard/summary`**: Proporciona datos resumidos para el panel de control.
-   **`/api/db/ping`**: Endpoint de utilidad para verificar la conectividad de la base de datos.

Estos endpoints permiten al frontend realizar operaciones de negocio, gestionar usuarios y autenticación, y obtener datos para la visualización.

## 4. Autenticación y Autorización

El sistema implementa un mecanismo de autenticación y autorización basado en **JSON Web Tokens (JWT)** y cookies, con un control de acceso basado en roles (RBAC).

### Mecanismos

-   **Autenticación**: Se utiliza un JWT para establecer la identidad del usuario y gestionar la sesión.
-   **Autorización**: Se basa en el rol del usuario (`rol` en el JWT) para determinar el acceso a recursos y funcionalidades.

### Componentes Involucrados

-   `src/app/api/auth/login/route.js`: Procesa las credenciales (email/contraseña) del usuario, las verifica contra la base de datos MSSQL (usando `bcryptjs` para contraseñas, con un mecanismo de migración para contraseñas en texto plano), y genera un JWT si la autenticación es exitosa.
-   `src/lib/auth.js`: Contiene la lógica central para firmar (`signSession`) y verificar (`verifySession`) los JWTs.
-   `middleware.js`: Intercepta las solicitudes HTTP. Verifica la presencia y validez del JWT en la cookie de sesión para proteger las rutas (especialmente las bajo `/assembly/**`). Si el usuario no está autenticado o la sesión es inválida, redirige a la página de login.
-   `src/utils/cookies.js`: Proporciona utilidades del lado del cliente para leer información pública de las cookies (como el rol del usuario).

### Flujo de Autenticación y Autorización

1.  El usuario envía credenciales a `/api/auth/login`.
2.  El servidor verifica las credenciales y, si son válidas, genera un JWT que incluye el ID, email, rol y origen del usuario.
3.  Este JWT se establece como una cookie `httpOnly` llamada `session`.
4.  Para las rutas protegidas, el `middleware.js` valida esta cookie de sesión. Si es válida, permite el acceso; de lo contrario, redirige al login.
5.  La lógica de la aplicación y la UI pueden utilizar el rol del usuario (accesible a través de cookies públicas o decodificando el JWT en el servidor) para mostrar diferentes elementos o permitir distintas acciones, implementando así el RBAC.

## 5. Cookies y Gestión de Sesiones

El sistema `productos_assembly` emplea una estrategia de doble cookie para gestionar las sesiones y la información del usuario.

### Cookie de Sesión (`session`)

-   **Propósito**: Es la cookie principal para la autenticación y autorización, almacenando el JWT que representa la sesión del usuario.
-   **Datos Almacenados**: El payload del JWT contiene el ID del usuario (`sub`), email, rol (`rol`), la tabla de la base de datos de origen (`src`), y el número de nómina (`nomina`).
-   **Seguridad**:
    -   `httpOnly: true`: Evita el acceso desde JavaScript del lado del cliente, mitigando ataques XSS.
    -   `secure: true` (en producción): Asegura que la cookie solo se envíe a través de HTTPS.
    -   \`sameSite: 

---
*Generated by [CodeViz.ai](https://codeviz.ai) on 9/30/2025, 2:27:54 PM*
