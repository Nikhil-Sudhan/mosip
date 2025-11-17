# Data directory

Runtime JSON files live here:

- `users.json` – user records with hashed passwords.
- `sessions.json` – refresh token store (hashed tokens).

These files are generated automatically if they do not exist when the server boots. They are ignored by git to keep secrets out of the repo.

