## 2025-05-15 - [MONGO_URI Sanitization and Encoding]
**Vulnerability:** Information leakage through unmasked MongoDB URI in error logs and connection failure due to unencoded special characters in credentials.
**Learning:** Copy-pasted URIs from MongoDB Atlas often contain trailing characters (like `>`) or unencoded special characters in passwords that trigger `EBADNAME` or `querySrv` errors.
**Prevention:** Use a `safeEncode` utility to percent-encode credentials exactly once and a robust masking pattern (splitting by the last `@`) to ensure credentials are never logged in plain text.
