# MongoDB Atlas connection notes

Use a Render Environment Variable for the production connection. Do not store
the username, password, or complete URI in this file or in source control.

```text
MONGODB_URI=mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/akiwa?appName=Cluster0&retryWrites=true&w=majority
```

The application reads `MONGODB_URI` from the environment. Local development
loads it from `backend/.env`; Render production must have the same variable
configured in the service Environment settings.