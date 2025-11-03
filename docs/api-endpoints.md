# Documentación de endpoints del servicio de inventario

Esta guía resume cada endpoint expuesto por el servicio de inventario de Nexpos. Está pensada para el equipo de frontend, de modo que conozcan los requisitos de autenticación, los parámetros de entrada y la estructura de las respuestas.

## Convenciones generales

- **URL base**: depende del despliegue. Todos los endpoints descritos a continuación están anclados a `/inventory`.
- **Autenticación**: salvo que se indique lo contrario, todos los endpoints requieren cabecera `Authorization: Bearer <JWT>`. El `JwtAuthGuard` valida que el token incluya `userId`, `role` (`admin` o `employee`) y `companyId`.【F:src/shared/guards/jwt-auth.guard.ts†L1-L66】
- **Roles**:
  - `admin`: puede ejecutar todas las operaciones.
  - `employee`: acceso solo lectura a la mayoría de endpoints y operaciones específicas indicadas más abajo.
- **Formato de respuesta**: todos los endpoints devuelven un objeto `{ message: string; data: any }`. Cuando el controlador ya envía este formato se conserva, y el interceptor global lo aplica al resto de respuestas.【F:src/shared/utils/response.helper.ts†L1-L11】【F:src/shared/interceptors/response.interceptor.ts†L1-L28】
- **Fechas**: las entidades de TypeORM usan ISO-8601 (`createdAt`, `updatedAt`).

## Endpoints

### Salud del servicio

| Método | Ruta | Autenticación | Descripción |
|--------|------|---------------|-------------|
| `GET`  | `/inventory/health` | No | Comprueba el estado del servicio.【F:src/inventory/controllers/health.controller.ts†L5-L13】|

**Respuesta**
```json
{
  "message": "Servicio de inventario operativo",
  "data": {
    "status": "ok",
    "timestamp": "2024-05-29T15:12:34.567Z"
  }
}
```

### Automatización y modos especiales

| Método | Ruta | Rol mínimo | Descripción |
|--------|------|------------|-------------|
| `PATCH` | `/inventory/rfid-mode` | `admin` | Alterna el modo RFID para la compañía del token.【F:src/inventory/controllers/automation.controller.ts†L25-L36】|
| `GET` | `/inventory/rfid-mode` | `employee` | Consulta si el modo RFID está activo.【F:src/inventory/controllers/automation.controller.ts†L38-L42】|
| `POST` | `/inventory/voice-command` | `employee` | Registra un comando de voz y devuelve sugerencias de uso.【F:src/inventory/controllers/automation.controller.ts†L44-L55】【F:src/inventory/services/automation.service.ts†L20-L44】|
| `POST` | `/inventory/voice-to-action` | `employee` | Interpreta el comando de voz y responde con la acción sugerida.【F:src/inventory/controllers/automation.controller.ts†L57-L68】【F:src/inventory/services/automation.service.ts†L46-L68】|

**Cuerpo `VoiceCommandDto`**
```json
{
  "command": "string" // requerido
}
```

**Respuestas destacadas**
- `/rfid-mode` (GET/PATCH): `{ "message": string, "data": { "enabled": boolean } }`.【F:src/inventory/services/automation.service.ts†L10-L22】
- `/voice-command`: incluye el comando recibido, estado y sugerencias contextuales.【F:src/inventory/services/automation.service.ts†L24-L44】
- `/voice-to-action`: retorna acción inferida (`create_product`, `adjust_stock`, `none`) y `payload` opcional con detalles (p.ej. `{ "type": "in" }`).【F:src/inventory/services/automation.service.ts†L46-L68】

### Dashboard

