# Security Audit & Spring Boot Upgrade Assessment

Generated: 2026-06-02

---

## Part 1: Security Audit

### 🔴 Critical Issues

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 1 | **Hardcoded DB credentials in plaintext** — `postgres` / `Post@1234` committed to git. Use environment variables or a secrets manager. | `backend/src/main/resources/application.properties:6-7` | **High** |
| 2 | **JWT secret hardcoded** — static hex string `4b6f7a1d...`. Should be injected via `SPRING_APP_JWT_SECRET` env var. | `application.properties:22` | **High** |
| 3 | **CORS allows all origins** — `setAllowedOriginPatterns(List.of("*"))` with `setAllowCredentials(true)` allows any website to make authenticated requests. Restrict to specific frontend origin(s). | `backend/src/main/java/com/homistay/config/SecurityConfig.java:70-74` | **High** |
| 4 | **No rate limiting on auth endpoints** — `/api/auth/login`, `/register`, `/refresh` are unprotected against brute-force or credential stuffing attacks. Add Spring Resilience4j or a filter-based rate limiter. | `SecurityConfig.java:40` | **High** |

### 🟡 Medium Issues

| # | Issue | Location |
|---|-------|----------|
| 5 | **Password validation too weak server-side** — only `@Size(min=8)` on password fields. No requirement for letters + numbers + symbols. Add `@Pattern` with a strong regex. | `RegisterRequest.java:12`, `ChangePasswordRequest.java:12` |
| 6 | **No refresh token rotation** — `AuthService.refresh()` accepts a valid refresh token and issues a new pair without invalidating the old one. A leaked refresh token remains usable forever. | `AuthService.java:60-69` |
| 7 | **OSIV (Open Session In View) enabled** — `spring.jpa.open-in-view=true` holds the Hibernate session open through the entire request, risking connection pool exhaustion under load. | `application.properties:14` |
| 8 | **Seed data runs on every startup** — `spring.sql.init.mode=always` re-runs `schema.sql` and `data.sql` each time the app starts, clobbering any manual DB changes. Use `none` or `embedded` in production. | `application.properties:17` |
| 9 | **Weak default password for support user** — `DataInitializer` creates `support@homistay.com` with `password123`. Remove or force password change on first login. | `DataInitializer.java:25` |
| 10 | **Hard delete instead of soft delete** — `PropertyService.delete()` calls `propertyRepository.delete(p)` which removes the row. The entity has an `isActive` field, so soft-delete should be used instead. | `PropertyService.java:133` |
| 11 | **`UpdateProfileRequest` has no validation** — all fields (`fullName`, `phone`, `bio`, `dob`, `gender`, `avatarUrl`) accept arbitrary input without `@Size`, `@Pattern`, or `@Length` constraints. | `UpdateProfileRequest.java` |
| 12 | **DEBUG logging enabled for app package** — `logging.level.com.homistay=DEBUG` can leak sensitive data (user emails, booking details) in production logs. Set to `INFO` or `WARN` in production profiles. | `application.properties:31` |
| 13 | **Detailed validation errors exposed to client** — `MethodArgumentNotValidException` handler returns field-level error messages (`Map<String, String>`) which aid attackers in reverse-engineering the API. | `GlobalExceptionHandler.java:51-58` |

### 🟢 Low / Frontend Issues

| # | Issue | Location |
|---|-------|----------|
| 14 | **JWT stored in `localStorage`** — accessible to any JavaScript running on the same origin. If an XSS vulnerability is found, tokens are compromised. Prefer HttpOnly cookies with CSRF protection or use `SessionStorage` for access tokens. | `Navbar.jsx:101`, `axiosInstance.js:13` |
| 15 | **No automatic token refresh on 401** — the Axios interceptor immediately clears tokens and dispatches `auth:logout` on any 401, without attempting to refresh the access token using the refresh token. | `axiosInstance.js:23-27` |
| 16 | **No Content-Security-Policy (CSP) headers** — neither Vite (frontend) nor Spring Boot (backend) sets CSP headers. This increases risk from XSS attacks. | |
| 17 | **No input sanitization on rendered user text** — user profile fields (name, bio) are rendered directly in JSX. React escapes by default, but any `dangerouslySetInnerHTML` usage would bypass this. | `Profile.jsx` |

### ✅ Good Practices Found

| Practice | Location |
|----------|----------|
| BCrypt with strength 12 for password hashing | `SecurityConfig.java:58` |
| Pessimistic lock on booking creation prevents race conditions / double-booking | `BookingService.java:94` |
| Ownership verification on all host operations (property, addon, booking) | `PropertyService.java:152-158`, `BookingService.java:408-415` |
| Stateless JWT authentication with stateless session management | `SecurityConfig.java:38` |
| Role-based authorization on endpoints (`HOST`, `ADMIN`, `SUPPORT_TEAM`) | `SecurityConfig.java:48-49` |
| Global exception handler with structured error responses | `GlobalExceptionHandler.java` |

---

## Part 2: Spring Boot Upgrade Assessment

### Current Version
- **Spring Boot 3.2.5** (released April 2024)

### Target Version
- **Spring Boot 3.4.x** (latest stable in the 3.x line, e.g. `3.4.5`)

### Compatibility Matrix

| Dependency | Current Version | Works with SB 3.4? | Action Needed |
|------------|----------------|-------------------|---------------|
| Spring Boot Parent | 3.2.5 | — | Bump version in `pom.xml` |
| JJWT (`io.jsonwebtoken`) | 0.12.6 | ✅ Yes | None |
| SpringDoc OpenAPI | 2.5.0 | ✅ Yes (bump to 2.7.0 recommended) | Update version |
| PostgreSQL Driver | managed by parent | ✅ | None |
| Lombok | managed by parent | ✅ | None |
| Hibernate | 6.4.x (via SB 3.2.5) | 6.6.x (via SB 3.4) | Minor; test JPA queries |
| Java | 17 | 17+ | None |

### Upgrade Steps

1. **Update parent POM version** in `pom.xml:10`:
   ```xml
   <version>3.4.5</version>
   ```

2. **Update SpringDoc version** in `pom.xml:86`:
   ```xml
   <version>2.7.0</version>
   ```

3. **Review deprecated properties**:
   - `spring.jpa.open-in-view=true` — deprecated in SB 3.3+, plan to remove it
   - Check for any `spring.security.filter.order` usage

4. **Build & test**:
   ```bash
   mvn clean test
   mvn spring-boot:run
   ```

5. **Verify**:
   - Swagger UI loads at `http://localhost:8090/swagger-ui.html`
   - Auth flows (login, register, refresh) work correctly
   - Host/guest operations function as expected

### Effort Estimate
- **Low risk** (same 3.x major line)
- ~2–3 hours for version bump + full testing
