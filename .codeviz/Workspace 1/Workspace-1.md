# Arquitectura del Sistema `productos_assembly`

```mermaid
graph TD

    subgraph 7c705304-productosAssembly["**Sistema productos\_assembly**<br>Aplicación Full-Stack con Next.js<br>N/A"]
        subgraph 7c705304-authSystem["**Sistema de Autenticación y Autorización**<br>JWT, Cookies, RBAC<br>N/A"]
            7c705304-authLib["**Auth Logic**<br>Firma y verifica JWT<br>src/lib/auth.js"]
            7c705304-bcryptjs["**bcryptjs**<br>Hashing de contraseñas<br>External"]
            7c705304-jwt["**JSON Web Token (JWT)**<br>Token de sesión seguro<br>Concept"]
            7c705304-publicCookieUtil["**Cookies Utils**<br>Lectura de cookies públicas<br>src/utils/cookies.js"]
            7c705304-rbac["**Control de Acceso Basado en Roles (RBAC)**<br>Autorización por rol de usuario<br>Concept"]
            7c705304-sessionCookie["**Session Cookie**<br>httpOnly, almacena JWT<br>Concept"]
            %% Edges at this level (grouped by source)
            7c705304-authLib["**Auth Logic**<br>Firma y verifica JWT<br>src/lib/auth.js"] -->|"Genera"| 7c705304-jwt["**JSON Web Token (JWT)**<br>Token de sesión seguro<br>Concept"]
            7c705304-authLib["**Auth Logic**<br>Firma y verifica JWT<br>src/lib/auth.js"] -->|"Verifica"| 7c705304-jwt["**JSON Web Token (JWT)**<br>Token de sesión seguro<br>Concept"]
            7c705304-authLib["**Auth Logic**<br>Firma y verifica JWT<br>src/lib/auth.js"] -->|"Contiene lógica de"| 7c705304-jwt["**JSON Web Token (JWT)**<br>Token de sesión seguro<br>Concept"]
            7c705304-sessionCookie["**Session Cookie**<br>httpOnly, almacena JWT<br>Concept"] -->|"Almacena"| 7c705304-jwt["**JSON Web Token (JWT)**<br>Token de sesión seguro<br>Concept"]
        end
        subgraph 7c705304-dbInteraction["**Capa de Interacción con la Base de Datos**<br>Cliente dedicado<br>N/A"]
            7c705304-dbClient["**Cliente DB**<br>Gestión de conexiones y consultas<br>Internal"]
        end
        subgraph 7c705304-mssqlDB["**Base de Datos MSSQL**<br>Persistencia de datos<br>External"]
            7c705304-mssql["**MSSQL Database**<br>Almacena usuarios, productos, ensamblajes<br>External"]
        end
        subgraph 7c705304-nextJSApp["**Aplicación Next.js**<br>Frontend and Backend API<br>[External]"]
            subgraph 7c705304-backendAPIRoutes["**Backend API Routes**<br>Next.js API Endpoints<br>src/app/api/"]
                7c705304-apiAdminUsers["**API Admin Usuarios**<br>CRUD usuarios<br>src/app/api/admin/users/"]
                7c705304-apiAssembly["**API Assembly**<br>Gestión de ensamblajes<br>src/app/api/assembly/"]
                7c705304-apiAuth["**API Autenticación**<br>/api/auth/\*<br>src/app/api/auth/"]
                7c705304-apiComponentSpecific["**API Componentes**<br>Gestión específica (collar-a, hose, etc.)<br>src/app/api/{component}/"]
                7c705304-apiDashboardSummary["**API Dashboard Summary**<br>Datos resumidos para dashboard<br>src/app/api/dashboard/summary"]
                7c705304-apiDbPing["**API DB Ping**<br>Verifica conectividad DB<br>src/app/api/db/ping"]
                7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"]
                7c705304-apiLogout["**Logout API Route**<br>Cierra sesión<br>src/app/api/auth/logout/route.js"]
                %% Edges at this level (grouped by source)
                7c705304-apiAuth["**API Autenticación**<br>/api/auth/\*<br>src/app/api/auth/"] -->|"Incluye"| 7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"]
                7c705304-apiAuth["**API Autenticación**<br>/api/auth/\*<br>src/app/api/auth/"] -->|"Incluye"| 7c705304-apiLogout["**Logout API Route**<br>Cierra sesión<br>src/app/api/auth/logout/route.js"]
            end
            subgraph 7c705304-frontendUI["**Frontend / UI**<br>Interfaz de usuario (React)<br>src/app/|src/components/"]
                7c705304-uiAdminUsers["**Admin Usuarios**<br>Gestión de usuarios<br>src/app/(protected)/admin/usuarios/page.jsx"]
                7c705304-uiAssemblyDash["**Assembly Dashboard**<br>Panel de control<br>src/app/(protected)/assembly/dashboard/page.jsx"]
                7c705304-uiAssemblyNew["**New Assembly Item**<br>Creación de ítems<br>src/app/(protected)/assembly/new/page.jsx"]
                7c705304-uiDynamicComponents["**Páginas Dinámicas Componentes**<br>Detalle de productos específicos<br>src/app/(protected)/assembly/[item]/..."]
                7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"]
                7c705304-uiHome["**Página de Inicio**<br>Home Page<br>src/app/page.tsx"]
                7c705304-uiLogin["**Página de Login**<br>Autenticación de usuario<br>src/app/login/page.jsx"]
                7c705304-uiReusableComponents["**Componentes Reutilizables**<br>Alerts, Topbar, KPIs, etc.<br>src/components/"]
                %% Edges at this level (grouped by source)
                7c705304-uiHome["**Página de Inicio**<br>Home Page<br>src/app/page.tsx"] -->|"Navega"| 7c705304-uiLogin["**Página de Login**<br>Autenticación de usuario<br>src/app/login/page.jsx"]
                7c705304-uiHome["**Página de Inicio**<br>Home Page<br>src/app/page.tsx"] -->|"Navega"| 7c705304-uiAdminUsers["**Admin Usuarios**<br>Gestión de usuarios<br>src/app/(protected)/admin/usuarios/page.jsx"]
                7c705304-uiHome["**Página de Inicio**<br>Home Page<br>src/app/page.tsx"] -->|"Navega"| 7c705304-uiAssemblyDash["**Assembly Dashboard**<br>Panel de control<br>src/app/(protected)/assembly/dashboard/page.jsx"]
                7c705304-uiAssemblyDash["**Assembly Dashboard**<br>Panel de control<br>src/app/(protected)/assembly/dashboard/page.jsx"] -->|"Navega"| 7c705304-uiAssemblyNew["**New Assembly Item**<br>Creación de ítems<br>src/app/(protected)/assembly/new/page.jsx"]
                7c705304-uiAssemblyDash["**Assembly Dashboard**<br>Panel de control<br>src/app/(protected)/assembly/dashboard/page.jsx"] -->|"Navega"| 7c705304-uiDynamicComponents["**Páginas Dinámicas Componentes**<br>Detalle de productos específicos<br>src/app/(protected)/assembly/[item]/..."]
                7c705304-uiAssemblyDash["**Assembly Dashboard**<br>Panel de control<br>src/app/(protected)/assembly/dashboard/page.jsx"] -->|"Usa"| 7c705304-uiReusableComponents["**Componentes Reutilizables**<br>Alerts, Topbar, KPIs, etc.<br>src/components/"]
                7c705304-uiAssemblyDash["**Assembly Dashboard**<br>Panel de control<br>src/app/(protected)/assembly/dashboard/page.jsx"] -->|"Solicita datos"| 7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"]
                7c705304-uiAdminUsers["**Admin Usuarios**<br>Gestión de usuarios<br>src/app/(protected)/admin/usuarios/page.jsx"] -->|"Usa"| 7c705304-uiReusableComponents["**Componentes Reutilizables**<br>Alerts, Topbar, KPIs, etc.<br>src/components/"]
                7c705304-uiAdminUsers["**Admin Usuarios**<br>Gestión de usuarios<br>src/app/(protected)/admin/usuarios/page.jsx"] -->|"Solicita datos"| 7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"]
                7c705304-uiLogin["**Página de Login**<br>Autenticación de usuario<br>src/app/login/page.jsx"] -->|"Envía credenciales"| 7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"]
                7c705304-uiAssemblyNew["**New Assembly Item**<br>Creación de ítems<br>src/app/(protected)/assembly/new/page.jsx"] -->|"Envía datos"| 7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"]
                7c705304-uiDynamicComponents["**Páginas Dinámicas Componentes**<br>Detalle de productos específicos<br>src/app/(protected)/assembly/[item]/..."] -->|"Solicita/Envía datos"| 7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"]
                7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"] -->|"Muestra datos en"| 7c705304-frontendUI["**Frontend / UI**<br>Interfaz de usuario (React)<br>src/app/|src/components/"]
            end
            subgraph 7c705304-nextJSMiddleware["**Next.js Middleware**<br>Intercepción de solicitudes<br>middleware.js"]
                7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"]
            end
            %% Edges at this level (grouped by source)
            7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"] -->|"HTTP Request"| 7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Permite acceso a"| 7c705304-apiAuth["**API Autenticación**<br>/api/auth/\*<br>src/app/api/auth/"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Permite acceso a"| 7c705304-apiAdminUsers["**API Admin Usuarios**<br>CRUD usuarios<br>src/app/api/admin/users/"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Permite acceso a"| 7c705304-apiAssembly["**API Assembly**<br>Gestión de ensamblajes<br>src/app/api/assembly/"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Permite acceso a"| 7c705304-apiComponentSpecific["**API Componentes**<br>Gestión específica (collar-a, hose, etc.)<br>src/app/api/{component}/"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Permite acceso a"| 7c705304-apiDashboardSummary["**API Dashboard Summary**<br>Datos resumidos para dashboard<br>src/app/api/dashboard/summary"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Permite acceso a"| 7c705304-apiDbPing["**API DB Ping**<br>Verifica conectividad DB<br>src/app/api/db/ping"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Si inválido, redirige a"| 7c705304-uiLogin["**Página de Login**<br>Autenticación de usuario<br>src/app/login/page.jsx"]
            7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Si válido, pasa solicitud a"| 7c705304-backendAPIRoutes["**Backend API Routes**<br>Next.js API Endpoints<br>src/app/api/"]
            7c705304-uiLogin["**Página de Login**<br>Autenticación de usuario<br>src/app/login/page.jsx"] -->|"Envía credenciales"| 7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"]
            7c705304-backendAPIRoutes["**Backend API Routes**<br>Next.js API Endpoints<br>src/app/api/"] -->|"Envía respuesta (datos, errores)"| 7c705304-uiFetch["**Frontend Fetch API**<br>Comunicación con Backend API<br>window.fetch"]
        end
        subgraph 7c705304-userInteraction["**Usuario**<br>Actor externo<br>N/A"]
            7c705304-user["**Usuario**<br>Interacción con el sistema<br>External"]
        end
        %% Edges at this level (grouped by source)
        7c705304-user["**Usuario**<br>Interacción con el sistema<br>External"] -->|"Accede a"| 7c705304-uiHome["**Página de Inicio**<br>Home Page<br>src/app/page.tsx"]
        7c705304-user["**Usuario**<br>Interacción con el sistema<br>External"] -->|"Proporciona credenciales"| 7c705304-uiLogin["**Página de Login**<br>Autenticación de usuario<br>src/app/login/page.jsx"]
        7c705304-user["**Usuario**<br>Interacción con el sistema<br>External"] -->|"Navega a rutas protegidas"| 7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"]
        7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"] -->|"Usa"| 7c705304-bcryptjs["**bcryptjs**<br>Hashing de contraseñas<br>External"]
        7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"] -->|"Verifica credenciales en"| 7c705304-dbClient["**Cliente DB**<br>Gestión de conexiones y consultas<br>Internal"]
        7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"] -->|"Si éxito, usa"| 7c705304-authLib["**Auth Logic**<br>Firma y verifica JWT<br>src/lib/auth.js"]
        7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"] -->|"Establece"| 7c705304-sessionCookie["**Session Cookie**<br>httpOnly, almacena JWT<br>Concept"]
        7c705304-apiLogin["**Login API Route**<br>Procesa credenciales, genera JWT<br>src/app/api/auth/login/route.js"] -->|"Establece (opcional)"| 7c705304-publicCookieUtil["**Cookies Utils**<br>Lectura de cookies públicas<br>src/utils/cookies.js"]
        7c705304-dbClient["**Cliente DB**<br>Gestión de conexiones y consultas<br>Internal"] -->|"Consulta"| 7c705304-mssql["**MSSQL Database**<br>Almacena usuarios, productos, ensamblajes<br>External"]
        7c705304-dbClient["**Cliente DB**<br>Gestión de conexiones y consultas<br>Internal"] -->|"CRUD sobre"| 7c705304-mssql["**MSSQL Database**<br>Almacena usuarios, productos, ensamblajes<br>External"]
        7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Lee"| 7c705304-sessionCookie["**Session Cookie**<br>httpOnly, almacena JWT<br>Concept"]
        7c705304-middleware["**middleware.js**<br>Valida sesión y protege rutas<br>middleware.js"] -->|"Usa"| 7c705304-authLib["**Auth Logic**<br>Firma y verifica JWT<br>src/lib/auth.js"]
        7c705304-backendAPIRoutes["**Backend API Routes**<br>Next.js API Endpoints<br>src/app/api/"] -->|"Realiza operaciones de negocio"| 7c705304-dbClient["**Cliente DB**<br>Gestión de conexiones y consultas<br>Internal"]
        7c705304-backendAPIRoutes["**Backend API Routes**<br>Next.js API Endpoints<br>src/app/api/"] -->|"Usa rol de JWT para"| 7c705304-rbac["**Control de Acceso Basado en Roles (RBAC)**<br>Autorización por rol de usuario<br>Concept"]
        7c705304-rbac["**Control de Acceso Basado en Roles (RBAC)**<br>Autorización por rol de usuario<br>Concept"] -->|"Decide acceso a recursos en"| 7c705304-backendAPIRoutes["**Backend API Routes**<br>Next.js API Endpoints<br>src/app/api/"]
        7c705304-frontendUI["**Frontend / UI**<br>Interfaz de usuario (React)<br>src/app/|src/components/"] -->|"Lee rol de"| 7c705304-publicCookieUtil["**Cookies Utils**<br>Lectura de cookies públicas<br>src/utils/cookies.js"]
    end

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
*Generated by [CodeViz.ai](https://codeviz.ai) on 11/21/2025, 2:34:25 PM*