| Método | Ruta | Rol mínimo | Descripción |
|--------|------|------------|-------------|
| `GET` | `/inventory/dashboard` | `employee` | Indicadores generales: número de productos, stock total, etc.【F:src/inventory/controllers/dashboard.controller.ts†L16-L22】【F:src/inventory/services/dashboard.service.ts†L18-L45】|
| `GET` | `/inventory/dashboard/trends` | `employee` | Movimiento de entradas/salidas por día (últimos 7 días).【F:src/inventory/controllers/dashboard.controller.ts†L24-L28】【F:src/inventory/services/dashboard.service.ts†L47-L83】|
| `GET` | `/inventory/dashboard/alerts` | `employee` | Listado de productos en alerta de stock bajo o agotado.【F:src/inventory/controllers/dashboard.controller.ts†L30-L34】【F:src/inventory/services/dashboard.service.ts†L85-L98】|
| `GET` | `/inventory/dashboard/categories` | `employee` | Resumen por categoría (productos activos y stock total).【F:src/inventory/controllers/dashboard.controller.ts†L36-L41】【F:src/inventory/services/dashboard.service.ts†L100-L118】|
| `GET` | `/inventory/dashboard/summary` | `employee` | Agrega overview, alertas y total de movimientos activos.【F:src/inventory/controllers/dashboard.controller.ts†L43-L47】【F:src/inventory/services/dashboard.service.ts†L120-L134】|

**Estructuras de datos**
- `getOverview` / `getSummary`: `{ totalProducts, totalStock, lowStock, outOfStock, inventoryValue }` con campos numéricos (stock y valores como enteros; `inventoryValue` es suma `price*stock`).【F:src/inventory/services/dashboard.service.ts†L18-L45】【F:src/inventory/services/dashboard.service.ts†L120-L134】
- `getTrends`: lista ordenada ascendente por fecha (`YYYY-MM-DD`) con cantidades `in` y `out` acumuladas.【F:src/inventory/services/dashboard.service.ts†L47-L83】
- `getAlerts`: `{ lowStock: Product[], outOfStock: Product[] }` incluyendo relaciones de categoría.【F:src/inventory/services/dashboard.service.ts†L85-L98】
- `getCategorySummary`: array de `{ categoryId, name, products, stock }`.【F:src/inventory/services/dashboard.service.ts†L100-L118】

### Categorías

| Método | Ruta | Rol mínimo | Descripción |
|--------|------|------------|-------------|
| `GET` | `/inventory/categories` | `employee` | Lista categorías activas de la compañía, ordenadas por creación descendente.【F:src/inventory/controllers/categories.controller.ts†L31-L34】【F:src/inventory/services/categories.service.ts†L14-L19】|
| `GET` | `/inventory/categories/:id` | `employee` | Recupera una categoría específica activa.【F:src/inventory/controllers/categories.controller.ts†L36-L40】【F:src/inventory/services/categories.service.ts†L21-L33】|
| `POST` | `/inventory/categories` | `admin` | Crea una nueva categoría activa.【F:src/inventory/controllers/categories.controller.ts†L42-L54】【F:src/inventory/services/categories.service.ts†L35-L46】|
| `PATCH` | `/inventory/categories/:id` | `admin` | Actualiza nombre/descrición de una categoría activa.【F:src/inventory/controllers/categories.controller.ts†L56-L66】【F:src/inventory/services/categories.service.ts†L48-L61】|
| `DELETE` | `/inventory/categories/:id` | `admin` | Marca una categoría como inactiva.【F:src/inventory/controllers/categories.controller.ts†L68-L73】【F:src/inventory/services/categories.service.ts†L63-L74】|

**Cuerpo `CreateCategoryDto` (POST/PATCH)**
```json
{
  "name": "string",          // requerido
  "description": "string"     // opcional
}
```

**Respuesta estándar**: devuelve la entidad `Category` persistida, con los campos `id`, `name`, `description`, `companyId`, `isActive`, `createdAt` y, al recuperar listados, su relación con productos no se incluye por defecto.【F:src/inventory/entities/category.entity.ts†L1-L27】

### Productos

