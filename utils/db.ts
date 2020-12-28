import { assertOnServer } from "utils/assertOnServer";
import { v4 } from "uuid";
assertOnServer("db.ts");

const db = {
  posts: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      message: "hello",
      from: "alexdotjs",
      createdAt: new Date(2020, 12, 26).toJSON(),
    },
  ],
};

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;
export module DB {
  export async function getAllPosts() {
    return db.posts;
  }

  export async function createPost(
    input: Omit<typeof db["posts"][number], "id" | "createdAt">,
  ) {
    const post = { ...input, id: v4(), createdAt: new Date().toJSON() };

    db.posts.push(post);
    if (SLACK_WEBHOOK) {
      fetch(SLACK_WEBHOOK, {
        method: "post",
        body: JSON.stringify({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*From _${post.from}_*:\n${post.message}`,
              },
            },
          ],
        }),
        headers: {
          "Content-type": "application/json",
        },
      }).catch((err) => {
        console.error("Slack webhook failed", err);
      });
    }
    return post;
  }
}
