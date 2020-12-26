import { createPost } from "forms/createPostSchema.server";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/dist/client/router";
import { getPostBody } from "utils/getPostBody";
import { DB } from "../forms/db";

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;
export default function Home(props: Props) {
  const router = useRouter();
  const { formData } = props;
  return (
    <>
      <h1>Vanilla</h1>
      <p>
        Uses a standard <code>&lt;form&gt;</code> with the <code>action</code>
        -attribute to post to the same page. Form data is handled in{" "}
        <code>getServerSideProps</code> and feedback is passed through page
        props.
      </p>
      <h2>My Guestbook</h2>
      {props.posts.map((item) => (
        <article key={item.id}>
          <strong>
            From {item.from} at {item.createdAt.toLocaleDateString("sv-SE")}{" "}
            {item.createdAt.toLocaleTimeString("sv-SE").substr(0, 5)}:
          </strong>
          <p className='message'>{item.message}</p>
        </article>
      ))}
      <h3>Add post</h3>

      <form action='' method='post'>
        <p
          className={`field ${
            formData?.error?.fieldErrors["from"] ? "field--error" : ""
          }`}
        >
          <label>
            Your name:
            <br />
            <input
              type='text'
              name='from'
              defaultValue={!formData?.success ? formData?.input.from : ""}
            />
            {formData?.error?.fieldErrors.from && (
              <span className='field__error'>
                {formData?.error?.fieldErrors.from}
              </span>
            )}
          </label>
        </p>
        <p
          className={`field ${
            formData?.error?.fieldErrors["message"] ? "field--error" : ""
          }`}
        >
          <label>
            Your message:
            <br />
            <textarea
              name='message'
              defaultValue={!formData?.success ? formData?.input.message : ""}
            />
            {formData?.error?.fieldErrors.message && (
              <span className='field__error'>
                {formData?.error?.fieldErrors.message}
              </span>
            )}
          </label>
        </p>
        <p>
          <input type='submit' />
        </p>
        {formData?.success && (
          <p className='success'>Yay! Your entry was added</p>
        )}
        {formData?.error && (
          <p className='error'>Your message was not added.</p>
        )}
      </form>
    </>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const body = await getPostBody(ctx.req);
  const formData = body ? await createPost(body as any) : null;

  return {
    props: {
      posts: await DB.getAllPosts(),
      formData,
    },
  };
};