| Método | Ruta | Rol mínimo | Descripción |
|--------|------|------------|-------------|
| `GET` | `/inventory/products` | `employee` | Lista productos activos con su categoría, ordenados por fecha de creación descendente.【F:src/inventory/controllers/products.controller.ts†L31-L35】【F:src/inventory/services/products.service.ts†L21-L28】|
| `GET` | `/inventory/products/search?query=` | `employee` | Busca por nombre, descripción o código de barras (insensible a mayúsculas). Si no hay `query`, retorna el listado completo.【F:src/inventory/controllers/products.controller.ts†L37-L45】【F:src/inventory/services/products.service.ts†L30-L45】|
| `GET` | `/inventory/products/low-stock` | `employee` | Productos con `stock <= minStock`. Orden ascendente por `stock`.【F:src/inventory/controllers/products.controller.ts†L47-L51】【F:src/inventory/services/products.service.ts†L47-L56】|
| `GET` | `/inventory/products/out-of-stock` | `employee` | Productos activos con `stock = 0`.【F:src/inventory/controllers/products.controller.ts†L53-L57】【F:src/inventory/services/products.service.ts†L58-L67】|
| `GET` | `/inventory/products/category/:categoryId` | `employee` | Productos por categoría (requiere que la categoría exista y esté activa).【F:src/inventory/controllers/products.controller.ts†L59-L68】【F:src/inventory/services/products.service.ts†L69-L93】|
| `GET` | `/inventory/products/:id` | `employee` | Obtiene un producto activo concreto (incluye categoría).【F:src/inventory/controllers/products.controller.ts†L70-L76】【F:src/inventory/services/products.service.ts†L95-L108】|
| `POST` | `/inventory/products` | `admin` | Crea un producto. Si `categoryId` viene informada se valida que exista y esté activa.【F:src/inventory/controllers/products.controller.ts†L78-L92】【F:src/inventory/services/products.service.ts†L110-L147】|
| `PATCH` | `/inventory/products/:id` | `admin` | Actualiza campos opcionales del producto. Permite asignar/quitar categoría usando `categoryId` o `null`.【F:src/inventory/controllers/products.controller.ts†L94-L108】【F:src/inventory/services/products.service.ts†L149-L189】|
| `DELETE` | `/inventory/products/:id` | `admin` | Marca el producto como inactivo.【F:src/inventory/controllers/products.controller.ts†L110-L115】【F:src/inventory/services/products.service.ts†L191-L204】|
| `PATCH` | `/inventory/products/:id/restock` | `admin` | Aumenta stock y registra un movimiento de tipo `in` con motivo "Restock manual".【F:src/inventory/controllers/products.controller.ts†L117-L131】【F:src/inventory/services/products.service.ts†L206-L226】|
| `PATCH` | `/inventory/products/:id/decrease` | `admin` | Disminuye stock si hay disponibilidad y genera movimiento `out` con motivo "Ajuste manual".【F:src/inventory/controllers/products.controller.ts†L133-L147】【F:src/inventory/services/products.service.ts†L228-L252】|
| `PATCH` | `/inventory/products/:id/reactivate` | `admin` | Reactiva un producto previamente inactivo.【F:src/inventory/controllers/products.controller.ts†L149-L155】【F:src/inventory/services/products.service.ts†L254-L266】|

**Cuerpos de petición**
- `CreateProductDto`
```json
{
  "name": "string",           // requerido
  "description": "string",    // opcional
  "price": 0,                  // número >= 0
  "stock": 0,                  // entero >= 0
  "minStock": 0,               // entero >= 0, opcional
  "barcode": "string",        // opcional
  "categoryId": "uuid"        // opcional, debe pertenecer a la compañía
}
```
- `UpdateProductDto`: mismos campos pero opcionales; `categoryId` acepta `null` para desvincular.【F:src/inventory/dto/create-product.dto.ts†L1-L37】【F:src/inventory/dto/update-product.dto.ts†L1-L32】
- `UpdateStockDto` (`/restock` y `/decrease`): `{ "quantity": number }` con entero >= 1.【F:src/inventory/dto/update-stock.dto.ts†L1-L7】

