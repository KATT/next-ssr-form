import { v4 } from 'uuid';
import { assertOnServer } from 'next-ssr-form';
assertOnServer('db.ts');

type Rating = '1' | '2' | '3' | '4' | '5';
type DBUser = {
  id: string;
  message: string;
  from: string;
  createdAt: string;
  twitter?: undefined | string;
  rating?: undefined | Rating;
};

const db = {
  posts: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      message: 'hello',
      from: 'alexdotjs',
      twitter: 'alexdotjs',
      createdAt: new Date(2020, 12, 26).toJSON(),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      message: 'world',
      from: 'alexdotjs',
      createdAt: new Date(2020, 12, 26).toJSON(),
    },
  ] as DBUser[],
};

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;

type PostInput = Omit<typeof db['posts'][number], 'id' | 'createdAt'>;
async function postToSlack(post: PostInput) {
  if (!SLACK_WEBHOOK) {
    console.log('No webhook setup - not posting to slack');
    return;
  }
  try {
    fetch(SLACK_WEBHOOK, {
      method: 'post',
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*From _${post.from}_*:\n${post.message}`,
            },
          },
        ],
      }),
      headers: {
        'Content-type': 'application/json',
      },
    });
    console.log('Posted to slack');
  } catch (err) {
    console.error('Post to slack failed', err);
  }
}
export module DB {
  export async function getAllPosts() {
    return db.posts;
  }

  export async function createPost(input: PostInput) {
    const post = { ...input, id: v4(), createdAt: new Date().toJSON() };

    db.posts.push(post);
    await postToSlack(input);
    return post;
  }
}
