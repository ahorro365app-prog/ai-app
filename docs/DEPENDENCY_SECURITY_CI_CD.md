# 🔒 Seguridad de Dependencias en CI/CD

Esta guía explica cómo integrar verificación de seguridad de dependencias en CI/CD.

## 📋 Scripts Disponibles

### Scripts de Verificación

1. **`scripts/check-dependencies.sh`** (Linux/Mac)
   - Verifica vulnerabilidades en todos los componentes
   - Ejecuta `npm audit` en cada directorio
   - Falla si hay vulnerabilidades críticas o moderadas

2. **`scripts/check-dependencies.ps1`** (Windows)
   - Misma funcionalidad que el script bash
   - Compatible con PowerShell

## 🚀 Integración en CI/CD

### GitHub Actions

Agrega este workflow a `.github/workflows/security-check.yml`:

```yaml
name: Security Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    # Ejecutar diariamente a las 2 AM UTC
    - cron: '0 2 * * *'

jobs:
  dependency-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies (App Principal)
        run: npm install
        working-directory: .
      
      - name: Install dependencies (Admin Dashboard)
        run: npm install
        working-directory: admin-dashboard
      
      - name: Install dependencies (Core API)
        run: npm install
        working-directory: packages/core-api
      
      - name: Check dependencies (App Principal)
        run: npm audit --audit-level=moderate
        working-directory: .
      
      - name: Check dependencies (Admin Dashboard)
        run: npm audit --audit-level=moderate
        working-directory: admin-dashboard
      
      - name: Check dependencies (Core API)
        run: npm audit --audit-level=moderate
        working-directory: packages/core-api
```

### GitLab CI

Agrega a `.gitlab-ci.yml`:

```yaml
dependency-security:
  stage: test
  image: node:18
  script:
    - npm install
    - npm audit --audit-level=moderate
    - cd admin-dashboard && npm install && npm audit --audit-level=moderate
    - cd ../packages/core-api && npm install && npm audit --audit-level=moderate
  only:
    - main
    - develop
    - merge_requests
```

### Vercel (Pre-build Hook)

En `package.json` del proyecto raíz:

```json
{
  "scripts": {
    "prebuild": "node scripts/check-dependencies.js || npm audit --audit-level=moderate"
  }
}
```

## 🔔 Dependabot (GitHub)

### Configurar Dependabot

Crea `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # App Principal
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "tu-usuario"
    labels:
      - "dependencies"
      - "security"
  
  # Admin Dashboard
  - package-ecosystem: "npm"
    directory: "/admin-dashboard"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "tu-usuario"
    labels:
      - "dependencies"
      - "security"
  
  # Core API
  - package-ecosystem: "npm"
    directory: "/packages/core-api"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "tu-usuario"
    labels:
      - "dependencies"
      - "security"
```

## 📊 Monitoreo Continuo

### Alertas de Seguridad

1. **GitHub Security Advisories**:
   - GitHub notifica automáticamente de vulnerabilidades conocidas
   - Configurar alertas en Settings → Security & analysis

2. **Snyk** (Opcional, servicio externo):
   - Integración gratuita disponible
   - Monitoreo continuo de dependencias
   - Alertas por email

3. **npm audit**:
   - Ejecutar semanalmente manualmente
   - O configurar en CI/CD para ejecución automática

## 🔧 Comandos Útiles

### Verificar Dependencias Manualmente

```bash
# App Principal
npm audit

# Admin Dashboard
cd admin-dashboard && npm audit

# Core API
cd packages/core-api && npm audit
```

### Corregir Vulnerabilidades Automáticamente

```bash
# Intentar corregir automáticamente (solo cambios seguros)
npm audit fix

# Ver qué se corregiría sin aplicar cambios
npm audit fix --dry-run
```

### Actualizar Dependencias

```bash
# Verificar actualizaciones disponibles
npm outdated

# Actualizar dependencias menores y patches
npm update

# Actualizar dependencias mayores (requiere revisión manual)
npm install package@latest
```

## ⚠️ Buenas Prácticas

1. **Revisar PRs de Dependabot**:
   - No aceptar automáticamente
   - Probar en desarrollo antes de mergear
   - Verificar changelog de la dependencia

2. **Ejecutar tests después de actualizar**:
   - Asegurar que no se rompió funcionalidad
   - Verificar que tests pasan

3. **Monitorear vulnerabilidades críticas**:
   - Revisar semanalmente
   - Priorizar corrección de vulnerabilidades críticas

4. **Documentar actualizaciones importantes**:
   - Registrar en changelog
   - Notificar al equipo si hay breaking changes

## 📚 Recursos

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

---

**Última actualización**: 2025-01-18


