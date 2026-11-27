// 由 scripts/record-snapshot.mjs 生成，请勿手改。
// 来源：expressjs/express @ 43fca52d28a422c8be48fd489cbd4f2d6152bab6
// 快照日期：2026-11-27
export const CASE_EXPRESS = {
  "meta": {
    "id": "express",
    "label": "Node.js 框架：expressjs/express",
    "note": "测试放在 test/ 而不是 tests/：路径没找到只记“公开证据不足”。",
    "snapshotDate": "2026-11-27",
    "sourceRepo": "expressjs/express",
    "commit": "43fca52d28a422c8be48fd489cbd4f2d6152bab6",
    "expectedSummary": {
      "found": 4,
      "insufficient": 1,
      "inconsistent": 0,
      "unable": 0
    },
    "expectedStates": [
      {
        "id": "c1",
        "state": "insufficient"
      },
      {
        "id": "c2",
        "state": "found"
      },
      {
        "id": "c3",
        "state": "found"
      },
      {
        "id": "c4",
        "state": "found"
      },
      {
        "id": "c5",
        "state": "found"
      }
    ]
  },
  "repo": {
    "owner": "expressjs",
    "name": "express",
    "defaultBranch": "master",
    "commitSha": "43fca52d28a422c8be48fd489cbd4f2d6152bab6",
    "private": false,
    "htmlUrl": "https://github.com/expressjs/express",
    "lastCommitAt": "2026-11-19T17:49:18Z",
    "license": {
      "spdxId": "MIT",
      "name": "MIT License"
    }
  },
  "tree": {
    "ok": true,
    "truncated": false,
    "entries": [
      {
        "path": ".editorconfig",
        "type": "blob"
      },
      {
        "path": ".eslintignore",
        "type": "blob"
      },
      {
        "path": ".eslintrc.yml",
        "type": "blob"
      },
      {
        "path": ".github",
        "type": "tree"
      },
      {
        "path": ".github/dependabot.yml",
        "type": "blob"
      },
      {
        "path": ".github/workflows",
        "type": "tree"
      },
      {
        "path": ".github/workflows/ci.yml",
        "type": "blob"
      },
      {
        "path": ".github/workflows/codeql.yml",
        "type": "blob"
      },
      {
        "path": ".github/workflows/legacy.yml",
        "type": "blob"
      },
      {
        "path": ".github/workflows/npm-publish.yml",
        "type": "blob"
      },
      {
        "path": ".github/workflows/scorecard.yml",
        "type": "blob"
      },
      {
        "path": ".gitignore",
        "type": "blob"
      },
      {
        "path": ".npmrc",
        "type": "blob"
      },
      {
        "path": "History.md",
        "type": "blob"
      },
      {
        "path": "LICENSE",
        "type": "blob"
      },
      {
        "path": "Readme.md",
        "type": "blob"
      },
      {
        "path": "examples",
        "type": "tree"
      },
      {
        "path": "examples/README.md",
        "type": "blob"
      },
      {
        "path": "examples/auth",
        "type": "tree"
      },
      {
        "path": "examples/auth/index.js",
        "type": "blob"
      },
      {
        "path": "examples/auth/views",
        "type": "tree"
      },
      {
        "path": "examples/auth/views/foot.ejs",
        "type": "blob"
      },
      {
        "path": "examples/auth/views/head.ejs",
        "type": "blob"
      },
      {
        "path": "examples/auth/views/login.ejs",
        "type": "blob"
      },
      {
        "path": "examples/content-negotiation",
        "type": "tree"
      },
      {
        "path": "examples/content-negotiation/db.js",
        "type": "blob"
      },
      {
        "path": "examples/content-negotiation/index.js",
        "type": "blob"
      },
      {
        "path": "examples/content-negotiation/users.js",
        "type": "blob"
      },
      {
        "path": "examples/cookie-sessions",
        "type": "tree"
      },
      {
        "path": "examples/cookie-sessions/index.js",
        "type": "blob"
      },
      {
        "path": "examples/cookies",
        "type": "tree"
      },
      {
        "path": "examples/cookies/index.js",
        "type": "blob"
      },
      {
        "path": "examples/downloads",
        "type": "tree"
      },
      {
        "path": "examples/downloads/files",
        "type": "tree"
      },
      {
        "path": "examples/downloads/files/CCTV大赛上海分赛区.txt",
        "type": "blob"
      },
      {
        "path": "examples/downloads/files/amazing.txt",
        "type": "blob"
      },
      {
        "path": "examples/downloads/files/notes",
        "type": "tree"
      },
      {
        "path": "examples/downloads/files/notes/groceries.txt",
        "type": "blob"
      },
      {
        "path": "examples/downloads/index.js",
        "type": "blob"
      },
      {
        "path": "examples/ejs",
        "type": "tree"
      },
      {
        "path": "examples/ejs/index.js",
        "type": "blob"
      },
      {
        "path": "examples/ejs/public",
        "type": "tree"
      },
      {
        "path": "examples/ejs/public/stylesheets",
        "type": "tree"
      },
      {
        "path": "examples/ejs/public/stylesheets/style.css",
        "type": "blob"
      },
      {
        "path": "examples/ejs/views",
        "type": "tree"
      },
      {
        "path": "examples/ejs/views/footer.html",
        "type": "blob"
      },
      {
        "path": "examples/ejs/views/header.html",
        "type": "blob"
      },
      {
        "path": "examples/ejs/views/users.html",
        "type": "blob"
      },
      {
        "path": "examples/error-pages",
        "type": "tree"
      },
      {
        "path": "examples/error-pages/index.js",
        "type": "blob"
      },
      {
        "path": "examples/error-pages/views",
        "type": "tree"
      },
      {
        "path": "examples/error-pages/views/404.ejs",
        "type": "blob"
      },
      {
        "path": "examples/error-pages/views/500.ejs",
        "type": "blob"
      },
      {
        "path": "examples/error-pages/views/error_header.ejs",
        "type": "blob"
      },
      {
        "path": "examples/error-pages/views/footer.ejs",
        "type": "blob"
      },
      {
        "path": "examples/error-pages/views/index.ejs",
        "type": "blob"
      },
      {
        "path": "examples/error",
        "type": "tree"
      },
      {
        "path": "examples/error/index.js",
        "type": "blob"
      },
      {
        "path": "examples/hello-world",
        "type": "tree"
      },
      {
        "path": "examples/hello-world/index.js",
        "type": "blob"
      },
      {
        "path": "examples/markdown",
        "type": "tree"
      },
      {
        "path": "examples/markdown/index.js",
        "type": "blob"
      },
      {
        "path": "examples/markdown/views",
        "type": "tree"
      },
      {
        "path": "examples/markdown/views/index.md",
        "type": "blob"
      },
      {
        "path": "examples/multi-router",
        "type": "tree"
      },
      {
        "path": "examples/multi-router/controllers",
        "type": "tree"
      },
      {
        "path": "examples/multi-router/controllers/api_v1.js",
        "type": "blob"
      },
      {
        "path": "examples/multi-router/controllers/api_v2.js",
        "type": "blob"
      },
      {
        "path": "examples/multi-router/index.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers/main",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers/main/index.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/pet",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers/pet/index.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/pet/views",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers/pet/views/edit.ejs",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/pet/views/show.ejs",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/user-pet",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers/user-pet/index.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/user",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers/user/index.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/user/views",
        "type": "tree"
      },
      {
        "path": "examples/mvc/controllers/user/views/edit.hbs",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/user/views/list.hbs",
        "type": "blob"
      },
      {
        "path": "examples/mvc/controllers/user/views/show.hbs",
        "type": "blob"
      },
      {
        "path": "examples/mvc/db.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc/index.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc/lib",
        "type": "tree"
      },
      {
        "path": "examples/mvc/lib/boot.js",
        "type": "blob"
      },
      {
        "path": "examples/mvc/public",
        "type": "tree"
      },
      {
        "path": "examples/mvc/public/style.css",
        "type": "blob"
      },
      {
        "path": "examples/mvc/views",
        "type": "tree"
      },
      {
        "path": "examples/mvc/views/404.ejs",
        "type": "blob"
      },
      {
        "path": "examples/mvc/views/5xx.ejs",
        "type": "blob"
      },
      {
        "path": "examples/online",
        "type": "tree"
      },
      {
        "path": "examples/online/index.js",
        "type": "blob"
      },
      {
        "path": "examples/params",
        "type": "tree"
      },
      {
        "path": "examples/params/index.js",
        "type": "blob"
      },
      {
        "path": "examples/resource",
        "type": "tree"
      },
      {
        "path": "examples/resource/index.js",
        "type": "blob"
      },
      {
        "path": "examples/route-map",
        "type": "tree"
      },
      {
        "path": "examples/route-map/index.js",
        "type": "blob"
      },
      {
        "path": "examples/route-middleware",
        "type": "tree"
      },
      {
        "path": "examples/route-middleware/index.js",
        "type": "blob"
      },
      {
        "path": "examples/route-separation",
        "type": "tree"
      },
      {
        "path": "examples/route-separation/index.js",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/post.js",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/public",
        "type": "tree"
      },
      {
        "path": "examples/route-separation/public/style.css",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/site.js",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/user.js",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/views",
        "type": "tree"
      },
      {
        "path": "examples/route-separation/views/footer.ejs",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/views/header.ejs",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/views/index.ejs",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/views/posts",
        "type": "tree"
      },
      {
        "path": "examples/route-separation/views/posts/index.ejs",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/views/users",
        "type": "tree"
      },
      {
        "path": "examples/route-separation/views/users/edit.ejs",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/views/users/index.ejs",
        "type": "blob"
      },
      {
        "path": "examples/route-separation/views/users/view.ejs",
        "type": "blob"
      },
      {
        "path": "examples/search",
        "type": "tree"
      },
      {
        "path": "examples/search/index.js",
        "type": "blob"
      },
      {
        "path": "examples/search/public",
        "type": "tree"
      },
      {
        "path": "examples/search/public/client.js",
        "type": "blob"
      },
      {
        "path": "examples/search/public/index.html",
        "type": "blob"
      },
      {
        "path": "examples/session",
        "type": "tree"
      },
      {
        "path": "examples/session/index.js",
        "type": "blob"
      },
      {
        "path": "examples/session/redis.js",
        "type": "blob"
      },
      {
        "path": "examples/static-files",
        "type": "tree"
      },
      {
        "path": "examples/static-files/index.js",
        "type": "blob"
      },
      {
        "path": "examples/static-files/public",
        "type": "tree"
      },
      {
        "path": "examples/static-files/public/css",
        "type": "tree"
      },
      {
        "path": "examples/static-files/public/css/style.css",
        "type": "blob"
      },
      {
        "path": "examples/static-files/public/hello.txt",
        "type": "blob"
      },
      {
        "path": "examples/static-files/public/js",
        "type": "tree"
      },
      {
        "path": "examples/static-files/public/js/app.js",
        "type": "blob"
      },
      {
        "path": "examples/vhost",
        "type": "tree"
      },
      {
        "path": "examples/vhost/index.js",
        "type": "blob"
      },
      {
        "path": "examples/view-constructor",
        "type": "tree"
      },
      {
        "path": "examples/view-constructor/github-view.js",
        "type": "blob"
      },
      {
        "path": "examples/view-constructor/index.js",
        "type": "blob"
      },
      {
        "path": "examples/view-locals",
        "type": "tree"
      },
      {
        "path": "examples/view-locals/index.js",
        "type": "blob"
      },
      {
        "path": "examples/view-locals/user.js",
        "type": "blob"
      },
      {
        "path": "examples/view-locals/views",
        "type": "tree"
      },
      {
        "path": "examples/view-locals/views/index.ejs",
        "type": "blob"
      },
      {
        "path": "examples/web-service",
        "type": "tree"
      },
      {
        "path": "examples/web-service/index.js",
        "type": "blob"
      },
      {
        "path": "index.js",
        "type": "blob"
      },
      {
        "path": "lib",
        "type": "tree"
      },
      {
        "path": "lib/application.js",
        "type": "blob"
      },
      {
        "path": "lib/express.js",
        "type": "blob"
      },
      {
        "path": "lib/request.js",
        "type": "blob"
      },
      {
        "path": "lib/response.js",
        "type": "blob"
      },
      {
        "path": "lib/utils.js",
        "type": "blob"
      },
      {
        "path": "lib/view.js",
        "type": "blob"
      },
      {
        "path": "package.json",
        "type": "blob"
      },
      {
        "path": "test",
        "type": "tree"
      },
      {
        "path": "test/Route.js",
        "type": "blob"
      },
      {
        "path": "test/Router.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance",
        "type": "tree"
      },
      {
        "path": "test/acceptance/auth.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/content-negotiation.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/cookie-sessions.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/cookies.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/downloads.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/ejs.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/error-pages.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/error.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/hello-world.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/markdown.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/multi-router.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/mvc.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/params.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/resource.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/route-map.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/route-separation.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/vhost.js",
        "type": "blob"
      },
      {
        "path": "test/acceptance/web-service.js",
        "type": "blob"
      },
      {
        "path": "test/app.all.js",
        "type": "blob"
      },
      {
        "path": "test/app.engine.js",
        "type": "blob"
      },
      {
        "path": "test/app.head.js",
        "type": "blob"
      },
      {
        "path": "test/app.js",
        "type": "blob"
      },
      {
        "path": "test/app.listen.js",
        "type": "blob"
      },
      {
        "path": "test/app.locals.js",
        "type": "blob"
      },
      {
        "path": "test/app.options.js",
        "type": "blob"
      },
      {
        "path": "test/app.param.js",
        "type": "blob"
      },
      {
        "path": "test/app.render.js",
        "type": "blob"
      },
      {
        "path": "test/app.request.js",
        "type": "blob"
      },
      {
        "path": "test/app.response.js",
        "type": "blob"
      },
      {
        "path": "test/app.route.js",
        "type": "blob"
      },
      {
        "path": "test/app.router.js",
        "type": "blob"
      },
      {
        "path": "test/app.routes.error.js",
        "type": "blob"
      },
      {
        "path": "test/app.use.js",
        "type": "blob"
      },
      {
        "path": "test/config.js",
        "type": "blob"
      },
      {
        "path": "test/exports.js",
        "type": "blob"
      },
      {
        "path": "test/express.json.js",
        "type": "blob"
      },
      {
        "path": "test/express.raw.js",
        "type": "blob"
      },
      {
        "path": "test/express.static.js",
        "type": "blob"
      },
      {
        "path": "test/express.text.js",
        "type": "blob"
      },
      {
        "path": "test/express.urlencoded.js",
        "type": "blob"
      },
      {
        "path": "test/fixtures",
        "type": "tree"
      },
      {
        "path": "test/fixtures/% of dogs.txt",
        "type": "blob"
      },
      {
        "path": "test/fixtures/.name",
        "type": "blob"
      },
      {
        "path": "test/fixtures/blog",
        "type": "tree"
      },
      {
        "path": "test/fixtures/blog/index.html",
        "type": "blob"
      },
      {
        "path": "test/fixtures/blog/post",
        "type": "tree"
      },
      {
        "path": "test/fixtures/blog/post/index.tmpl",
        "type": "blob"
      },
      {
        "path": "test/fixtures/broken.send",
        "type": "blob"
      },
      {
        "path": "test/fixtures/default_layout",
        "type": "tree"
      },
      {
        "path": "test/fixtures/default_layout/name.tmpl",
        "type": "blob"
      },
      {
        "path": "test/fixtures/default_layout/user.tmpl",
        "type": "blob"
      },
      {
        "path": "test/fixtures/email.tmpl",
        "type": "blob"
      },
      {
        "path": "test/fixtures/empty.txt",
        "type": "blob"
      },
      {
        "path": "test/fixtures/local_layout",
        "type": "tree"
      },
      {
        "path": "test/fixtures/local_layout/user.tmpl",
        "type": "blob"
      },
      {
        "path": "test/fixtures/name.tmpl",
        "type": "blob"
      },
      {
        "path": "test/fixtures/name.txt",
        "type": "blob"
      },
      {
        "path": "test/fixtures/nums.txt",
        "type": "blob"
      },
      {
        "path": "test/fixtures/pets",
        "type": "tree"
      },
      {
        "path": "test/fixtures/pets/names.txt",
        "type": "blob"
      },
      {
        "path": "test/fixtures/snow ☃",
        "type": "tree"
      },
      {
        "path": "test/fixtures/snow ☃/.gitkeep",
        "type": "blob"
      },
      {
        "path": "test/fixtures/todo.html",
        "type": "blob"
      },
      {
        "path": "test/fixtures/todo.txt",
        "type": "blob"
      },
      {
        "path": "test/fixtures/user.ejs",
        "type": "blob"
      },
      {
        "path": "test/fixtures/user.html",
        "type": "blob"
      },
      {
        "path": "test/fixtures/user.tmpl",
        "type": "blob"
      },
      {
        "path": "test/fixtures/users",
        "type": "tree"
      },
      {
        "path": "test/fixtures/users/index.html",
        "type": "blob"
      },
      {
        "path": "test/fixtures/users/tobi.txt",
        "type": "blob"
      },
      {
        "path": "test/middleware.basic.js",
        "type": "blob"
      },
      {
        "path": "test/regression.js",
        "type": "blob"
      },
      {
        "path": "test/req.accepts.js",
        "type": "blob"
      },
      {
        "path": "test/req.acceptsCharsets.js",
        "type": "blob"
      },
      {
        "path": "test/req.acceptsEncodings.js",
        "type": "blob"
      },
      {
        "path": "test/req.acceptsLanguages.js",
        "type": "blob"
      },
      {
        "path": "test/req.baseUrl.js",
        "type": "blob"
      },
      {
        "path": "test/req.fresh.js",
        "type": "blob"
      },
      {
        "path": "test/req.get.js",
        "type": "blob"
      },
      {
        "path": "test/req.host.js",
        "type": "blob"
      },
      {
        "path": "test/req.hostname.js",
        "type": "blob"
      },
      {
        "path": "test/req.ip.js",
        "type": "blob"
      },
      {
        "path": "test/req.ips.js",
        "type": "blob"
      },
      {
        "path": "test/req.is.js",
        "type": "blob"
      },
      {
        "path": "test/req.path.js",
        "type": "blob"
      },
      {
        "path": "test/req.protocol.js",
        "type": "blob"
      },
      {
        "path": "test/req.query.js",
        "type": "blob"
      },
      {
        "path": "test/req.range.js",
        "type": "blob"
      },
      {
        "path": "test/req.route.js",
        "type": "blob"
      },
      {
        "path": "test/req.secure.js",
        "type": "blob"
      },
      {
        "path": "test/req.signedCookies.js",
        "type": "blob"
      },
      {
        "path": "test/req.stale.js",
        "type": "blob"
      },
      {
        "path": "test/req.subdomains.js",
        "type": "blob"
      },
      {
        "path": "test/req.xhr.js",
        "type": "blob"
      },
      {
        "path": "test/res.append.js",
        "type": "blob"
      },
      {
        "path": "test/res.attachment.js",
        "type": "blob"
      },
      {
        "path": "test/res.clearCookie.js",
        "type": "blob"
      },
      {
        "path": "test/res.cookie.js",
        "type": "blob"
      },
      {
        "path": "test/res.download.js",
        "type": "blob"
      },
      {
        "path": "test/res.format.js",
        "type": "blob"
      },
      {
        "path": "test/res.get.js",
        "type": "blob"
      },
      {
        "path": "test/res.json.js",
        "type": "blob"
      },
      {
        "path": "test/res.jsonp.js",
        "type": "blob"
      },
      {
        "path": "test/res.links.js",
        "type": "blob"
      },
      {
        "path": "test/res.locals.js",
        "type": "blob"
      },
      {
        "path": "test/res.location.js",
        "type": "blob"
      },
      {
        "path": "test/res.redirect.js",
        "type": "blob"
      },
      {
        "path": "test/res.render.js",
        "type": "blob"
      },
      {
        "path": "test/res.send.js",
        "type": "blob"
      },
      {
        "path": "test/res.sendFile.js",
        "type": "blob"
      },
      {
        "path": "test/res.sendStatus.js",
        "type": "blob"
      },
      {
        "path": "test/res.set.js",
        "type": "blob"
      },
      {
        "path": "test/res.status.js",
        "type": "blob"
      },
      {
        "path": "test/res.type.js",
        "type": "blob"
      },
      {
        "path": "test/res.vary.js",
        "type": "blob"
      },
      {
        "path": "test/support",
        "type": "tree"
      },
      {
        "path": "test/support/env.js",
        "type": "blob"
      },
      {
        "path": "test/support/tmpl.js",
        "type": "blob"
      },
      {
        "path": "test/support/utils.js",
        "type": "blob"
      },
      {
        "path": "test/utils.js",
        "type": "blob"
      },
      {
        "path": "test/view.js",
        "type": "blob"
      }
    ]
  },
  "license": {
    "ok": true,
    "spdxId": "MIT",
    "path": "LICENSE",
    "htmlUrl": "https://github.com/expressjs/express/blob/43fca52d28a422c8be48fd489cbd4f2d6152bab6/LICENSE"
  },
  "raw": {
    "package.json": "{\n  \"name\": \"express\",\n  \"description\": \"Fast, unopinionated, minimalist web framework\",\n  \"version\": \"5.3.0\",\n  \"author\": \"TJ Holowaychuk <tj@vision-media.ca>\",\n  \"contributors\": [\n    \"Aaron Heckmann <aaron.heckmann+github@gmail.com>\",\n    \"Ciaran Jessup <ciaranj@gmail.com>\",\n    \"Douglas Christopher Wilson <doug@somethingdoug.com>\",\n    \"Guillermo Rauch <rauchg@gmail.com>\",\n    \"Jonathan Ong <me@jongleberry.com>\",\n    \"Roman Shtylman <shtylman+expressjs@gmail.com>\",\n    \"Young Jae Sim <hanul@hanul.me>\"\n  ],\n  \"license\": \"MIT\",\n  \"repository\": \"expressjs/express\",\n  \"homepage\": \"https://expressjs.com/\",\n  \"funding\": {\n    \"type\": \"opencollective\",\n    \"url\": \"https://opencollective.com/express\"\n  },\n  \"keywords\": [\n    \"express\",\n    \"framework\",\n    \"sinatra\",\n    \"web\",\n    \"http\",\n    \"rest\",\n    \"restful\",\n    \"router\",\n    \"app\",\n    \"api\"\n  ],\n  \"dependencies\": {\n    \"accepts\": \"^2.0.0\",\n    \"body-parser\": \"^2.4.0\",\n    \"content-disposition\": \"^2.0.1\",\n    \"content-type\": \"^2.0.0\",\n    \"cookie\": \"^0.7.1\",\n    \"cookie-signature\": \"^1.2.1\",\n    \"debug\": \"^4.4.0\",\n    \"depd\": \"^2.0.0\",\n    \"encodeurl\": \"^2.0.0\",\n    \"escape-html\": \"^1.0.3\",\n    \"etag\": \"^1.8.1\",\n    \"finalhandler\": \"^2.1.0\",\n    \"fresh\": \"^2.0.0\",\n    \"http-errors\": \"^2.0.0\",\n    \"merge-descriptors\": \"^2.0.0\",\n    \"mime-types\": \"^3.0.0\",\n    \"on-finished\": \"^2.4.1\",\n    \"once\": \"^1.4.0\",\n    \"parseurl\": \"^1.3.3\",\n    \"proxy-addr\": \"^2.0.8\",\n    \"qs\": \"^6.16.0\",\n    \"range-parser\": \"^1.2.1\",\n    \"router\": \"^2.2.0\",\n    \"send\": \"^1.1.0\",\n    \"serve-static\": \"^2.2.0\",\n    \"statuses\": \"^2.0.1\",\n    \"type-is\": \"^2.1.0\",\n    \"vary\": \"^1.1.2\"\n  },\n  \"devDependencies\": {\n    \"after\": \"0.8.2\",\n    \"connect-redis\": \"^8.0.1\",\n    \"cookie-parser\": \"1.4.7\",\n    \"cookie-session\": \"2.1.1\",\n    \"ejs\": \"^3.1.10\",\n    \"eslint\": \"8.47.0\",\n    \"express-session\": \"^1.18.1\",\n    \"hbs\": \"4.4.0\",\n    \"marked\": \"^15.0.3\",\n    \"method-override\": \"3.0.0\",\n    \"mocha\": \"^11.7.5\",\n    \"morgan\": \"1.12.1\",\n    \"nyc\": \"^17.1.0\",\n    \"pbkdf2-password\": \"1.2.1\",\n    \"supertest\": \"^6.3.0\",\n    \"vhost\": \"~3.0.2\"\n  },\n  \"engines\": {\n    \"node\": \">= 18\"\n  },\n  \"files\": [\n    \"LICENSE\",\n    \"Readme.md\",\n    \"index.js\",\n    \"lib/\"\n  ],\n  \"scripts\": {\n    \"lint\": \"eslint .\",\n    \"lint:fix\": \"eslint . --fix\",\n    \"test\": \"mocha --require test/support/env --reporter spec --check-leaks test/ test/acceptance/\",\n    \"test-ci\": \"nyc --exclude examples --exclude test --exclude benchmarks --reporter=lcovonly --reporter=text npm test\",\n    \"test-cov\": \"nyc --exclude examples --exclude test --exclude benchmarks --reporter=html --reporter=text npm test\",\n    \"test-tap\": \"mocha --require test/support/env --reporter tap --check-leaks test/ test/acceptance/\"\n  }\n}\n"
  },
  "claims": [
    {
      "id": "c1",
      "text": "项目包含自动化测试",
      "template": "tests",
      "rule": "R1",
      "object": "tests/"
    },
    {
      "id": "c2",
      "text": "项目配置了 CI 流水线",
      "template": "ci",
      "rule": "R1",
      "object": ".github/workflows/"
    },
    {
      "id": "c3",
      "text": "项目采用 MIT 许可证",
      "template": "license",
      "rule": "R3",
      "object": "MIT"
    },
    {
      "id": "c4",
      "text": "项目有 Readme 文档",
      "template": "docs",
      "rule": "R1",
      "object": "Readme.md"
    },
    {
      "id": "c5",
      "text": "使用 supertest 做接口测试",
      "template": "framework",
      "rule": "R2",
      "object": "supertest"
    }
  ]
};
