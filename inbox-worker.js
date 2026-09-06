// MyDevKits inbox Worker: every email to hello@mydevkits.com goes to the Prospect Desk's inbox
// (desk.mydevkits.com/inbox) AND a copy is forwarded to Gmail.
//
// Set up once in Cloudflare (free plan is fine):
//   Workers & Pages > Create > Worker > name it "inbox" > paste this file > Deploy
//   Worker > Settings > Variables and Secrets > add:
//       DESK_KEY  (secret)  = the Prospect Desk API key (the DESK_API_KEY from the vault / ADD_KEYS)
//       FORWARD_TO (text)   = mydevkitshq@gmail.com   (leave out to stop the Gmail copy)
//   Email Routing > Routing rules > edit the "hello" rule > Action: Send to a Worker > pick "inbox" > Save
//   (do the same on the catch-all rule if you turned it on)

export default {
  async email(message, env, ctx) {
    // raw message -> base64
    const buf = await new Response(message.raw).arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    const raw = btoa(bin);

    // hand it to the desk (a failure here must not lose the email: we still forward below)
    try {
      await fetch("https://desk.mydevkits.com/api/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Inbox-Key": env.DESK_KEY || "" },
        body: JSON.stringify({ from: message.from, to: message.to, raw }),
      });
    } catch (e) {
      console.log("desk inbound failed: " + e);
    }

    if (env.FORWARD_TO) {
      await message.forward(env.FORWARD_TO);
    }
  },
};
