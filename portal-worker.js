// MyDevKits client login on the main site.
// A tiny Cloudflare Worker: anything under mydevkits.com/portal (and /login, and the demo-site
// contact forms at /api/form) is quietly served by the Prospect Desk on desk.mydevkits.com.
// Clients only ever see mydevkits.com. Nothing else on the site touches this Worker.
//
// Set up once in the Cloudflare dashboard (free plan is fine):
//   Workers & Pages > Create > Worker > name it "portal" > paste this file > Deploy
//   then Worker > Settings > Domains & Routes > Add route, three times, zone mydevkits.com:
//       mydevkits.com/portal*
//       mydevkits.com/login*
//       mydevkits.com/api/form*
// No variables, no KV, nothing else.

const UPSTREAM = "https://desk.mydevkits.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // mydevkits.com/login -> the portal sign-in page (short, easy to say on the phone)
    if (url.pathname === "/login" || url.pathname === "/login/") {
      return Response.redirect(url.origin + "/portal/login", 302);
    }

    // Everything else: pass the request straight through and hand the answer back untouched
    // (cookies, redirects and uploads included). Redirects come back relative, so they stay
    // on mydevkits.com.
    const target = new URL(url.pathname + url.search, UPSTREAM);
    const upstream = new Request(target.toString(), request);
    upstream.headers.set("X-Forwarded-Host", url.host);
    upstream.headers.set("X-Forwarded-Proto", "https");
    return fetch(upstream, { redirect: "manual" });
  },
};
