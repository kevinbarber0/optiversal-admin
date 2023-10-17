# API Coding Conventions

Try to follow the style found in NextJS docs and other related libraries.

Prefer use of async/await vs promise chaining, e.g.

Do:
```
export default requireAuth(async (req, res) => {
  if (req.method === 'GET') {
    const result = await someAsyncOp();
    res.json(result);
  } else {
    res.status(404);
  }
});
```

Don't:
```
export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return someAsyncOp().then((result) => res.json(result));
  } else {
    res.status(404);
  }
});
```

Avoid using redundant `status(200)` which is the default status code, and don't return the `res` object.

Do:
```
res.json(result);
```

Don't
```
res.status(200).json();
return res.status(200).json(result);
return res.json(result);
```

## References

- Async/await handlers with auth helpers: https://github.com/auth0/nextjs-auth0/blob/main/EXAMPLES.md
