# Article upload format

Review each article, then upload it from `/admin/articles`. The upload is an
authenticated server-side mutation and records an audit entry. `DRAFT` articles
are not public, indexed, included in the sitemap, RSS, or `llms.txt`.

Required frontmatter: `title` and `description`. Supported optional fields are
`slug`, `author`, `category`, `tags`, `keywords`, and `status`. Comma-separated
lists and bracketed comma-separated lists are accepted. The content must be at
least 200 characters and start with H2 because the page title is the only H1.

Set `status: PUBLISHED` only after editorial and factual review. Uploading the
same slug updates the existing article instead of creating a duplicate.
