# MongoDB Atlas setup

Do not commit the real MongoDB username, password, or full connection string.

Use this shape for Render's `MONGODB_URI` secret:

```text
mongodb+srv://<db-user>:<url-encoded-password>@<cluster-host>/akiwa?retryWrites=true&w=majority
```

The `/akiwa` database name is required. If the password contains reserved URI characters such as `@`, `#`, `/`, `?`, `:`, `&`, or `%`, URL-encode it before saving the value in Render.
