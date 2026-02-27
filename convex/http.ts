import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify webhook secret
    const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const message = body.message;

    if (!message) {
      return new Response("OK", { status: 200 });
    }

    const from = message.from;
    const chatId = message.chat.id;

    // Extract photo file ID (largest size)
    let photoFileId: string | undefined;
    if (message.photo && message.photo.length > 0) {
      photoFileId = message.photo[message.photo.length - 1].file_id;
    }

    await ctx.runAction(internal.telegram.handleMessage, {
      telegramId: from.id,
      chatId,
      username: from.username,
      displayName: from.first_name + (from.last_name ? ` ${from.last_name}` : ""),
      text: message.text ?? message.caption,
      photoFileId,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