**Respuesta estándar**: los endpoints devuelven la entidad `Product`, que incluye `id`, `name`, `description`, `price` (numérico), `stock`, `minStock`, `barcode`, `companyId`, `isActive`, timestamps y la relación `category` cuando se usa `find` o se actualiza con `relations`.【F:src/inventory/entities/product.entity.ts†L1-L45】

### Movimientos de inventario

| Método | Ruta | Rol mínimo | Descripción |
|--------|------|------------|-------------|
| `GET` | `/inventory/movements` | `employee` | Historial de movimientos activos con producto y categoría asociados (orden descendente por fecha).【F:src/inventory/controllers/movements.controller.ts†L26-L31】【F:src/inventory/services/movements.service.ts†L18-L24】|
| `GET` | `/inventory/movements/:productId` | `employee` | Movimientos activos de un producto específico (valida que el producto exista).【F:src/inventory/controllers/movements.controller.ts†L33-L41】【F:src/inventory/services/movements.service.ts†L26-L41】|
| `POST` | `/inventory/movements` | `employee` | Registra un movimiento manual (entrada o salida) y ajusta el stock en consecuencia. Ambos roles (`admin` y `employee`) están autorizados.【F:src/inventory/controllers/movements.controller.ts†L43-L56】【F:src/inventory/services/movements.service.ts†L43-L73】|
| `DELETE` | `/inventory/movements/:id` | `admin` | Marca un movimiento como inactivo (no revierte stock).【F:src/inventory/controllers/movements.controller.ts†L58-L66】【F:src/inventory/services/movements.service.ts†L75-L87】|

**Cuerpo `CreateMovementDto`**
```json
{
  "productId": "uuid",        // requerido
  "quantity": 1,               // entero >= 1
  "type": "in" | "out",       // requerido
  "reason": "string"          // opcional
}
```

**Respuesta estándar**: devuelve el movimiento con campos `id`, `product` (objeto con datos y categoría), `quantity`, `type`, `reason`, `companyId`, `isActive`, `createdAt`. El servicio ajusta el stock del producto antes de registrar el movimiento y valida disponibilidad para salidas.【F:src/inventory/services/movements.service.ts†L43-L73】【F:src/inventory/entities/movement.entity.ts†L1-L35】

## Errores comunes

- `401 Unauthorized`: token ausente, inválido o expirado.【F:src/shared/guards/jwt-auth.guard.ts†L20-L66】
- `403 Forbidden`: intentos de empleados de ejecutar acciones solo para administradores (por ejemplo crear producto/categoría) o ajustes de stock con cantidad inválida o sin stock suficiente.【F:src/inventory/controllers/categories.controller.ts†L75-L82】【F:src/inventory/controllers/products.controller.ts†L158-L162】【F:src/inventory/services/products.service.ts†L206-L252】【F:src/inventory/services/movements.service.ts†L55-L61】
- `404 Not Found`: cuando se referencian categorías, productos o movimientos inactivos/inexistentes.【F:src/inventory/services/categories.service.ts†L21-L74】【F:src/inventory/services/products.service.ts†L69-L204】【F:src/inventory/services/movements.service.ts†L26-L87】
- `400 Bad Request`: cantidades <= 0 en operaciones de stock.【F:src/inventory/services/products.service.ts†L206-L252】

## Notas adicionales para frontend

- Los campos `companyId` e `isActive` son gestionados por el backend; no deben enviarse desde el cliente.
- Tras crear, actualizar o eliminar entidades, las respuestas devuelven el estado más reciente del recurso. Para `DELETE` se recibe `{ id, isActive: false }` (productos/categorías/movimientos) o `{ id, isActive: true }` en reactivaciones.【F:src/inventory/services/categories.service.ts†L63-L74】【F:src/inventory/services/products.service.ts†L191-L266】【F:src/inventory/services/movements.service.ts†L75-L87】
- Las operaciones de stock (`restock`, `decrease`, creación de movimientos) actualizan simultáneamente la entidad `Product`; conviene refrescar el listado tras la respuesta para reflejar el nuevo stock.【F:src/inventory/services/products.service.ts†L206-L252】【F:src/inventory/services/movements.service.ts†L43-L73】
