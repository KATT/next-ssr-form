import { assertOnServer } from "utils/assertOnServer";
import * as zod from "zod";
import { v4 } from "uuid";
assertOnServer("db.ts");

const db = {
  posts: [
    {
      id: "00000000-0000-0000-0000-000000000001",
      message: "hello",
      from: "alexdotjs",
      createdAt: new Date(2020, 12, 26),
    },
  ],
};

export module DB {
  export async function getAllPosts() {
    return db.posts;
  }

  export async function createPost(
    input: Omit<typeof db["posts"][number], "id" | "createdAt">,
  ) {
    db.posts.push({ ...input, id: v4(), createdAt: new Date() });
  }
}
