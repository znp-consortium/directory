<h1 align="center">ZNP Directory</h1>

<!-- badges:start -->
<p align="center">
  <img alt="servers" src="https://img.shields.io/badge/servers-1-blue" />
  <img alt="operators" src="https://img.shields.io/badge/operators-1-blue" />
</p>
<!-- badges:end -->

Public directory of ZNP WS-powered carrier servers and the operators who run them.

## servers.json

```json
{
  "version": 1,
  "updated": "YYYY-MM-DD",
  "servers": [
    {
      "url": "wss://host.example",
      "operator": "operator-id",
      "region": "valencia-spain"
    }
  ]
}
```

| field     | type   | notes                                                   |
|-----------|--------|---------------------------------------------------------|
| url       | string | `ws://` or `wss://`; clients prefer TLS                 |
| operator  | string | must match an `operators[].id`                          |
| region    | string | city-country  |

## operators.json

```json
{
  "version": 1,
  "updated": "YYYY-MM-DD",
  "operators": [
    {
      "id": "operator-id",
      "name": "Human-Readable Name",
      "description": "One or two sentences about who runs this and why.",
      "contact": "ops@example.org",
      "website": "example.org",
      "location": {
        "region": "dublin-ireland",
        "country": "IE",
        "city": "Dublin"
      },
      "servers": ["wss://host.example:443"],
      "policies": {
        "logging": "none | metadata | full",
        "retention": "none | 7d | 30d | ...",
        "jurisdiction": "IE",
        "tos": "https://example.org/tos"
      }
    }
  ]
}
```

| field        | type            | notes                                                          |
|--------------|-----------------|----------------------------------------------------------------|
| id           | string          | stable slug; referenced from `servers[].operator`              |
| name         | string          | display name                                                   |
| description  | string          | what they do and why                                           |
| contact      | string          | email, matrix handle, or `n/a`                                 |
| website      | string \| null  | optional homepage                                              |
| location     | object          | `region`, `country` (ISO-3166), `city` required       |
| servers      | string[]        | urls from `servers.json` they run                              |
| policies.logging    | string   | one of `no`, `metadata`, `full`                             |
| policies.retention  | string   | duration string or `no`                                      |
| policies.jurisdiction | string \| null | legal jurisdiction for lawful requests                 |
| policies.tos | string \| null  | link to terms of service or `no`                               |

## Adding your server

1. Fork this repo.
2. Add or update your entry in `operators.json`. Make sure your `id` is unique, lowercase, `[a-z0-9-]+`.
3. Add each of your endpoints to `servers.json`, referencing your operator `id`, and list the same URLs in your operator's `servers` array.
4. Bump the top-level `updated` date in both files.
5. Open a pull request.

## Removing a server

Open a PR that deletes the `servers.json` entry and removes the url from the operator's `servers` array. Operators with no remaining servers may either stay (with an empty `servers: []`) or be removed.
