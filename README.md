# UFL Official Site

Sitio estático de Universe Family League desplegado en GitHub Pages.

## Despliegue

1. Clona el repo o sube estos archivos a `jeffersonatencio1234-eng/ufl-official-site`.
2. Crea un PAT clásico en GitHub → Settings → Developer settings → Personal access tokens (classic) con scope `repo`.
3. En el repo: Settings → Secrets and variables → Actions → New repository secret.
   - Nombre: `UFL_DEPLOY_PAT`
   - Valor: tu PAT.
4. Ejecuta el workflow "Refresh UFL sheet tabs" desde la pestaña Actions (o espera el cron).
5. Activa Pages: Settings → Pages → Branch: `main` / root.
6. URL: https://jeffersonatencio1234-eng.github.io/ufl-official-site/

## Diagnóstico rápido

Abre en el navegador:
`https://docs.google.com/spreadsheets/d/1PBjIHUdzUI0OgtVzLLFn1VF8AMAPR-om/gviz/tq?tqx=out:json&sheet=1_Liga_T3`

Copia la primera línea de la respuesta. Si empieza con `google.visualization.Query.setResponse(...)`, el parser actual funciona. Si es JSON puro, ajusta `parseGvizResponse` en `js/data.js`.