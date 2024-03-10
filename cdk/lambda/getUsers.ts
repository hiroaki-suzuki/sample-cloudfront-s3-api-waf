import { Handler } from 'aws-lambda';

export const handler: Handler = async () => {
  const responseBase = {
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };

  try {
    const users = await fetch('https://jsonplaceholder.typicode.com/users').then((response) =>
      response.json(),
    );
    return {
      ...responseBase,
      statusCode: 200,
      body: JSON.stringify({
        users: users,
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      ...responseBase,
      statusCode: 500,
      body: JSON.stringify({
        error: JSON.stringify(err),
      }),
    };
  }
};
